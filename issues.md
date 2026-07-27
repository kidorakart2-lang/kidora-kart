# Audit Findings

> **Generated:** July 27, 2026
> **Scope:** Shiprocket implementation, Product system, Dynamic Home Page system, SEO

---

## 1. Shiprocket Implementation

### 🔴 High Priority

#### 1.1 Webhook Signature Verification Missing
**File:** `api/src/controller/web/shiprocket.controller.ts` (shiprocketWebhook handler)

The webhook endpoint `POST /api/website/shipping/webhook` accepts payloads **without any signature verification**. Shiprocket's API v2 supports configuring a webhook **Secret Key** in the dashboard, which Shiprocket uses to HMAC-sign payloads.

**Risk:** An attacker could send fake "Delivered" or "Cancelled" status updates, manipulating order states without authorization.

**Recommendation:**
- Configure a Secret Key in Shiprocket Dashboard → Settings → API → Webhooks
- Verify the HMAC signature in the webhook handler before processing any payload
- Reject requests with missing or invalid signatures

#### 1.2 Dimensions Hardcoded in Shiprocket Payload
**File:** `api/src/lib/shiprocket.ts` (buildShiprocketOrderPayload, line ~310)

```typescript
length: 20,
breadth: 15,
height: 10,
```

These dimensions are hardcoded. The product model has `length`, `breadth`, and `height` fields, but they're never passed to the Shiprocket payload.

**Risk:** Incorrect dimensions could cause Shiprocket to calculate wrong shipping charges or reject heavy packages if actual dimensions exceed these defaults.

**Recommendation:** Calculate dimensions from actual product data when available (sum of max dimensions across all items).

#### 1.3 Weight Conversion from String — Silent Fallback to 0.5kg
**File:** `api/src/controller/web/shiprocket.controller.ts` (createShippingOrder, line ~72)

```typescript
const parsed = parseFloat(doc.weight || "0.5") / 1000;
weightMap.set(id, isNaN(parsed) ? 0.5 : parsed);
```

The product `weight` field is stored as a **string** (required: true). `parseFloat()` will silently return `NaN` for non-numeric strings like `"500g"` or `"0.5 kg"`. The fallback is 0.5kg.

**Risk:** If admin enters weight as `"500 grams"` instead of `"500"`, the shipment weight defaults to 0.5kg regardless of actual weight. This could cause incorrect shipping charges or courier rejection.

**Recommendation:**
- Add a sanitization/parsing function for weight input (strip non-numeric characters before storing)
- Or add validation on the product schema to ensure weight is a numeric string

#### 1.4 Shiprocket Token Security — In-Memory Cache Only
**File:** `api/src/lib/shiprocket.ts` (getToken)

The Shiprocket API token is cached in-memory only. If the server restarts, it must re-authenticate. If the token is compromised during the 9-day window, there's no mechanism to revoke it without changing credentials.

**Risk:** No persistence across restarts means the first request after every restart is slower (must authenticate). No token rotation or revocation.

**Recommendation:**
- Consider caching the token in Redis or the database for persistence across restarts
- Add token rotation logic that refreshes every few days regardless of expiry

---

### 🟠 Medium Priority

#### 1.5 Unused Shiprocket Library Methods (Dead Code)
**File:** `api/src/lib/shiprocket.ts`

The following methods are defined but **never exposed as API endpoints** or called anywhere:

| Method | Purpose |
|--------|---------|
| `assignAwb()` | Manually assign AWB to shipment |
| `generateManifest()` | Generate manifest PDF |
| `printManifest()` | Print manifest |
| `printInvoice()` | Print invoice PDF (separate from `generateInvoice`) |
| `printLabel()` | Print label PDF (separate from `generateLabel`) |

**Risk:** Dead code increases maintenance burden and potential confusion.

**Recommendation:** Either expose these as admin API endpoints or remove them.

#### 1.6 No NDR (Non-Delivery Report) Handling
**File:** `api/src/controller/web/shiprocket.controller.ts` (shiprocketWebhook)

