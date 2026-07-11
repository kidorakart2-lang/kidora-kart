# API — Express Backend

Express 5 + MongoDB REST API for the Kidora Kart e-commerce platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript (tsx for dev, tsc for build) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (15min) + refresh tokens (7-day, httpOnly cookies) with bcrypt |
| Payments | Razorpay SDK (orders, payments, refunds, webhooks) |
| Storage | Cloudflare R2 (S3-compatible) via @aws-sdk/client-s3 |
| Email | Nodemailer (Gmail SMTP) + EJS templates |
| Cache | node-cache (in-memory, per-instance) |
| Rate Limiting | express-rate-limit |
| Validation | Zod (env & body), Mongoose (schema) |
| File Upload | multer (5MB per file, 10 files max) |
| AI | Google Gemini API (product description generation, content helpers) |
| Shipping | Shiprocket API (order creation, tracking, webhooks, serviceability) |
| Logging | pino |
| Testing | Playwright (configured) |

## Project Structure

```
api/src/
├── server.ts            # Entry point — Express app factory
├── config/              # Env validation (Zod), Cloudflare config
├── controller/
│   ├── web/             # Customer-facing controllers (auth, orders, products, cart, wishlist, reviews)
│   │   └── shiprocket.controller.ts  # Shiprocket shipping integration
│   └── admin/           # Admin controllers (products, orders, users, banners, CMS)
├── lib/                 # Utilities (jwt, bcrypt, cache, cloudflare, slug, nodemailer, tokens, logger)
│   └── shiprocket.ts    # Shiprocket API client (auth, orders, tracking, serviceability)
├── middleware/           # authMiddleware (JWT verify + role check), rateLimit, uploadMiddleware
├── models/              # Mongoose schemas (18 models: user, product, order, cart, category, etc.)
├── routes/              # Express routers (web/ and admin/ namespaces)
│   └── web/
│       └── shiprocket.routes.ts  # Shiprocket route definitions with Swagger docs
├── types/               # Shared TypeScript types
├── utils/               # asyncHandler, responses (success/fail helpers)
└── views/               # EJS email templates
```

## API Namespaces

| Prefix | Auth Required | Purpose |
|--------|---------------|---------|
| `/api/website/*` | Varies | Customer-facing endpoints |
| `/api/admin/*` | Admin role | Admin dashboard endpoints |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | TypeScript compile to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm typecheck` | TypeScript check without emitting |
| `pnpm lint` | ESLint on src/ |
| `pnpm test` | Run Playwright tests |

## Environment Variables

Key vars in `api/.env` (gitignored). See `.env.example` for full reference:

```
NODE_ENV=development
PORT=5000
NEW_DB_URL=mongodb://localhost:27017/kidorakart
JWT_SECRET=your-jwt-secret-here                # ⚠️ Generate with: openssl rand -hex 64

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Brand (used in email templates, order IDs, receipts)
APP_NAME=Kidora Kart
SUPPORT_EMAIL=support@kidorakart.com
EMAIL_FROM_NAME=Kidora Kart

# Email (Gmail SMTP)
MY_GMAIL=your-email@gmail.com
MY_GMAIL_PASSWORD=your-app-password

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_BUCKET_NAME=...
CLOUDFLARE_PUBLIC_URL=...
CDN_HOST=cdn.kidorakart.com

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Google Gemini AI
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# Shiprocket (shipping / courier integration)
SHIPROCKET_EMAIL=your-shiprocket-api-user@example.com
SHIPROCKET_PASSWORD=your-shiprocket-api-password
# SHIPROCKET_TOKEN=   # Optional: pre-generated JWT (auto-refreshes on 401)

# Twilio (SMS)
TWILLO_VERIFY_SERVICE_SID=...
TWILLO_ACCOUNT_SID=...
TWILLO_AUTH_TOKEN=...

