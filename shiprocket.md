# Shiprocket Shipping Integration — Full Analysis

> **Project:** Kidora Kart (Toy Shop)
> **Status:** ✅ Core integration complete. Critical gaps fixed (cancellation + RTO + order ID persistence).
> **Last Updated:** July 26, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Variables](#2-environment-variables)
3. [Order-to-Shipment Flow](#3-order-to-shipment-flow)
4. [Shipping Estimate at Checkout](#4-shipping-estimate-at-checkout)
5. [Tracking & Status Updates](#5-tracking--status-updates)
6. [Payment Handling](#6-payment-handling)
7. [Order Cancellation Flow](#7-order-cancellation-flow)
8. [Webhook Integration](#8-webhook-integration)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Gaps & Missing Features](#11-gaps--missing-features)
12. [Recommendations](#12-recommendations)

---

## 1. Architecture Overview

```
┌─────────────────────┐     ┌────────────────────────────┐     ┌─────────────────────┐
│    Web Frontend     │     │     Express API Server      │     │     Shiprocket      │
│  (Next.js :3000)   │────▶│       (Node.js :5000)       │────▶│    (apiv2.apiary)   │
│                     │     │                            │     │                     │
│ • Checkout page     │     │  lib/shiprocket.ts          │     │ • Auth (JWT)        │
│ • Tracking page     │     │    ↳ 14 Shiprocket methods  │     │ • Create Order      │
│ • Admin panel       │     │    ↳ Auth with auto-refresh │     │ • Create Shipment   │
│                     │     │    ↳ Build payload helpers  │     │ • Track Shipment    │
│                     │     │                            │     │ • Cancel Order      │
│                     │     │  controller/               │     │ • Serviceability    │
│                     │     │    ↳ shiprocket.controller │     │ • Labels/Invoices   │
│                     │     │    ↳ order.controller       │     │ • Webhooks          │
│                     │     │    ↳ order.webhook          │     │                     │
└─────────────────────┘     └────────────────────────────┘     └─────────────────────┘
                                     │
                                     ▼
                            ┌────────────────────┐
                            │     MongoDB        │
                            │  (Orders collection)│
                            └────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `api/src/lib/shiprocket.ts` | Core Shiprocket API client — all HTTP calls to Shiprocket (17 methods) |
| `api/src/controller/web/shiprocket.controller.ts` | Express handlers for shipping operations |
| `api/src/routes/web/shiprocket.routes.ts` | Route definitions |
| `api/src/controller/web/order.controller.ts` | Order creation, payment, cancellation |
| `api/src/controller/web/order.webhook.ts` | Razorpay webhook handlers (for payment events) |
| `api/src/config/env.ts` | Environment variable schema |
| `web/src/components/track/ShiprocketTrackingStatus.tsx` | Frontend tracking status display |
| `web/src/app/(sections)/Track.tsx` | Order tracking page |

---

## 2. Environment Variables

```env
# ── Required for Shiprocket Integration ──
SHIPROCKET_EMAIL=your-shiprocket-account@email.com
SHIPROCKET_PASSWORD=your-shiprocket-password

# ── Optional: Pre-fetched Shiprocket JWT (bypasses login) ──
SHIPROCKET_TOKEN=eyJ...
```

**Note:** If `SHIPROCKET_TOKEN` is set, the system uses it directly and skips the login API call. The token is cached in-memory with a 9-day refresh window. If only email/password are provided, it logs in on the first request and caches the token.

---

## 3. Order-to-Shipment Flow

The full flow from checkout to shipped order involves **6 sequential stages** (stages 1-6). If an order needs to be cancelled after shipping, see the extended flow in §7 which now covers stage 7 (Cancellation) and stage 8 (RTO).

### Stage 1: Checkout (User-Side)

```
User → Checkout Page → POST /api/website/orders/create
```

- User provides `shippingAddress` (pincode, city, state, etc.)
- Cart items are validated against DB (stock, price, availability)
- Order is created with status `"pending"`
- Shipping charge is calculated during this step (see §4)

### Stage 2: Payment (Razorpay)

```
User → Razorpay Checkout → POST /api/website/orders/verify-payment
```

- Razorpay order is created with amount matching order total
- On successful payment, order status changes to `"confirmed"`
- Stock is deducted from products
- Confirmation email is sent

At this point the order is ready for shipping.

### Stage 3: Admin Creates Shipment

```
Admin Panel → POST /api/website/shipping/create { orderId }
```

**Pre-conditions (all checked):**
- ✅ Order exists in DB
- ✅ Order status is `"confirmed"` (rejects pending/shipped/delivered)
- ✅ No existing tracking number (rejects duplicate shipments)

**The process:**
1. **Fetch product weights** from DB (stored in grams, converted to kg)
2. **Build Shiprocket payload** using `buildShiprocketOrderPayload()` helper
3. **Step 1: Create Order** in Shiprocket → `POST /orders/create/adhoc`
   - Gets back a Shiprocket `order_id` (numeric)
4. **Step 2: Create Shipment** → `POST /shipments/create`
   - Assigns courier partner, generates AWB number
   - Gets back `awb_code`, `shipment_id`, `courier_name`
5. **Step 3: Generate Label** → `POST /generate/label`
   - Gets back PDF label URL
6. **Step 4: Generate Invoice** → `POST /generate/invoice`
   - Gets back invoice URL
7. **Update order in database:**
   - `shipping.carrier` = courier name
   - `shipping.trackingNumber` = AWB code
   - `shipping.trackingUrl` = Shiprocket tracking URL
   - `invoice.invoiceUrl` = invoice PDF URL
   - `status` = `"shipped"`
   - Optionally updates `pricing.shipping` if Shiprocket returns actual rate

### Stage 4: Pickup by Courier

- **Admin can now schedule pickup directly from the admin panel** via `POST /api/website/shipping/pickup`
- The endpoint calls Shiprocket's `generatePickup()` API to schedule physical pickup from the configured location
- Admin panel shows a "Schedule Pickup" button (emerald green) for orders with `status === "shipped"` and a `shiprocketShipmentId`
- Returns pickup status, scheduled date, and pickup token number

**Admin Panel Flow:**
```
Order Drawer → "Schedule Pickup" button → POST /api/website/shipping/pickup { orderId }
  → Shiprocket generates pickup → Toast: "Pickup scheduled for 2026-07-27"
```

### Stage 5: In Transit

- Shiprocket sends webhook updates as the package moves through the network
- Tracking page fetches live status via `GET /track/:orderId`

### Stage 6: Delivery

**Delivery can be completed via 3 paths:**

| Path | Trigger | How |
|------|---------|-----|
| **Auto** | Shiprocket webhook | Webhook with status "Delivered" → auto-updates to `"delivered"` |
| **Auto** | Tracking API call | `GET /track/:orderId` detects "Delivered" → auto-updates |
| **Manual** | Admin panel | Admin clicks "Mark Delivered" → `POST /api/admin/orders/deliever/order` |

---

## 4. Shipping Estimate at Checkout

The system calculates shipping costs at checkout using Shiprocket's **serviceability API**.

### Flow:

```
Checkout Page → POST /api/website/shipping/estimate
```

**Request:**
```json
{
  "deliveryPincode": "302001",
  "items": [{ "productId": "...", "quantity": 1 }],
  "isCod": false
}
```

**What happens server-side:**

1. Fetch product weights from DB for the given items
2. Convert weights from grams to kilograms
3. Get pickup location pincode from Shiprocket (`getPickupLocations()`)
4. Call Shiprocket's `checkServiceability()` with origin pincode, delivery pincode, total weight, COD flag
5. Find the **cheapest courier** from the response
6. Return the estimate

**Fallback behavior:**
- If Shiprocket returns no couriers → returns `{ available: false, fallbackCharge: 50 }`
- If the call fails entirely → returns `{ available: false, fallbackCharge: 50 }`
- If no pickup locations configured → falls back to `342005` (Jodhpur)

**Also used in order creation:** The `createOrder` handler also performs a server-side shipping estimate as a fallback if the frontend doesn't provide one. This uses the same `checkServiceability()` + `getPickupLocations()` pattern.

---

## 5. Tracking & Status Updates

### Public Tracking Page

```
User → GET /api/website/shipping/track/:orderId [requires auth]
```

**What happens:**
1. Looks up order by `orderId`
2. Fetches live tracking from Shiprocket via `trackShipment(awb)`
3. Returns:
   - `trackingNumber` (AWB)
   - `trackingUrl` (Shiprocket tracking link)
   - `carrier` (courier name)
   - `currentStatus` (from DB)
   - `shiprocketTracking` (raw Shiprocket tracking data)

### Auto-Status Updates (Critical Feature)

When the **tracking API** detects the below statuses, it **auto-updates the database**:

| Shiprocket Status | DB Action |
|-------------------|-----------|
| `"Delivered"` | Sets `status: "delivered"`, `shipping.deliveredAt: now`, updates payment status |
| `"Cancelled"` | Sets `status: "cancelled"` |

### Frontend Display

The `ShiprocketTrackingStatus` component renders:
- **Delivered** → Green badge
- **In Transit / Out for Delivery** → Blue badge
- **Other** → Amber badge
- **EDD** (Estimated Delivery Date) → Shown if available

---

## 6. Payment Handling

Payment is handled via **Razorpay**, not Shiprocket. Shiprocket is purely a shipping/logistics partner.

### Payment Methods & Impact on Shipping

| Payment Method | Order Flow | `payment_method` to Shiprocket |
|---------------|------------|-------------------------------|
| **Razorpay (Card/UPI/Netbanking)** | Pay online → order confirmed → create shipment | `"Prepaid"` |
| **COD (Cash on Delivery)** | Order created → COD advance (optional) → shipment created | `"COD"` |
| **COD + Advance** | Pay ₹100 or 10% online → rest on delivery | `"Prepaid"` (because partial payment is made) |

### How `payment_method` is determined for Shiprocket:

```typescript
// In shiprocket.controller.ts
paymentMethod: order.payment?.method === "cod" ? "COD" : "Prepaid"
```

**Important:** Shiprocket uses this to determine whether to collect payment from the customer (COD) or not (Prepaid). Incorrectly marking a prepaid order as COD could cause Shiprocket to attempt cash collection.

### Payment Webhooks (Razorpay)

Razorpay sends webhooks for:
- `payment.captured` → Order confirmed, stock deducted
- `payment.failed` → Order marked as failed
- `refund.created` → Refund initiated
- `refund.processed` → Refund completed

These are handled in `order.webhook.ts` and are separate from Shiprocket's tracking webhooks.

---

## 7. Order Cancellation Flow

### Current State: ✅ FULLY IMPLEMENTED

There are **three cancellation paths**, all of which now integrate with Shiprocket:

### Path A: Admin Cancels Order (Fully Integrated)
```
Admin Panel → POST /api/admin/orders/cancel-by-admin
Body: { orderId, reason, autoRto?: boolean }
↓
order.controller.ts: cancelOrderByAdmin()
↓
Step 1: Check if order has shiprocketOrderId
  ├─ No → Skip Shiprocket, proceed to refund
  └─ Yes → Step 2: Call shiprocketCancelOrRto([shiprocketOrderId])
              ├─ Cancelled ✅ → Log success, proceed
              ├─ Not cancelled + needsRto + autoRto=true
              │     → Call shiprocketRequestRto() → RTO initiated
              └─ Not cancelled + needsRto + autoRto=false
                    → Return 409: "Use RTO endpoint"
              └─ Not cancelled + no RTO → Log failure, continue
Step 3: Initiate Razorpay refund (if payment was captured)
Step 4: Restore product stock
Step 5: Update order status to "cancelled" in DB
```

### Path B: Shiprocket Cancel Endpoint (Now Functional)
```
POST /api/website/shipping/cancel
Body: { orderId }
↓
shiprocket.controller.ts: cancelShippingOrder()
↓
1. Checks Shiprocket order status via getShipmentStatus()
2. If already delivered → 400 error
3. If cancellable → Calls Shiprocket cancelOrder API → 200
4. If already picked up → Returns 409 with needsRto: true
5. Otherwise → Returns error with details
```

### Path C: Unified Cancel + RTO Endpoint (New)
```
POST /api/website/shipping/cancel-or-rto
Body: { orderId, autoRto?: boolean }
↓
shiprocket.controller.ts: cancelOrRto()
↓
1. Checks shipment status (delivered → reject)
2. Attempts Shiprocket cancel
3. If cancel fails + needsRto + autoRto=true → Auto-initiate RTO
4. Returns action taken: "cancelled" | "rto" | "none" | "failed"
```

### Shiprocket Library Methods (Now All Connected)

| Function | Used? | Purpose |
|----------|-------|---------|
| `cancelOrder()` | ✅ Via `cancelOrderOrRto()` | Cancel order in Shiprocket |
| `cancelOrderOrRto()` | ✅ | Intelligent cancel — detects if RTO is needed |
| `requestReturnOrder()` | ✅ | Initiate RTO when shipment already picked up |
| `getShipmentStatus()` | ✅ | Check current shipment state before cancelling |

### Cancellation Logic Diagram

```mermaid
flowchart TD
    A[Admin cancels order] --> B{Has shiprocketOrderId?}
    B -->|No| C[Mark as cancelled in DB + refund]
    B -->|Yes| D{Check shipment status via getShipmentStatus}
    D -->|Delivered| E[400: Cannot cancel, already delivered]
    D -->|Pickable|cancellable| F[Call cancelOrderOrRto API]
    F -->|Success| G[Mark as cancelled + refund]
    F -->|"needsRto: true"| H{autoRto enabled?}
    H -->|Yes| I[Call requestReturnOrder → RTO initiated]
    H -->|No| J[Return 409: use RTO endpoint]
    I --> K[Update DB: rtoRequested, rtoStatus]
    K --> L[Package returns to origin warehouse]
```

### RTO Endpoint (New)
```
POST /api/website/shipping/rto
Body: { orderId }
↓
shiprocket.controller.ts: requestRtoForOrder()
↓
1. Validates order exists and has shiprocketOrderId
2. Checks current status (rejects if already delivered)
3. Calls Shiprocket RTO API: POST /orders/create/rto
4. Updates DB: rtoRequested=true, rtoOrderId, rtoStatus
5. Order status set to "cancelled"
```

### Cancellation Limitations (Shiprocket API)

According to Shiprocket API docs:
- Orders can only be cancelled **before pickup**
- Once the courier picks up the package, cancellation is **not possible** → must request RTO (Return to Origin)
- RTO creates a return order that brings the package back to the warehouse
- After RTO is delivered back, a separate refund can be processed

---

## 8. Webhook Integration

There are **two separate webhooks** in this system. One for Shiprocket (tracking updates) and one for Razorpay (payment events).

### Shiprocket Webhook

```
POST /api/website/shipping/webhook
```

The Shiprocket webhook receives real-time tracking updates when shipment status changes. It automatically updates the order status in the database.

#### Setup Instructions (Step by Step)

1. **Log in to Shiprocket Dashboard**
   - Go to [https://app.shiprocket.in](https://app.shiprocket.in) and log in with your credentials

2. **Navigate to Webhook Settings**
   - Click **Settings** (gear icon, top-right corner)
   - Go to the **API** section in the left sidebar
   - Click the **Webhooks** tab

3. **Add the Webhook URL**
   - Click **"Add Webhook"** button
   - Paste your webhook URL:
     ```
     POST https://your-api-domain.com/api/website/shipping/webhook
     ```
     Replace `your-api-domain.com` with your actual server domain.
     
     **For local development testing:** You can use a tool like **ngrok** to expose your local server:
     ```bash
     ngrok http 5000
     # Then use: https://your-ngrok-id.ngrok.io/api/website/shipping/webhook
     ```

4. **Select Events to Watch**
   - Shiprocket sends all status updates by default — no event selection needed
   - The webhook triggers for: `Delivered`, `Cancelled`, `Shipped`, `In Transit`, `Out for Delivery`, `Pickup Generated`, `Returned`, `RTO`

5. **Save the Webhook**
   - Click **Save** to add the webhook URL
   - Ensure the toggle switch is **enabled** (green)

6. **Test the Webhook**
   - Shiprocket provides a **"Test"** button that sends a sample payload
   - You can also verify using the admin endpoint:
     ```
     GET /api/website/shipping/webhook/verify
     Headers: Authorization: Bearer <admin-token>
     ```
     This returns the configured webhook URL and Shiprocket auth status.

7. **Verify in Server Logs**
   - After saving, check your server logs for:
     ```
     "Shiprocket webhook received"
     ```
   - Click **"Test"** in Shiprocket Dashboard to send a sample — you should see the log entry

#### Payload Format

Shiprocket sends the following payload when a tracking status changes:
```json
{
  "awb": 59629792084,
  "current_status": "Delivered",
  "order_id": "13905312",
  "current_timestamp": "2021-07-02 16:41:59",
  "etd": "2021-07-02 16:41:59",
  "current_status_id": 7,
  "shipment_status": "Delivered",
  "shipment_status_id": 7,
  "channel_order_id": "123456",
  "channel": "Kidora Kart",
  "courier_name": "Delhivery",
  "scans": [
    {
      "date": "2021-06-25 12:08:00",
      "activity": "SHIPMENT PICKED UP",
      "location": "JODHPUR"
    },
    {
      "date": "2021-06-26 09:30:00",
      "activity": "IN TRANSIT",
      "location": "DELHI"
    },
    {
      "date": "2021-06-27 14:15:00",
      "activity": "SHIPMENT DELIVERED",
      "location": "PATIALA"
    }
  ]
}
```

#### Status Mapping

The webhook handler maps Shiprocket statuses to internal order statuses:

| Shiprocket Status | DB Action | Details |
|-------------------|-----------|---------|
| `"Delivered"` | `status: "delivered"` | Sets `shipping.deliveredAt`. For COD orders, also sets `payment.status: "completed"` and `payment.paidAt` |
| `"Cancelled"` / `"Canceled"` / `"Returned"` / `"RTO"` | `status: "cancelled"` | Shipment cancelled or returned to origin |
| `"Shipped"` / `"In Transit"` / `"Out for Delivery"` / `"Pickup Generated"` | `status: "shipped"` | Only updates if current status is `"confirmed"`. Sets `shipping.shippedAt` |

#### Additional Behaviors

- **AWB Lookup:** The webhook looks up the order by `shipping.trackingNumber` (AWB code)
- **Courier Name:** If the webhook includes a `courier_name` and the order doesn't have one, it's saved
- **Shiprocket Order ID:** If the webhook includes an `order_id` (Shiprocket's internal ID) and we haven't stored one yet, it's saved to `shipping.shiprocketOrderId`
- **Status History:** Every status change is recorded in `order.statusHistory` for full audit trail
- **Error Handling:** Always returns HTTP 200 even on errors (per webhook best practices). Errors are logged for investigation
- **Duplicate Protection:** The handler checks `order.status !== "delivered"` / `order.status !== "cancelled"` before updating, preventing duplicate updates

#### Webhook Test/Verify Endpoint

```
GET /api/website/shipping/webhook/verify [Admin Only]
```

Returns the current webhook configuration status:
```json
{
  "success": true,
  "data": {
    "webhookUrl": "https://your-api.com/api/website/shipping/webhook",
    "configured": true,
    "tokenValid": true,
    "tokenError": null,
    "timestamp": "2026-07-26T12:00:00.000Z",
    "setupInstructions": [
      "1. Go to https://app.shiprocket.in → Settings → API → Webhooks",
      "2. Add webhook URL: https://your-api.com/api/website/shipping/webhook",
      "3. Enable the webhook toggle",
      "4. Click 'Test' to send a sample payload",
      "5. Check server logs for 'Shiprocket webhook received' message"
    ]
  }
}
```

#### Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Webhook not received | Firewall blocking Shiprocket IPs | Whitelist Shiprocket IPs or disable IP restrictions |
| Order not found by AWB | AWB mismatch | Check `shipping.trackingNumber` in DB matches the AWB in the webhook payload |
| Status not updating | Status already set | Check `order.status` — webhook only updates on transition (e.g., `"confirmed"`→`"shipped"`, not `"shipped"`→`"shipped"`) |
| SSL/TLS errors | Self-signed certificate | Use a valid SSL certificate (Let's Encrypt or cloud proxy) |
| Webhook URL wrong | Trailing slash | Ensure no trailing slash in the webhook URL |

### Razorpay Webhook (Separate)

```
POST /api/website/orders/webhooks/razorpay
```

Handled in `order.webhook.ts` — processes payment events, refund events. **This is separate from the Shiprocket webhook.**

| Event | Handler | Action |
|-------|---------|--------|
| `payment.captured` | `handlePaymentCaptured` | Order confirmed, stock deducted |
| `payment.failed` | `handlePaymentFailed` | Order marked as failed |
| `refund.created` | `handleRefundCreated` | Refund initiated |
| `refund.processed` | `handleRefundProcessed` | Refund completed |
| `refund.failed` | `handleRefundFailed` | Refund failed |

---

## 9. API Endpoints Reference

### Shiprocket Endpoints

| Method | Path | Auth | Admin | Purpose |
|--------|------|------|-------|---------|
| `POST` | `/api/website/shipping/create` | ✅ | ✅ | Create order + shipment in Shiprocket (persists shiprocketOrderId) |
| `GET` | `/api/website/shipping/track/:orderId` | ❌ | ❌ | Track shipment via AWB — no auth required, guests can track by order ID |
| `POST` | `/api/website/shipping/cancel` | ✅ | ✅ | Cancel shipment on Shiprocket (✅ now functional) |
| `POST` | `/api/website/shipping/cancel-or-rto` | ✅ | ✅ | Unified cancel + RTO (auto-fallback) |
| `POST` | `/api/website/shipping/rto` | ✅ | ✅ | Initiate RTO (Return to Origin) |
| `GET` | `/api/website/shipping/pickup-locations` | ✅ | ✅ | Get pickup locations |
| `POST` | `/api/website/shipping/label` | ✅ | ✅ | Regenerate shipping label for a shipment |
| `POST` | `/api/website/shipping/invoice` | ✅ | ✅ | Regenerate shipping invoice for an order |
| `POST` | `/api/website/shipping/pickup` | ✅ | ✅ | Schedule courier pickup for a shipped order |
| `POST` | `/api/website/shipping/estimate` | ❌ | ❌ | Get shipping cost estimate |
| `POST` | `/api/website/shipping/webhook` | ❌ | ❌ | Shiprocket tracking webhook |
| `GET` | `/api/website/shipping/webhook/verify` | ✅ | ✅ | Verify webhook configuration |

### Shiprocket Library Methods

| Method | Used? | Purpose |
|--------|-------|---------|
| `createOrder()` | ✅ | Create order in Shiprocket |
| `createShipment()` | ✅ | Assign courier + generate AWB |
| `generateLabel()` | ✅ | Generate shipping label PDF (also via `POST /label` admin endpoint) |
| `generateInvoice()` | ✅ | Generate invoice PDF (also via `POST /invoice` admin endpoint) |
| `trackShipment()` | ✅ | Track by AWB |
| `cancelOrder()` | ✅ | Cancel order in Shiprocket (via cancelOrderOrRto wrapper) |
| `cancelOrderOrRto()` | ✅ | Intelligent cancel — detects if RTO is needed |
| `requestReturnOrder()` | ✅ | Initiate RTO for shipments already in transit |
| `getShipmentStatus()` | ✅ | Check shipment state before cancelling |
| `checkServiceability()` | ✅ | Get courier rates by pincode |
| `getPickupLocations()` | ✅ | Get configured pickup addresses |
| `generatePickup()` | ✅ | Schedule pickup via `POST /api/website/shipping/pickup` |
| `assignAwb()` | ❌ | Manually assign AWB (unused) |
| `generateManifest()` | ❌ | Generate manifest PDF (unused) |
| `printManifest()` | ❌ | Print manifest (unused) |
| `printInvoice()` | ❌ | Print invoice PDF (unused) |
| `printLabel()` | ❌ | Print label PDF (unused) |

### Admin Order Endpoints (with shipping relevance)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/admin/orders/cancel-by-admin` | Cancel order + Shiprocket cancel + RTO + refund (body: `{ orderId, reason, autoRto? }`) |
| `POST` | `/api/admin/orders/deliever/order` | Mark order as delivered |
| `POST` | `/api/admin/orders/mark-to-shipped` | Mark order as shipped (manual) |

### Shiprocket Library Methods

| Method | Used? | Purpose |
|--------|-------|---------|
| `createOrder()` | ✅ | Create order in Shiprocket |
| `createShipment()` | ✅ | Assign courier + generate AWB |
| `generateLabel()` | ✅ | Generate shipping label PDF |
| `generateInvoice()` | ✅ | Generate invoice PDF |
| `trackShipment()` | ✅ | Track by AWB |
| `cancelOrder()` | ✅ | Cancel order in Shiprocket (via cancelOrderOrRto wrapper) |
| `cancelOrderOrRto()` | ✅ | Intelligent cancel — detects if RTO is needed |
| `requestReturnOrder()` | ✅ | Initiate RTO for shipments already in transit |
| `getShipmentStatus()` | ✅ | Check shipment state before cancelling |
| `checkServiceability()` | ✅ | Get courier rates by pincode |
| `getPickupLocations()` | ✅ | Get configured pickup addresses |
| `assignAwb()` | ❌ | Manually assign AWB (unused) |
| `generatePickup()` | ✅ | Schedule pickup via `POST /api/website/shipping/pickup` |
| `generateManifest()` | ❌ | Generate manifest PDF (unused) |
| `printManifest()` | ❌ | Print manifest (unused) |
| `printInvoice()` | ❌ | Print invoice PDF (unused) |
| `printLabel()` | ❌ | Print label PDF (unused) |

---

## 10. Edge Cases & Error Handling

### ✅ Handled

| Scenario | Handling |
|----------|----------|
| **Order not confirmed** | `createShippingOrder` rejects non-`"confirmed"` orders |
| **Duplicate shipment** | Checks for existing `trackingNumber`, returns 409 |
| **No shipping address** | Returns 400 with message |
| **Product weight missing** | Defaults to 0.5 kg per item |
| **Shiprocket auth fails** | Logs error, returns 502 |
| **Label generation fails** | Logs warning, continues without label |
| **Invoice generation fails** | Logs warning, continues without invoice |
| **Webhook with no AWB** | Logs warning, returns 200 |
| **Webhook order not found** | Logs warning, returns 200 |
| **Shipping estimate unavailable** | Returns fallback ₹50 charge |
| **Shiprocket API returns 401** | Auto-retries with fresh token (once) |
| **Delivery auto-detected via tracking API** | Updates DB automatically |
| **Cancellation auto-detected via tracking API** | Updates DB automatically |
| **COD vs Prepaid** | Correctly passed to Shiprocket payload |
| **No pickup locations configured** | Falls back to `342005` (Jodhpur) |
| **Shiprocket order ID persisted** | `shiprocketOrderId` and `shiprocketShipmentId` stored on order doc |
| **Shiprocket cancel via admin cancel** | `cancelOrderByAdmin` calls Shiprocket cancel before DB update |
| **RTO auto-fallback** | If cancel fails + `autoRto=true`, RTO is initiated automatically |
| **RTO manual endpoint** | `POST /rto` for cases where admin wants to trigger RTO separately |
| **Webhook handles RTO status** | `"rto"` and `"returned"` statuses auto-cancel the order |
| **Shipment status check before cancel** | `getShipmentStatus()` verifies not delivered before attempting cancel |

### ❌ NOT Handled (Gaps)

| Scenario | Impact | Severity |
|----------|--------|----------|
| ~~Cancelling order doesn't cancel in Shiprocket~~ | ✅ **FIXED** — Shiprocket cancel + RTO integrated |
| ~~Shiprocket order ID not stored in DB~~ | ✅ **FIXED** — `shipping.shiprocketOrderId` + `shipping.shiprocketShipmentId` persisted |
| ~~No RTO (Return to Origin) flow~~ | ✅ **FIXED** — RTO endpoint + auto-fallback in cancel flow |
| ~~**No pickup scheduling endpoint**~~ | ✅ **FIXED** — `POST /api/website/shipping/pickup` calls `generatePickup()` |
| ~~**Tracking endpoint is user-authenticated**~~ | ✅ **FIXED** — tracking is now public. Guests can track by order ID |
| **Shiprocket webhook not configured** | No auto-updates will reach the system | 🟡 Medium |
| **No health check endpoint** | Can't verify Shiprocket integration status | 🟢 Low |
| ~~**No endpoint to re-generate label/invoice**~~ | ✅ **FIXED** — `POST /label` and `POST /invoice` allow admins to regenerate |
| **No bulk shipment creation** | Can't create shipments for multiple orders at once | 🟢 Low |
| **No print manifest/label endpoint** | Library functions exist but no API exposed | 🟢 Low |

---

## 11. Gaps & Missing Features

### ✅ Critical Gaps — All Fixed

#### Gap 1: Order Cancellation Doesn't Cancel Shiprocket Shipment

**Status: ✅ FIXED**

The `cancelOrderByAdmin()` function now calls `cancelOrderOrRto()` from the Shiprocket library before cancelling in the DB. If the cancel succeeds, the order is marked cancelled. If it fails because the shipment is already picked up, the system either:
- Auto-initiates RTO (if `autoRto: true` is passed)
- Returns a 409 with `needsRto: true` asking the admin to use the `/rto` endpoint manually

**Files changed:**
- `api/src/controller/web/order.controller.ts` — Updated `cancelOrderByAdmin` with Shiprocket integration
- `api/src/controller/web/shiprocket.controller.ts` — Added `cancelShippingOrder` (real), `requestRtoForOrder`, `cancelOrRto`
- `api/src/routes/web/shiprocket.routes.ts` — Added `/cancel-or-rto` and `/rto` routes

#### Gap 2: No RTO (Return to Origin) Flow

**Status: ✅ FIXED**

Three new mechanisms for RTO:
1. **`POST /api/website/shipping/rto`** — Manual RTO trigger for admins
2. **`POST /api/website/shipping/cancel-or-rto`** — Unified endpoint that tries cancel first, auto-falls back to RTO
3. **`cancelOrderByAdmin` with `autoRto: true`** — Automatic RTO during admin cancellation if cancel is rejected
4. **Webhook** — Handles `"rto"` and `"returned"` statuses to auto-update the order

**Files changed:**
- `api/src/lib/shiprocket.ts` — Added `cancelOrderOrRto()`, `requestReturnOrder()`, `getShipmentStatus()`
- `api/src/controller/web/shiprocket.controller.ts` — RTO and cancel-or-rto handlers

#### Gap 3: Shiprocket Order ID Not Stored

**Status: ✅ FIXED**

Two new fields added to the `shipping` subdocument in the Order schema:
- `shipping.shiprocketOrderId` (Number) — Shiprocket's numeric order ID
- `shipping.shiprocketShipmentId` (Number) — Shiprocket's shipment ID
- `shipping.rtoRequested` (Boolean) — Whether RTO has been triggered
- `shipping.rtoOrderId` (Number) — Shiprocket's RTO order ID (if RTO was initiated)
- `shipping.rtoStatus` (String) — Current RTO status

**Files changed:**
- `api/src/models/order.ts` — Added 5 fields to shipping subdocument
- `api/src/controller/web/shiprocket.controller.ts` — `createShippingOrder` now persists these fields

---

## 12. Recommendations

### ✅ Completed
- [x] **Store Shiprocket order ID** — Added `shipping.shiprocketOrderId` + `shipping.shiprocketShipmentId` to Order schema, persisted in `createShippingOrder`
- [x] **Integrate cancellation** — `cancelOrderByAdmin()` now calls `cancelOrderOrRto()` before cancelling in DB
- [x] **Handle non-cancellable shipments (RTO)** — Added `requestReturnOrder()`, `/rto` endpoint, `cancelOrRto` unified handler, and `autoRto` parameter in admin cancel

### Priority 1 (High — Next)
- [x] **Expose pickup scheduling** — ✅ **DONE** — `POST /api/website/shipping/pickup` calls `generatePickup()` with admin panel button
- [x] **Make tracking public** — ✅ **DONE** — `GET /api/website/shipping/track/:orderId` no longer requires auth. Any user (guest or logged in) can track by providing their order ID.

### Priority 2 (Medium)
- [ ] **Add health check** — `GET /api/website/shipping/health` that pings Shiprocket auth and returns integration status
- [x] **Add re-generate label/invoice endpoint** — ✅ **DONE** — `POST /label` and `POST /invoice` endpoints with admin panel buttons
- [ ] **Add print endpoints** — Expose `printLabel()`, `printInvoice()`, `printManifest()` as admin API endpoints
- [ ] **Add Shiprocket manifest generation** — Expose manifest generation for bulk shipping preparation

### Priority 3 (Low)
- [ ] **Bulk shipment creation** — Allow creating shipments for multiple confirmed orders at once
- [ ] **Shipping charge audit** — Store Shiprocket-calculated charges vs actual charged amounts for reconciliation

---

## File Reference

| File | Lines | Key Classes/Functions |
|------|-------|----------------------|
| `api/src/lib/shiprocket.ts` | ~320 | `createOrder`, `createShipment`, `generateLabel`, `generateInvoice`, `trackShipment`, `cancelOrder`, `cancelOrderOrRto`, `requestReturnOrder`, `getShipmentStatus`, `checkServiceability`, `getPickupLocations`, `assignAwb`, `generatePickup`, `generateManifest`, `printManifest`, `printInvoice`, `printLabel`, `buildShiprocketOrderPayload`, `isShiprocketSuccess` |
| `api/src/controller/web/shiprocket.controller.ts` | ~560 | `createShippingOrder`, `trackShippingOrder`, `cancelShippingOrder`, `requestRtoForOrder`, `cancelOrRto`, `getShippingEstimate`, `shiprocketWebhook` |
| `api/src/routes/web/shiprocket.routes.ts` | ~130 | Route definitions + OpenAPI docs |
| `api/src/controller/web/order.controller.ts` | ~1000 | `createOrder`, `createRazorpayOrder`, `verifyPayment`, `retryPayment`, `cancelOrderByAdmin` (with Shiprocket integration) |
| `api/src/controller/web/order.webhook.ts` | ~200 | Razorpay webhook handlers (payment/refund) |
| `web/src/components/track/ShiprocketTrackingStatus.tsx` | ~35 | Frontend tracking badge component |
| `api/src/config/env.ts` | ~100 | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_TOKEN` |