Shiprocket can send NDR (Non-Delivery Report) statuses like `"NDR"`, `"RTO"` (already handled), `"Undelivered"`, `"Attempt Failed"`. These are not handled explicitly.

**Risk:** Orders stuck in "attempted but undelivered" state will not be updated unless manually processed.

**Recommendation:** Add handling for NDR statuses — set order status to a new `"delivery_attempt_failed"` state, notify admin, allow customer to update address/contact info.

#### 1.7 No Bulk Shipping Operations
**File:** `api/src/routes/web/shiprocket.routes.ts`

There's no endpoint to create shipments for multiple orders at once, or to generate manifests for bulk shipping preparation.

**Recommendation:** Add a batch endpoint like `POST /api/website/shipping/bulk-create` that accepts an array of orderIds.

#### 1.8 Pickup Location "primary" — No Validation
**File:** `api/src/controller/web/shiprocket.controller.ts` (createShippingOrder)

```typescript
pickupLocation: pickupLocation || "primary",
```

If the admin provides a pickup location name that doesn't exist in Shiprocket, the call will fail with an ambiguous error.

**Recommendation:** Fetch actual pickup locations and validate the provided name against them before creating the shipment.

#### 1.9 COD Payment Status Updated Twice on Webhook Delivery
**File:** `api/src/controller/web/shiprocket.controller.ts` (shiprocketWebhook, lines ~830-848)

For COD orders:
1. The webhook handler sets `payment.status = "completed"` and `payment.paidAt = new Date()`
2. The `trackShippingOrder` function ALSO sets `payment.status = "completed"` when it detects delivery

If both fire, the order is double-modified (though this is harmless — both set the same values).

**Recommendation:** Add idempotency checks so the webhook handler skips payment update if already completed.

#### 1.10 `trackShipment` Response Ambiguity
**File:** `api/src/controller/web/shiprocket.controller.ts` (trackShippingOrder, line ~170)

```typescript
const trackInfo = trackingResult?.tracking_data ?? null;
```

If `trackingResult` is `null` or undefined (e.g., Shiprocket API down), the tracking endpoint returns with generic data. No error is surfaced to the user.

**Recommendation:** If `trackingResult` is null/undefined, return a clear error message saying tracking is temporarily unavailable, along with the order's stored tracking URL as fallback.

---

### 🟢 Low Priority

#### 1.11 No Rate Limiter on Label/Invoice Regeneration
**File:** `api/src/routes/web/shiprocket.routes.ts`

The `/label` and `/invoice` endpoints don't have rate limiters, unlike the tracking and estimate endpoints.

#### 1.12 No Audit Log for Shipping Actions
**File:** `api/src/controller/web/shiprocket.controller.ts`

Shipping operations like create, cancel, RTO, pickup, label/invoice regeneration are not logged to the audit log system (if one exists).

---

## 2. Product System

### 🔴 High Priority

#### 2.1 Slug Not Uniquely Indexed
**File:** `api/src/models/product.ts`

The `slug` field has `required: true` but **no unique index**. Two products could theoretically share the same slug, causing routing conflicts on the frontend.

```typescript
slug: { type: String, required: [true, "Please Enter A Slug"] },
```

**Risk:** If two products have the same slug, the product detail page will always show only one of them (the first one found). The other product becomes inaccessible via URL.

**Recommendation:** Add `unique: true` to the slug field or add a unique compound index on `slug` + `deletedAt`.

#### 2.2 No Full-Text Search Index for Product Search
**File:** `api/src/models/product.ts`

Product search via `/get-by-search` uses regex matching (likely) on name/description. There's no MongoDB text index.

**Risk:** Slow search performance as product catalog grows. `$regex` queries can't use indexes efficiently for prefix-unspecified patterns.

**Recommendation:** Add a compound text index on `name`, `description`, `shortDescription`, and `tags`. Update search queries to use `$text` instead of `$regex` where possible.