# Revalidation (shared secret with web frontend)
REVALIDATE_SECRET=...
```

---

## Shiprocket Shipping Integration

### Overview

The system integrates with Shiprocket's API (https://apidocs.shiprocket.in) for:
1. **Shipping cost estimation** — Live courier rates at checkout based on pincode + weight
2. **Order fulfillment** — Creating orders and shipments in Shiprocket
3. **Shipment tracking** — Fetching live tracking status by AWB number
4. **Status auto-updates** — Via webhook (Shiprocket notifies on status changes)

### Architecture

```
Checkout (Web)                     Admin Panel                    Shiprocket API
    |                                 |                               |
    |-- POST /shipping/estimate ---->|                               |
    |                                |--- GET /courier/serviceability/ -->|
    |<--- cheapest courier + rate ---|<--- courier list + rates --------|
    |                                                               |
    |                    Admin clicks "Ship with Shiprocket"         |
    |                                |                               |
    |                                |-- POST /shipping/create ---->|
    |                                |--- Step 1: POST /orders/create/adhoc -->|
    |                                |--- Step 2: POST /shipments/create ----->|
    |                                |--- Step 3: POST /generate/label ------->|
    |                                |--- Step 4: POST /generate/invoice ---->|
    |                                |                               |
    |                                |-- Order marked "shipped"     |
    |                                |-- AWB, carrier, label saved  |
    |                                                               |
                    ── Shipment Status Changes ──
                    Shiprocket sends POST to /shipping/webhook
                    → Order auto-updated (delivered/cancelled/shipped)
                    → Status history tracked
```

### Order Data Model (shipping-related fields)

The `Order` model stores the following shipping-related data on the `shipping` subdocument:

| Field | Type | Description | Populated by |
|-------|------|-------------|-------------|
| `shipping.carrier` | String | Courier name (e.g., "Xpressbees Air", "Delhivery Surface") | `createShippingOrder` controller, estimate endpoint |
| `shipping.trackingNumber` | String | AWB number assigned by Shiprocket | `createShippingOrder` controller |
| `shipping.trackingUrl` | String | URL to Shiprocket tracking page | `createShippingOrder` controller (e.g., `https://shiprocket.co/tracking/{AWB}`) |
| `shipping.estimatedDelivery` | Date | Estimated delivery date | `createOrder` controller (from checkout estimate) |
| `shipping.shippedAt` | Date | When the shipment was created | Webhook handler (status = "shipped"/"in transit") |
| `shipping.deliveredAt` | Date | When delivery was confirmed | Webhook handler or track endpoint (status = "Delivered") |

Additionally, the `pricing.shipping` field stores the final shipping charge, and `invoice.invoiceUrl` stores the Shiprocket-generated invoice PDF URL.

### API Endpoints

All Shiprocket routes are mounted at `/api/website/shipping` in `api/src/routes/web/shiprocket.routes.ts`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/website/shipping/create` | Admin | Create Shiprocket order + shipment for a confirmed order |
| `GET` | `/api/website/shipping/track/:orderId` | Auth | Fetch live tracking from Shiprocket (also auto-updates order status) |
| `POST` | `/api/website/shipping/cancel` | Admin | Cancel a shipment |
| `GET` | `/api/website/shipping/pickup-locations` | Admin | List configured pickup locations |
| `POST` | `/api/website/shipping/estimate` | None | Get shipping cost estimate for checkout |
| `POST` | `/api/website/shipping/webhook` | None | Receive Shiprocket tracking webhooks |

### Endpoint Details

#### 1. Create Shipment (`POST /api/website/shipping/create`)

Creates a complete Shiprocket order in three steps:
1. **Create order** — `POST /orders/create/adhoc` — registers the order with pickup and delivery details
2. **Create shipment** — `POST /shipments/create` — assigns a courier partner and generates AWB
3. **Generate label & invoice** — `POST /generate/label` + `POST /generate/invoice`

**Request:**
```json
{
  "orderId": "ORD-1234567890-ABCD",
  "pickupLocation": "primary"  // optional, defaults to "primary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "shiprocketOrderId": 123456,
    "shipmentId": 789012,
    "awbCode": "59629792084",
    "courierName": "Xpressbees Air",
    "labelUrl": "https://...",
    "invoiceUrl": "https://...",
    "trackingUrl": "https://shiprocket.co/tracking/59629792084"
  }
}
```

**Data stored on order:**
- `shipping.carrier` ← courier name
- `shipping.trackingNumber` ← AWB code
- `shipping.trackingUrl` ← Shiprocket tracking page URL
- `invoice.invoiceUrl` ← Invoice PDF URL
- `status` → "shipped"
- `pricing.shipping` ← Shiprocket-calculated shipping charge (if returned)

**Requirements:**
- Order must be in `"confirmed"` status
- Order must have a shipping address
- Order must not already have a tracking number (idempotent)

#### 2. Track Shipment (`GET /api/website/shipping/track/:orderId`)

Fetches live tracking data from Shiprocket's `GET /courier/track/awb/{awb_code}`. Also **auto-updates** the order status when Shiprocket reports:
- Status `"Delivered"` → order status set to `"delivered"`, `shipping.deliveredAt` recorded
- Status `"Cancelled"` → order status set to `"cancelled"`

**Response includes:**
- `trackingNumber` — AWB number
- `trackingUrl` — Shiprocket tracking page
- `carrier` — Courier name
- `currentStatus` — Current order status in our system
- `shiprocketTracking` — Raw tracking data from Shiprocket (includes `status`, `EDD`, tracking history)
- `autoUpdated` — Boolean, true if the status was just auto-updated

#### 3. Shipping Estimate (`POST /api/website/shipping/estimate`)

Uses Shiprocket's `GET /courier/serviceability/` to find the cheapest available courier for a given pincode + cart weight. Returns **no-auth** public endpoint used by the checkout page.

**Request:**
```json
{
  "deliveryPincode": "342001",
  "items": [
    { "productId": "507f1f77bcf86cd799439011", "quantity": 1 }
  ],
  "isCod": false
}
```

**Response (available):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "pickupPincode": "342005",
    "deliveryPincode": "342001",
    "totalWeightKg": 0.5,
    "estimatedCharge": 47.36,
    "cheapest": { "name": "Xpressbees Air", "rate": 47.36, "etd": "Jul 13, 2026" },
    "couriers": [
      { "name": "Delhivery Air", "rate": 53.36, "etd": "Jul 14, 2026" },
      { "name": "Xpressbees Air", "rate": 47.36, "etd": "Jul 13, 2026" }
    ]
  }
}
```

**Response (unavailable):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "message": "Shipping estimate unavailable for this pincode",
    "fallbackCharge": 50
  }
}
```

**Flow:**
1. Fetches product weights from DB to calculate total weight
2. Retrieves pickup pincode from Shiprocket settings (falls back to "342005" - Jodhpur)
3. Calls Shiprocket serviceability API with pickup pincode, delivery pincode, weight, COD flag
4. Returns cheapest courier rate, or ₹50 fallback

#### 4. Webhook (`POST /api/website/shipping/webhook`)

Receives shipment status updates from Shiprocket. **Unauthenticated** — Shiprocket sends POST requests when shipment status changes.

**Payload format (from Shiprocket docs):**
```json
{
  "awb": 59629792084,
  "current_status": "Delivered",
  "order_id": "13905312",
  "current_timestamp": "2021-07-02 16:41:59",
  "etd": "2021-07-02 16:41:59",
  "courier_name": "courier_name",
  "shipment_status": "Delivered",
  "scans": [
    { "date": "2019-06-25 12:08:00", "activity": "SHIPMENT DELIVERED", "location": "PATIALA" }
  ]
}
```

**Status mappings:**
| Shiprocket Status | Our Order Status | Action |
|------------------|------------------|--------|
| `Delivered` | `delivered` | Sets `shipping.deliveredAt` |
| `Cancelled` / `Canceled` / `Returned` | `cancelled` | — |
| `Shipped` / `In Transit` / `Out for Delivery` / `Pickup Generated` | `shipped` | Sets `shipping.shippedAt` (only if current status is `confirmed`) |

**Note:** Always returns HTTP 200 even on error (Shiprocket expects acknowledgement).

#### 5. Cancel Shipment (`POST /api/website/shipping/cancel`)

Currently a placeholder — redirects admins to use the standard order cancellation flow. Shiprocket cancellation is handled automatically when orders are cancelled through the admin panel.

#### 6. Pickup Locations (`GET /api/website/shipping/pickup-locations`)

Fetches configured pickup locations from Shiprocket's `GET /settings/company/pickup`. Used internally by the estimate endpoint to determine the origin pincode.

### Shiprocket API Client (`api/src/lib/shiprocket.ts`)

A lightweight HTTP client for the Shiprocket API (`https://apiv2.shiprocket.in/v1/external`).

**Authentication:**
- Uses `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` from env to get a JWT token via `POST /auth/login`
- Tokens expire in 10 days — the client caches them and auto-refreshes on 401
- Alternatively, `SHIPROCKET_TOKEN` can be set directly (skips login)
- Auto-retries once if a 401 response is received (token may have expired)

**Available client methods:**