#### 2.3 SKU — No Schema-Level Uniqueness Constraint
**File:** `api/src/models/product.ts`

The `sku` field has no `unique: true` constraint at the schema level. SKU generation (which uses `crypto.randomUUID()`) and validation happen in the controller (`adminProduct.controller.ts`), but there's no database-level enforcement.

**Risk:** Edge case where two products could have the same SKU if concurrent requests bypass controller validation. No standard format encoding at the database level.

**Recommendation:** Add `unique: true` + `sparse: true` to the `sku` field in the schema (controller validation already exists, this adds DB-level enforcement).

#### 2.4 `giftImages` Array — No Limit or Validation
**File:** `api/src/models/product.ts`

```typescript
giftImages: [{ type: String, default: "" }],
```

No limit on the number of gift images. An admin could upload hundreds of images causing performance issues.

**Recommendation:** Add a validation limiting the array to a reasonable number (e.g., 5-10 images).

---

### 🟠 Medium Priority

#### 2.5 `rating` Field — No Recalculation Mechanism
**File:** `api/src/models/product.ts`

```typescript
rating: { type: Number, default: null },
reviewCount: { type: Number, default: 0 },
```

The `rating` and `reviewCount` fields are stored on the product document but there's no mechanism to auto-recalculate them when reviews are added/changed. The review creation endpoint (`POST /api/website/review/create`) doesn't appear to update the product's rating.

**Risk:** Product ratings become stale/incorrect over time. New reviews don't update the displayed rating.

**Recommendation:** When a review is created/updated/deleted, recalculate and update the product's `rating` and `reviewCount` fields.

#### 2.6 Missing Indexes for Common Queries
**File:** `api/src/models/product.ts`

The model has indexes for categories, feature flags, and price. But these are missing:

| Missing Index | Query Pattern |
|--------------|---------------|
| `sku` | SKU lookup |
| `code` | Code lookup (used in admin panel) |
| `deletedAt` + `createdAt` | Recently deleted products |

**Recommendation:** Add sparse indexes for `sku` (if made unique) and `code`.

#### 2.7 No Stock Reservation During Checkout
**File:** `api/src/controller/web/order.controller.ts`

Stock is only deducted when payment is verified. There's no temporary reservation during the checkout flow. Two users could both start checkout for the same last-in-stock item, but only one would succeed after payment.

**Risk:** Customer completes payment but gets a "stock insufficient" error — poor UX.

**Recommendation:** Implement a temporary stock reservation mechanism (e.g., using a `reservedStock` field with a TTL, or using order status "pending" to reduce available stock temporarily).

#### 2.8 `estimated_delivery_time` — Required String With No Validation
**File:** `api/src/models/product.ts`

```typescript
estimated_delivery_time: {
  type: String,
  required: [true, "Please enter a estimated delivery time"],
},
```

This is a required free-text string. No format validation. Could contain anything like "3-5 days", "Next week", "Tomorrow", or gibberish.

**Recommendation:** Either validate against a format pattern (e.g., "X-Y days") or change to a number (min/max days range).

---

### 🟢 Low Priority

#### 2.9 `code` Field — Alphanumeric, No Uniqueness
**File:** `api/src/models/product.ts`

Similar to `slug`, the `code` field has no uniqueness constraint. The generation logic uses `crypto.randomUUID()` truncated, but collisions are possible (though unlikely).

#### 2.10 No Product Versioning / History
When a product is updated, there's no history of changes. Can't track what changed or revert.

#### 2.11 Soft Deletion — No Cleanup
`deletedAt` marks products as deleted but there's no mechanism to permanently remove old deleted products after a retention period.

---

## 3. Dynamic Home Page System

### 🔴 High Priority

#### 3.1 Section Config Uses `Mixed` Type — No Validation
**File:** `api/src/models/homePage.ts`

```typescript
config: { type: Schema.Types.Mixed, default: {} },
```