| Method | Shiprocket API Path | Purpose |
|--------|-------------------|---------|
| `createOrder()` | `POST /orders/create/adhoc` | Register order with pickup/delivery details |
| `createShipment()` | `POST /shipments/create` | Assign courier, generate AWB |
| `generateLabel()` | `POST /courier/generate/label` | Generate shipping label PDF |
| `generateInvoice()` | `POST /orders/print/invoice` | Generate invoice PDF |
| `trackShipment()` | `GET /courier/track/awb/{awb}` | Live tracking by AWB |
| `cancelOrder()` | `POST /orders/cancel` | Cancel order by IDs |
| `checkServiceability()` | `GET /courier/serviceability/` | Get courier rates by route + weight |
| `getPickupLocations()` | `GET /settings/company/pickup` | List configured pickup locations |
| `assignAwb()` | `POST /courier/assign/awb` | Manually assign AWB to a shipment |
| `generatePickup()` | `POST /courier/generate/pickup` | Schedule courier pickup |
| `generateManifest()` | `POST /manifests/generate` | Generate shipment manifest |
| `printManifest()` | `POST /manifests/print` | Get manifest PDF URL |
| `printInvoice()` | `POST /orders/print/invoice` | Get invoice PDF |
| `printLabel()` | `POST /courier/generate/label` | Get label PDF |

**Helper functions:**
- `isShiprocketSuccess(result)` — Type guard that checks `status_code === 1` (for POST endpoints)
- `buildShiprocketOrderPayload(input)` — Transforms our order data into Shiprocket's API format

### Build Shiprocket Order Payload

The `buildShiprocketOrderPayload()` function transforms our internal order data into Shiprocket's `POST /orders/create/adhoc` format:

| Shiprocket Field | Source | Notes |
|-----------------|--------|-------|
| `order_id` | `order.orderId` | Our system's order ID |
| `order_date` | `order.createdAt` | Date only (YYYY-MM-DD) |
| `pickup_location` | Configurable | Defaults to "primary" |
| `billing_customer_name` | `shippingAddress.fullName` | — |
| `billing_address` | `shippingAddress.street + area` | Combined string |
| `billing_city` | `shippingAddress.city` | — |
| `billing_pincode` | `shippingAddress.pincode` | — |
| `billing_state` | `shippingAddress.state` | — |
| `billing_country` | `shippingAddress.country` | Defaults to "India" |
| `billing_email` | `shippingAddress.email` | — |
| `billing_phone` | `shippingAddress.phone` | — |
| `shipping_is_billing` | `true` | Shipping = Billing (simplified) |
| `order_items` | Order items array | Maps name, SKU, quantity, price |
| `payment_method` | Order payment method | "Prepaid" or "COD" |
| `sub_total` | `pricing.subtotal` | — |
| `total_discount` | `pricing.discount.amount` | — |
| `weight` | Calculated total (kg) | From product weights * quantities |
| `length`, `breadth`, `height` | 20, 15, 10 | Default dimensions (cm) |

### Webhook Setup

To enable automatic order status updates from Shiprocket:

1. **Log in** to your [Shiprocket Dashboard](https://app.shiprocket.in)
2. Go to **Settings** → **API** → **Webhooks** tab
3. Add the webhook URL:
   ```
   POST https://your-api-domain.com/api/website/shipping/webhook
   ```
4. Enable the webhook toggle and save

Shiprocket will POST to this endpoint whenever shipment status changes. The system automatically:
- Updates order status (`delivered`, `cancelled`, `shipped`)
- Records `shipping.deliveredAt` / `shipping.shippedAt` timestamps
- Adds entries to `statusHistory`

> **Security note:** The webhook endpoint is intentionally unauthenticated because Shiprocket cannot pass custom auth headers. Ensure your API domain is not easily guessable. Consider adding IP whitelisting on your server if needed.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SHIPROCKET_EMAIL` | Yes (if no token) | Shiprocket API user email (create via Shiprocket Dashboard → Settings → API → Create an API User) |
| `SHIPROCKET_PASSWORD` | Yes (if no token) | Shiprocket API user password |
| `SHIPROCKET_TOKEN` | Optional | Pre-generated JWT (skips login; useful for testing) |

> **Important:** Shiprocket requires a separate **API User** (not your main login credentials). Create one at Shiprocket Dashboard → Settings → API → Create an API User.

### Checkout Shipping Estimate Flow

1. User enters 6-digit pincode on checkout page
2. Frontend `useEffect` detects the change and calls `POST /api/website/shipping/estimate`
3. Backend fetches product weights from DB, calculates total weight
4. Backend calls Shiprocket's serviceability API with pickup pincode + delivery pincode + weight
5. If couriers are available, the cheapest rate is returned
6. Order summary displays the dynamic rate with courier name and EDD
7. If Shiprocket is unavailable or no couriers service the route, ₹50 fallback is used

### Agent Skills

The following `.agents/skills/` are relevant to this project:

| Skill | Why |
|-------|-----|
| `express-production` | Express middleware order, error handling, security hardening, testing |
| `razorpay` | Razorpay payment integration (orders, refunds, webhooks) |
| `security-review` | OWASP vulnerability scanning for API auth, IDOR, injection |
| `ponytail` | Minimal-solution mode for backend refactoring |

## Deployment

```bash
# Build TypeScript
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

No Dockerfile or Procfile included — deploy as a Node.js process. Recommended:
- Use a process manager (pm2, systemd) for process recovery
- Set `NODE_ENV=production` to disable hot reload and verbose error output
- Ensure all required env vars are configured (see Environment Variables above)
- Set `FRONTEND_URL` to the production frontend URL (affects CORS, Google OAuth callback, email links)

## Google OAuth

The API implements two Google OAuth flows:

| Flow | Endpoint | Auth Method |
|------|----------|-------------|
| Authorization Code (redirect) | `POST /api/website/user/google-auth-init` → `POST /api/website/user/google-callback` | User redirected to Google consent screen |
| ID Token (credential) | `POST /api/website/user/google-login` | Google One Tap / credential token |

### Authorized Redirect URIs (Google Cloud Console)

| Environment | Redirect URI |
|-------------|-------------|
| Development | `http://localhost:3000/auth/google/callback` |
| Production | `https://<YOUR_DOMAIN>/auth/google/callback` |

> The redirect URI is dynamically built from `FRONTEND_URL` env var. Whatever `FRONTEND_URL` is set to, the callback is `{FRONTEND_URL}/auth/google/callback`.

### Authorized JavaScript Origins

| Environment | Origin |
|-------------|--------|
| Development | `http://localhost:3000` |
| Production | `https://<YOUR_DOMAIN>` |

### Env Vars

| Var | Required | Notes |
|-----|----------|-------|
| `GOOGLE_CLIENT_ID` | Optional (OAuth disabled if missing) | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Optional | From Google Cloud Console |
| `FRONTEND_URL` | Required | Base URL for redirect URI construction |

### OAuth Flow (Authorization Code)

```
1. Frontend → POST /api/website/user/google-auth-init
                   → Backend generates state token (anti-CSRF, 10min TTL)
                   → Returns Google authorization URL

2. Frontend redirects user to Google consent screen
                   → User authenticates
                   → Google redirects to {FRONTEND_URL}/auth/google/callback?code=...&state=...

3. Frontend callback page → POST /api/website/user/google-callback { code, state }
                   → Backend validates state token
                   → Exchanges code for tokens via OAuth2Client
                   → Verifies ID token
                   → Finds or creates user by email/googleId
                   → Sets httpOnly session cookie
                   → Returns user data
```

## Architecture Notes

- **Auth flow**: JWT in httpOnly cookie + refresh token rotation. Middleware verifies JWT on every request.
- **Role enforcement**: `adminOnly` middleware (`requireRole('admin')`) on all admin routes. Role re-read from DB per request.
- **Error handling**: Global 4-arg error handler. `fail()` helper returns `_status`, `_message`, and `_error` in development only.
- **NoSQL injection**: Custom sanitize middleware strips `$` and `.` from body/query keys.
- **Post-payment work**: `setImmediate` for stock decrement, cart clear, emails — no queue (BullMQ recommended for production).
- **Caching**: node-cache per-instance. Cache invalidation on admin writes. Redis needed for multi-instance.
- **Brand env-ification**: `APP_NAME`, `SUPPORT_EMAIL`, `CDN_HOST`, and `EMAIL_FROM_NAME` control all brand-facing output (email templates, order ID prefixes, sender identity). No hardcoded brand strings.
- **Shipping (Shiprocket)**: All shipping integration is in `lib/shiprocket.ts` (API client) and `controller/web/shiprocket.controller.ts` (handlers). Routes are mounted at `/api/website/shipping/*`.