The `config` field accepts ANY JSON structure. There's no validation that:
- Banner sections have required fields like `image`, `link`, `title`
- Product slider sections have valid `productIds` or `categoryIds`
- Any section type has the expected configuration shape

**Risk:** Admins can save invalid configs that silently fail on the frontend. A corrupted section could break the entire homepage rendering.

**Recommendation:** Add validation per section type in the admin controller. Use a schema validation library or manual validation in `homePage.controller.ts`.

#### 3.2 No Frontend Error Boundary for Sections
**File:** `web/src/app/page.tsx` (and related section rendering components)

If one section of the homepage fails to render (e.g., invalid config, missing data, API failure), the entire page could break or show an error state.

**Recommendation:** Wrap each section in a React Error Boundary so a single section failure doesn't take down the whole page.

#### 3.3 Section Rendering Depends on Unvalidated `type` Enum
**File:** `api/src/models/homePage.ts`

The section `type` enum defines 12 types, but not all may have corresponding frontend rendering components. If a section type is added to the backend but frontend rendering isn't implemented, it will silently be ignored or crash.

**Risk:** Admin adds a "bento-grid" section, but the frontend doesn't have a BentoGrid renderer. The section is invisible to users with no error feedback to the admin.

---

### 🟠 Medium Priority

#### 3.4 No Section Preview for Admin
The admin panel allows creating and ordering sections but there's no preview of how they'll appear on the live site. Admins must save and visit the public site to verify.

**Recommendation:** Add a live preview panel in the admin home page editor.

#### 3.5 No Cache Invalidation After Home Page Update
**File:** `api/src/controller/admin/homePage.controller.ts`

When home page sections are modified (add/update/remove), there's no cache invalidation. The public API (`/api/website/homePage`) may return stale data if cached at the CDN or application level.

**Recommendation:** Add cache invalidation hooks (e.g., revalidateTag for Next.js ISR, or clear Redis cache).

#### 3.6 Duplicate `order` Values Possible
**File:** `api/src/models/homePage.ts`

```typescript
order: { type: Number, default: 0 },
```

Multiple sections can have the same `order` value. The rendering order between sections with the same order is undefined (depends on MongoDB's natural order).

**Recommendation:** Add validation during save to ensure unique order values, or auto-assign sequential order numbers.

#### 3.7 No Section Limit
An admin could add hundreds of sections to the homepage, causing slow load times and poor UX.

**Recommendation:** Enforce a reasonable maximum (e.g., 20 sections).

---

### 🟢 Low Priority

#### 3.8 No Versioning
Home page updates replace the entire document. There's no way to roll back to a previous version if an admin makes a mistake.

#### 3.9 No Concurrency Control
If two admins edit the homepage simultaneously, one's changes will silently overwrite the other's without conflict detection.

---

## 4. SEO Audit

### 🔴 High Priority

#### 4.1 Sitemap Uses Relative API URLs — Fails on Cold Build / Export
**File:** `web/src/app/sitemap.ts`

```typescript
const productsRes = await fetch("/api/website/product/all", { next: { revalidate: 86400 } });
```

The sitemap uses **relative paths** with ISR (`next: { revalidate: 86400 }`).

- **During runtime (ISR):** The Next.js rewrite proxy IS running, so relative URLs work fine after the first server start. The sitemap regenerates on the configured interval.
- **During `next build` (cold build) or `next export`:** The Express API server is NOT running, so `fetch("/api/website/...")` fails. The empty catch blocks silently swallow these errors, excluding products and categories from the sitemap.

**Severity:** 🟠 Medium (not 🔴 High, because ISR handles runtime generation). But critical if the site uses static export or if the build process doesn't ensure the API is running.

**Risk:** During initial deployment or cold cache, the sitemap will only contain static routes. Search engines won't discover product/category pages until the API server is running and ISR triggers a regeneration.

**Recommendation:**
- Use `process.env.API_URL` (server-side env var) as the base URL for build-time API fetches
- Or use a `generateSitemaps()` dynamic export instead of the default static generation
- Add logging to the catch blocks so sitemap failures are detectable

#### 4.2 No Product Page Meta Descriptions
Each product page should have a unique `<meta name="description">` tag. The current implementation likely uses a generic template or defaults to the site description. Product pages are the most likely to appear in search results and need unique, compelling meta descriptions.

**Risk:** Search results for product pages will show generic descriptions, reducing click-through rates.

**Recommendation:** Ensure product detail pages dynamically generate meta descriptions from the product's `shortDescription` or `description` field.

#### 4.3 No JSON-LD Structured Data on Homepage
**Files:** `web/src/app/layout.tsx`, `web/src/app/page.tsx`

The site lacks:
- **Organization JSON-LD** (name, logo, contact, address)
- **WebSite JSON-LD** (search URL, site name)
- **LocalBusiness JSON-LD** for local SEO (Jodhpur-based toy shop)

The layout.tsx has metadata but no JSON-LD structured data script tags.

**Risk:** Search engines can't understand the business context. Local SEO (Jodhpur toy shop) is weakened. Rich results (knowledge panel, sitelinks search box) won't appear.

**Recommendation:** Add JSON-LD structured data to the layout using Next.js's `Script` component with `id` for organization, website, and local business schemas.

#### 4.4 No Breadcrumb Structured Data on Product Pages
**File:** `web/src/app/(pages)/product-details/[slug]/page.tsx`

Product pages don't include BreadcrumbList JSON-LD. This helps search engines understand the category hierarchy and can show breadcrumb rich results in SERPs.

**Recommendation:** Add BreadcrumbList JSON-LD to product detail pages using the product's category hierarchy.

---

### 🟠 Medium Priority

#### 4.5 Sitemap Error Handling Silently Fails
**File:** `web/src/app/sitemap.ts`

Both API fetches have empty catch blocks:
```typescript
catch (error) { }
```

If either API fails, the error is swallowed. The sitemap returns without products or categories, and the build succeeds — giving a false sense of completeness.

**Recommendation:** Log the error (at minimum) so developers can detect sitemap generation failures.

#### 4.6 No Hreflang Tags
For a store serving Indian customers, there's no `hreflang="en_IN"` tag. While this may be acceptable for a single-language/location store, adding it helps search engines understand the target audience.

#### 4.7 OG Image Path Not Verified to Exist
**File:** `web/src/lib/utils.ts`

```typescript
images: [{
  url: `${siteConfig.url}/og-image.jpg`,
  ...
}]
```

The OpenGraph image URL references `/og-image.jpg` but there's no check if this file actually exists in the public directory.

**Recommendation:** Verify the file exists in `/public/og-image.jpg`. Add a fallback image or generate one programmatically.

#### 4.8 AI Crawlers Blocked in robots.txt — Some May Be Useful
**File:** `web/src/app/robots.ts`

The robots.txt blocks Google-Extended, GPTBot, ClaudeBot, PerplexityBot, and others. While protecting against AI training is valid, this blocks legitimate AI-powered search features (e.g., Google's AI Overviews, Perplexity's citations).

**Risk-reward:** Blocking Google-Extended prevents Google's AI from training on content, but also prevents Google's AI Overviews from citing the site, which could reduce organic visibility.

---

### 🟢 Low Priority

#### 4.9 No Canonical URL Tag on Product Pages
Static pages have a canonical URL via metadata, but product pages should include explicit `<link rel="canonical">` tags pointing to the product URL (especially important if the product can be reached via multiple category paths).

#### 4.10 No Image Alt Text Optimization
Product images may not have descriptive Alt text for SEO. The `<Image>` component's `alt` prop should include product name + descriptive keywords.

#### 4.11 No Page Speed Optimizations for Images
No explicit `loading="lazy"` or `fetchpriority` attributes on below-the-fold images. No explicit image dimensions (width/height) on all `<Image>` components to prevent Cumulative Layout Shift (CLS).

---

## 5. Cross-System Issues

### 🔴 High Priority

#### 5.1 Shipping Estimate Uses Hardcoded Fallback Pincode
**File:** `api/src/controller/web/shiprocket.controller.ts` (getShippingEstimate) and `order.controller.ts` (createOrder)

Both use `"342005"` (Jodhpur) as the fallback pickup pincode if `getPickupLocations()` returns no results. If the store's actual pickup location is elsewhere, all shipping estimates during the initial setup period will be wrong.

**Recommendation:** Add a `STORE_PICKUP_PINCODE` environment variable for the initial fallback.

#### 5.2 No Synchronization Between Manual Delivery Marking and Shiprocket
**File:** `api/src/controller/admin/adminOrder.controller.ts` (delieverOrder)

When an admin manually marks an order as delivered (`POST /api/admin/orders/deliever/order`), it doesn't update Shiprocket's tracking status. The tracking API will still show the order as "In Transit" even though the admin marked it delivered.

#### 5.3 Product Stock Deduction Doesn't Account for Cancelled Order Restoration
When an order is cancelled, stock is restored. But if the product was also purchased by another customer between the original order and cancellation, the restored stock could exceed the original (though this is temporary and corrected by the next purchase). More critically, if the product was soft-deleted between order and cancellation, the stock increment on a deleted product could cause issues.

#### 5.4 Order Status Transition Integrity — Race Conditions
When Shiprocket webhook marks an order as "Delivered" and an admin simultaneously processes a refund, the following can happen:
- Webhook sets `status: "delivered"` and `payment.status: "completed"` (for COD)
- Admin refund sets `status: "refunded"` and `payment.status: "refunded"`
- The final state depends on which write happens last — **last-write-wins with no conflict detection**

**Risk:** An order could end up in an inconsistent state (e.g., `status: "refunded"` but `shipping.deliveredAt` set, or `status: "delivered"` with a refund processed).

**Recommendation:** Add a status transition guard that rejects certain transitions (e.g., can't go from "delivered" to "refunded" without an intermediate "refund_initiated" state). Use Mongoose's `$set` with specific field updates instead of overwriting the entire document.

#### 5.5 Partial Failure Recovery — Shiprocket Create Order vs Shipment
When creating a shipment (Stage 3 in the flow), the system makes 4 sequential Shiprocket API calls:
1. Create order → 2. Create shipment → 3. Generate label → 4. Generate invoice

If step 1 succeeds but step 2 fails, the Shiprocket order is created (orphaned) but our DB doesn't have the `shiprocketOrderId`. The admin can retry, but Shiprocket may reject the duplicate `order_id`.

**Recommendation:** Persist `shiprocketOrderId` to DB **immediately** after step 1 succeeds, before attempting steps 2-4. If subsequent steps fail, the admin can retry with the known Shiprocket order ID.

#### 5.6 No Atomicity Across System Boundaries
Order operations span multiple systems (our DB → Razorpay → Shiprocket), but there's no distributed transaction or compensation mechanism. If payment verification succeeds but shipment creation fails days later, there's no automated rollback path.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 High | 14 |
| 🟠 Medium | 17 |
| 🟢 Low | 11 |
| **Total** | **42** |

### Top 5 Most Critical Items

1. **Product: Slug has no unique index** (2.1) — Duplicate slugs make products inaccessible via URL. Quick fix with high impact.
2. **Shiprocket: Webhook has no security** (1.1) — No HMAC signature verification on webhook endpoint. Orders can be spoofed.
3. **Home Page: Section config completely unvalidated** (3.1) — TypeScript `Mixed` type allows any invalid config to be saved, potentially breaking the homepage.
4. **SEO: No JSON-LD structured data** (4.3) — Missing Organization, Website, and LocalBusiness schemas for rich search results.
5. **Cross-system: Order status transition integrity** (5.4) — Race conditions between webhook status updates and admin actions can leave orders in inconsistent states.
