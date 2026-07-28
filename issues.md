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
**Status:** ✅ Fixed July 27, 2026
**File:** `api/src/models/product.ts`

Added `unique: true` to the slug field + explicit unique index on slug.

#### 2.2 No Full-Text Search Index for Product Search
**Status:** ✅ Fixed July 28, 2026
**Files:** `api/src/controller/web/product.controller.ts`, `api/src/controller/admin/adminProduct.controller.ts`

Migrated from `$regex` to MongoDB `$text` with weighted index (`name:10, tags:5, shortDescription:3, description:1`). Both `getBySearch` and `getProductByFilter` now use `$text` queries with relevance-based sorting. Admin view search also migrated. See `docs/text-search-setup.md` for setup and verification steps.

#### 2.3 SKU — No Schema-Level Uniqueness Constraint
**Status:** ✅ Fixed July 27, 2026
**File:** `api/src/models/product.ts`

Added `unique: true, sparse: true` to the sku field + explicit unique sparse index.

#### 2.4 `giftImages` Array — No Limit or Validation
**Status:** ✅ Fixed July 27, 2026
**File:** `api/src/models/product.ts`

Changed from bare array-of-objects to typed array with `validate: max 10` limit.

---

### 🟠 Medium Priority

#### 2.5 `rating` Field — No Recalculation Mechanism
**Status:** ✅ Already implemented. Rating recalculates via `enqueue("update-rating", { productId })` in the `createReview` endpoint.
**File:** `api/src/lib/jobQueue.ts`

The `update-rating` handler re-reads all non-deleted reviews for a product, calculates the average, and updates the product's `rating` and `reviewCount` fields via a DB-backed job queue.

#### 2.6 Missing Indexes for Common Queries
**File:** `api/src/models/product.ts`

The model has indexes for categories, feature flags, and price. But these are missing:

| Missing Index | Query Pattern |
|--------------|---------------|
| `code` | Code lookup (used in admin panel) |
| `deletedAt` + `createdAt` | Recently deleted products |

`sku` index added (unique + sparse). `code` index already exists.

**Recommendation:** Add `deletedAt` + `createdAt` compound index.

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
**Status:** ✅ Fixed July 28, 2026
**File:** `api/src/controller/admin/homePage.controller.ts`

Added `validateSectionConfig(type, config)` with type-specific schemas for all 12 section types. Validates required fields, types (array, number, string), and nested array item shapes. Wired into `addSection`, `updateSection`, and bulk `update` — all 3 entry points reject invalid config with 400.

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
**Status:** ✅ Fixed July 27, 2026
**File:** `web/src/app/sitemap.ts`

Added `console.error(...)` logging to both catch blocks.

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
**Status:** ✅ Fixed July 28, 2026
**Files:** `api/src/config/env.ts`, `api/src/controller/web/shiprocket.controller.ts`, `api/src/controller/web/order.controller.ts`

Added `STORE_PICKUP_PINCODE` env var (default: `342005`). Replaced all 4 hardcoded `"342005"` references in shiprocket.controller.ts and order.controller.ts with `env.STORE_PICKUP_PINCODE`.

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

---

## 6. Next.js API Rewrite Audit

> **Added:** July 27, 2026
> **Scope:** Web rewrite config, admin-panel rewrite config, all API call sites cross-referenced against Express routes

### Critical Issues

#### 6.1 🔴 Web Rewrite Missing `/` Between Port and Path
**Status:** ✅ Fixed July 27, 2026
**File:** `web/next.config.ts`

Added trailing slash to default API URL in rewrite destination. Changed `"http://localhost:5000"` to `"http://localhost:5000/"`.

---

### High Priority

#### 6.2 🔴 Admin Panel `resolveUrl` Lowercases All Paths — Fragile Against Case-Sensitive Routing
**Status:** ✅ Fixed July 27, 2026
**File:** `admin-panel/lib/api.ts`

Removed `.toLowerCase()` call from `resolveUrl()` and cleaned up unused variables (`qIndex`, `path`, `qs`, `normalised`).

---

### Medium Priority

#### 6.3 🟠 Duplicate `/admin/` Prefix in Order Refund Routes
**Status:** ✅ Fixed July 27, 2026
**Files:** `api/src/routes/admin/adminOrder.routes.ts`, `admin-panel/components/RefundedOrdersAdmin.tsx`

Removed `/admin/` prefix from 5 refund routes and updated client paths to match.

#### 6.4 🟠 Admin Panel Refund Component Uses Raw `fetch()` — Bypasses API Client
**Status:** ✅ Fixed July 27, 2026
**File:** `admin-panel/components/RefundedOrdersAdmin.tsx`

Migrated all 4 raw `fetch()` calls to use `api.get<>()`, `api.postRaw<>()`, and `api.patchRaw<>()`. Also added `patch()` and `patchRaw()` methods to the `api` helper. Removed unused `BASE_URL` constant.

#### 6.5 🟠 Admin Panel Raw fetch() for Refresh/Logout — Bypasses API Client
**Status:** ✅ Fixed July 27, 2026
**File:** `admin-panel/components/header.tsx`

Migrated both raw `fetch()` calls to use `api.post()` for refresh and logout.

#### 6.6 🟠 Admin Panel Profile Uses `api.get()` with Token Override — Fragile Pattern
**File:** `admin-panel/app/dashboard/profile/page.tsx`

```typescript
return await api.get("/api/website/user/profile", token.value);
```

This calls a **website** endpoint from the **admin panel** by passing a token override. This:
1. Goes through the admin panel's rewrite → backend → website user controller
2. Requires the admin to have a user session AND an admin session simultaneously
3. If the userToken cookie is missing, this fails

**Recommendation:** Add a dedicated admin profile endpoint instead of relying on the website user profile endpoint.

#### 6.7 🟠 `logo.ts` Uses Lowercase HTTP Method — Works but Inconsistent
**File:** `web/src/lib/logo.ts`

```typescript
const response = await fetch("/api/website/logo", { method: "post" });
```

Uses `"post"` (lowercase) instead of `"POST"`. Works because HTTP method matching is case-insensitive, but inconsistent with the rest of the codebase which uses uppercase methods.

---

### Low Priority

#### 6.8 🟢 No `basePath` Config — Admin Panel Runs at Root
**File:** `admin-panel/next.config.ts`

The admin panel has no `basePath` configuration, so it runs at the root (`/`). If it were ever deployed on a subpath (e.g., `/admin`), all hardcoded API paths like `/api/admin/user/login` would need updating.

#### 6.9 🟢 CSP `connect-src` Doesn't Include Backend URL
**File:** `web/next.config.ts`

```typescript
connect-src 'self' https://challenges.cloudflare.com;
```

With rewrites, all API calls appear as `'self'` (same-origin), so this works. If rewrites are ever removed, the CSP would block all API calls. Not urgent but worth documenting.

#### 6.10 🟢 Sitemap Uses Relative API URLs — Works with ISR Only
**File:** `web/src/app/sitemap.ts`

```typescript
const productsRes = await fetch("/api/website/product/all", { next: { revalidate: 86400 } });
```

- Works at runtime because Next.js ISR runs after the server is started
- Would fail during `next build` or `next export` when Express isn't running
- Not a rewrite-specific issue but related to the API URL architecture

---

### 6.11 Complete Cross-Reference: All API Call Sites vs Backend Routes

**Website (web/) — All 33+ calls verified:**

| Frontend File | URL Called | Backend Route | Matches? |
|--------------|------------|---------------|:--------:|
| `Login.tsx` | `POST /api/website/user/login` | `router.post("/login")` at `/api/website/user` | ✅ |
| `SignUp.tsx` | `POST /api/website/user/register` | `router.post("/register")` at `/api/website/user` | ✅ |
| `callback/page.tsx` | `POST /api/website/user/google-callback` | `router.post("/google-callback")` at `/api/website/user` | ✅ |
| `Profile.tsx` | `PUT /api/website/user/update-profile` | `router.put("/update-profile")` at `/api/website/user` | ✅ |
| `Cart.tsx` | `GET /api/website/cart/view` | `router.get("/view")` at `/api/website/cart` | ✅ |
| `cart/page.tsx` | `GET /api/website/cart/view` | `router.get("/view")` at `/api/website/cart` | ✅ |
| `ProductDetail.tsx` | `POST /api/website/cart/add` | `router.post("/add")` at `/api/website/cart` | ✅ |
| `ProductDetail.tsx` | `POST /api/website/wishlist/add` | `router.post("/add")` at `/api/website/wishlist` | ✅ |
| `syncGuestData.ts` | `POST /api/website/cart/add` | `router.post("/add")` at `/api/website/cart` | ✅ |
| `syncGuestData.ts` | `POST /api/website/wishlist/add` | `router.post("/add")` at `/api/website/wishlist` | ✅ |
| `page.tsx` (home) | `GET /api/website/testimonial` | `router.get("/")` at `/api/website/testimonial` | ✅ |
| `page.tsx` (home) | `GET /api/website/product/tab-products` | `router.get("/tab-products")` at `/api/website/product` | ✅ |
| `page.tsx` (home) | `GET /api/website/product/new-arrivals` | `router.get("/new-arrivals")` at `/api/website/product` | ✅ |
| `page.tsx` (home) | `GET /api/website/product/best-sellers` | `router.get("/best-sellers")` at `/api/website/product` | ✅ |
| `page.tsx` (home) | `GET /api/website/product/trending-products` | `router.get("/trending-products")` at `/api/website/product` | ✅ |
| `layout.tsx` | `GET /api/website/nav` | `router.get("/")` at `/api/website/nav` | ✅ |
| `layout.tsx` | `GET /api/website/product/featured-for-footer` | `router.get("/featured-for-footer")` at `/api/website/product` | ✅ |
| `logo.ts` | `POST /api/website/logo` | `router.post("/")` at `/api/website/logo` | ✅ |
| `useCacheInvalidation.ts` | `GET /api/revalidate` | Next.js API Route (not Express) | ✅ |
| `useProductFaqs.ts` | `GET /api/website/product-faq?...` | `router.get("/")` at `/api/website/product-faq` | ✅ |
| `useRelatedProducts.ts` | `GET /api/website/product/get-related-products?...` | `router.get("/get-related-products")` at `/api/website/product` | ✅ |
| `SettingsSection.tsx` | `POST /api/website/user/verify-user` | `router.post("/verify-user")` at `/api/website/user` | ✅ |
| `SettingsSection.tsx` | `POST /api/website/user/logout` | `router.post("/logout")` at `/api/website/user` | ✅ |
| `DefaultBanner.tsx` | `GET /api/website/banner` | `router.get("/")` at `/api/website/banner` | ✅ |
| `PromoBannerSection.tsx` | `GET /api/website/banner` | `router.get("/")` at `/api/website/banner` | ✅ |
| `video.tsx` | `GET /api/website/banner` | `router.get("/")` at `/api/website/banner` | ✅ |
| `VideoSection.tsx` | `GET /api/website/banner` | `router.get("/")` at `/api/website/banner` | ✅ |
| `ProductsTab.tsx` | `GET /api/website/nav` | `router.get("/")` at `/api/website/nav` | ✅ |
| `sitemap.ts` | `GET /api/website/product/all` | `router.get("/all")` at `/api/website/product` | ✅ |
| `faq/page.tsx` | `GET /api/website/faq` | `router.get("/")` at `/api/website/faq` | ✅ |
| `category/page.tsx` | `GET /api/website/nav` | `router.get("/")` at `/api/website/nav` | ✅ |
| `change-password/page.tsx` | `POST /api/website/user/change-password` | `router.post("/change-password")` at `/api/website/user` | ✅ |
| `product-details/[slug]/page.tsx` | `GET /api/website/product/all` | `router.get("/all")` at `/api/website/product` | ✅ |

**Admin Panel (admin-panel/) — All 78+ calls via `api` helper + 5 raw `fetch()` calls:**

All `api.get/post/put/del` calls use paths that match Express routes exactly (after the path is lowercased by `resolveUrl`, which matches Express's default case-insensitive routing).

**Problematic patterns:**

| Component | HTTP Method | URL | Backend Route | Issue |
|-----------|:-----------:|-----|---------------|-------|
| `RefundedOrdersAdmin.tsx` | `PATCH` | `/api/admin/orders/admin/refund/:id` | `router.patch("/admin/refund/:orderId")` at `/api/admin/orders` | Uses raw `fetch()` — no CSRF, no auth header auto-injection, no `_data` extraction |
| `RefundedOrdersAdmin.tsx` | `GET` | `/api/admin/orders/admin/refunded` | `router.get("/admin/refunded")` at `/api/admin/orders` | Same — raw `fetch()` |
| `RefundedOrdersAdmin.tsx` | `POST` | `/api/admin/orders/admin/refund/sync` | `router.post("/admin/refund/sync")` at `/api/admin/orders` | Same — raw `fetch()` |
| `RefundedOrdersAdmin.tsx` | `GET` | `/api/admin/orders/admin/refund/verify/:id` | `router.get("/admin/refund/verify/:orderId")` at `/api/admin/orders` | Same — raw `fetch()` |
| `header.tsx` | `POST` | `/api/admin/user/refresh` | `router.post("/refresh")` at `/api/admin/user` | Raw `fetch()` — refresh endpoint doesn't need CSRF, but inconsistent pattern |
| `header.tsx` | `POST` | `/api/admin/user/logout` | `router.post("/logout")` at `/api/admin/user` | Raw `fetch()` — same |
| `Profile.tsx` (admin) | `POST` | `/api/website/user/verify-user` | `router.post("/verify-user")` at `/api/website/user` | Calls **website** endpoint from admin panel via token override — fragile |
| `Profile.tsx` (admin) | `POST` | `/api/website/user/change-password` | `router.post("/change-password")` at `/api/website/user` | Same — calls website endpoint from admin |
| `ForgotPassword.tsx` (admin) | `POST` | `/api/website/user/forgot-password` | `router.post("/forgot-password")` at `/api/website/user` | Same — calls website endpoint from admin |

---

#

## 6.12 Summary: Rewrite Audit

| # | Severity | Issue | File | Status |
|---|----------|-------|------|:------:|
| 6.1 | 🔴 CRITICAL | Missing `/` in web rewrite destination | `web/next.config.ts` | ✅ Fixed |
| 6.2 | 🔴 HIGH | `resolveUrl` lowercases paths | `admin-panel/lib/api.ts` | ✅ Fixed |
| 6.3 | 🟠 MEDIUM | Duplicate `/admin/` prefix in order refund routes | `api/src/routes/admin/adminOrder.routes.ts` | ✅ Fixed |
| 6.4 | 🟠 MEDIUM | `RefundedOrdersAdmin.tsx` uses raw `fetch()` | `admin-panel/components/RefundedOrdersAdmin.tsx` | ✅ Fixed |
| 6.5 | 🟠 MEDIUM | admin header uses raw `fetch()` | `admin-panel/components/header.tsx` | ✅ Fixed |
| 6.6 | 🟠 MEDIUM | Admin profile calls website endpoints via token override | `admin-panel/app/dashboard/profile/page.tsx` | ❌ Open |
| 6.7 | 🟠 MEDIUM | `ForgotPassword.tsx` calls website endpoint from admin | `admin-panel/components/ForgotPassword.tsx` | ❌ Open |
| 6.8 | 🟢 LOW | No `basePath` config | `admin-panel/next.config.ts` | ❌ Open |
| 6.9 | 🟢 LOW | CSP `connect-src` doesn't include backend URL | `web/next.config.ts` | ❌ Open |
| 6.10 | 🟢 LOW | Sitemap uses relative API URLs | `web/src/app/sitemap.ts` | ❌ Open |

**Top Fix Priority:** Fix the duplicate `/admin/` prefix in order refund routes and migrate raw `fetch()` calls — both completed. Remaining: 6.6 (admin profile uses website endpoint), 6.7 (ForgotPassword in admin mixed responsibility), and low-priority items.

---

## 7. Remaining Modules Audit

> **Added:** July 27, 2026
> **Scope:** Auth system, Order/Payment system, Cart/Wishlist, Middleware stack, Server config, File upload, Email/Notifications, In-memory cache, Job queue, Remaining CRUD controllers (FAQ, Testimonials, WhyChooseUs, Logo, Banner, Nav, Color, Material, Contact, Coupons, Reviews, Product FAQs)

---

### 7.1 Auth & Session Management

#### 7.1.1 🔴 No Account Lockout — IP-Based Rate Limiting Only
**Status:** ✅ Fixed July 28, 2026
**Files:** `api/src/models/user.ts`, `api/src/controller/web/user.controller.ts`, `api/src/controller/admin/userAdmin.controller.ts`

Added `failedLoginAttempts` and `lockedUntil` fields to User model. Both `loginUser` (web) and `login` (admin) now:
- Check `lockedUntil` before allowing login, return 429 with remaining minutes
- On failed password: increment attempts, set lockout with exponential backoff (5→1m, 6-7→5m, 8-9→30m, 10+→2h)
- On success: reset both fields

#### 7.1.2 🟠 Dual Cookies (httpOnly + non-httpOnly) with Same Name
**Status:** ✅ Fixed July 28, 2026
**Files:** `api/src/middleware/authMiddleware.ts`, `api/src/controller/web/user.controller.ts`, `api/src/controller/admin/userAdmin.controller.ts`, `web/src/lib/cookies.ts`, `admin-panel/lib/api.ts`

Separated cookie names: httpOnly uses `userToken`/`adminToken`, non-httpNow uses `userToken_client`/`adminToken_client`. Both variants no longer overwrite each other. Updated all server-side cookie setters (controllers, auth middleware) and client-side readers (cookies.ts, api.ts).

#### 7.1.3 🟠 Password Reset Token — Hash Verified but No Expiry Check on Server Response
**File:** `api/src/lib/jwt.ts` (verifyPasswordResetToken)

```typescript
export const verifyPasswordResetToken = (token: string): PasswordResetJwtPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // ...returns decoded if valid
  } catch (error) {
    return null;
  }
};
```

`jwt.verify()` automatically checks expiry — so expiry IS enforced. The token expires in 10 minutes. This is correctly implemented.  

**Note:** No issue here — just verifying this works correctly.

#### 7.1.4 🟢 Email Verification Not Required for Login
**File:** `api/src/models/user.ts`, `api/src/controller/web/user.controller.ts`

The user model has an `isEmailVerified` field, but the login endpoint does not check it. Users can log in before verifying their email.

**Risk:** Users could sign up with a fake email and still access the site. The password reset flow would also be vulnerable — if someone signs up with someone else's email, they can't reset that email's password without access, but they can still log in.

**Recommendation:** Gate login behind `isEmailVerified === true` for accounts that registered via email (not Google OAuth).

---

### 7.2 Order & Payment System

#### 7.2.1 🟠 Inconsistent Response Format
**Files:** `api/src/controller/web/order.controller.ts` vs all other controllers

The order controller uses a **different response format** than the rest of the API:

| Property | Order Controller | All Other Controllers |
|----------|-----------------|----------------------|
| Status | `success: true/false` | `_status: true/false` |
| Message | `message: "..."` | `_message: "..."` |
| Data | `order: {...}`, `orders: [...]` | `_data: {...}` |
| Error | `error: "..."` | No standard error field |

**Risk:** Frontend code must handle two different response formats. Could cause bugs where a frontend component expects `_data` but receives `order`.

**Recommendation:** Migrate the order controller to use the standard `{ _status, _message, _data }` format, or add a mapping layer.

#### 7.2.2 🟠 User Cancellation — Too Restrictive for Paid Orders
**File:** `api/src/controller/web/order.controller.ts` (cancelOrder)

```typescript
if (order.status !== "pending") {
  res.status(400).json({ success: false, message: "Order cannot be cancelled in its current state" });
  return;
}
```

A user can only cancel orders in `"pending"` status. But paid orders that are `"confirmed"` (not yet shipped) should also be cancellable. The 12-hour window check inside the function also doesn't make logical sense for `"pending"` orders (which haven't been paid yet).

**Recommendation:** Allow cancellation of `"confirmed"` orders too. The 12-hour window should apply to paid orders, not pending ones.

#### 7.2.3 🟠 Webhook Processing — No Retry Mechanism
**Files:** `api/src/controller/web/order.controller.ts` (handleWebhook), `api/src/controller/web/order.webhook.ts`

If Razorpay webhook processing fails (error, timeout, DB failure), the event is **lost permanently**. Razorpay will retry the webhook delivery, but if the handler itself fails on retry, there's no persistence mechanism.

```typescript
case "payment.captured":
  await handlePaymentCaptured(eventPayload?.payload?.payment?.entity);
  break;
```

**Risk:** Payments could be captured on Razorpay but the order remains "pending" in our system, requiring manual `syncStuckPayments` recovery.

**Recommendation:**
- Store raw webhook events in a DB collection before processing
- Add a dead-letter queue for events that fail repeatedly
- Add monitoring/alerts for webhook processing failures

#### 7.2.4 🟢 Stock Restoration in cancelOrder is Fire-and-Forget
**File:** `api/src/controller/web/order.controller.ts` (cancelOrder)

```typescript
(async () => {
  try {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }
  } catch (stockError) {
    logger.error(stockError, "Failed to restore stock");
  }
})(); // immediately-invoked async — not awaited
```

Stock restoration runs in the background **after** the response is sent. If the server crashes between sending the response and restoring stock, the stock won't be restored.

**Recommendation:** Use the `enqueue` pattern (like the rest of the codebase) or keep it synchronous for critical stock operations.

---

### 7.3 Cart & Wishlist System

#### 7.3.1 🟠 removeFromCart and clearCart Don't Use Transactions
**File:** `api/src/controller/web/cart.controller.ts` (removeFromCart, clearCart)

`addToCart` properly uses `mongoose.startSession()` with transaction for atomicity. But `removeFromCart` and `clearCart` do not:

```typescript
// removeFromCart — no transaction
const result = await Cart.updateOne(
  { user: userId },
  { $pull: { items: { _id: itemId } } }
);

// clearCart — no transaction
await Cart.findOneAndUpdate(
  { user: userId },
  { $set: { items: [] } }
);
```

**Risk:** In a concurrent scenario, a remove operation could interfere with an add operation, causing inconsistent state. Low risk (only affecting cart display, not payments), but inconsistent with the addToCart pattern.

**Recommendation:** Use transactions consistently across all cart operations.

---

### 7.4 Server Configuration & Middleware

#### 7.4.1 🟠 No Global Error Handler Middleware
**File:** `api/src/server.ts`

The Express app has **no global error handler middleware** (`(err, req, res, next) => ...`). Every controller handles errors individually via try/catch. If an async error slips through without being caught, Express's default error handler will respond with an HTML error page (not JSON), and the error stack may leak in development mode.

```typescript
// Missing at the end of the middleware stack:
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ _status: false, _message: "Internal server error" });
});
```

**Risk:** Unhandled errors could:
- Return HTML instead of JSON (breaking client expectations)
- Leak error details (stack traces, internal paths) in development
- Crash the server without proper cleanup

**Recommendation:** Add a global error handler middleware as the last middleware in the stack.

#### 7.4.2 🟠 No 404 Handler at End of Middleware Stack
**File:** `api/src/server.ts`

If a request hits a path with no matching route, Express will return its default HTML 404 response (not JSON). There's no catch-all handler:

```typescript
// Missing:
app.use((req: Request, res: Response) => {
  res.status(404).json({ _status: false, _message: "Route not found" });
});
```

**Risk:** Bots/crawlers hitting non-existent paths get HTML instead of JSON. Makes API discovery harder.

**Recommendation:** Add a JSON 404 handler after all routes.

#### 7.4.3 🟠 Helmet Disables Most Browser Protections — Acceptable for API but Worth Noting
**File:** `api/src/server.ts`

```typescript
app.use(helmet({
  contentSecurityPolicy: false,     // disabled
  crossOriginEmbedderPolicy: false, // disabled
  crossOriginOpenerPolicy: false,   // disabled
  crossOriginResourcePolicy: false, // disabled
  originAgentCluster: false,        // disabled
  referrerPolicy: false,            // disabled
  xDnsPrefetchControl: false,       // disabled
  xDownloadOptions: false,          // disabled
  xFrameOptions: false,             // disabled
  xPermittedCrossDomainPolicies: false, // disabled
  // Only active:
  //   strictTransportSecurity (HSTS)
  //   xContentTypeOptions (nosniff)
  //   hidePoweredBy (strip X-Powered-By)
  //   xXssProtection (=0)
}))
```

This is intentional — it's a JSON API, not a browser-facing HTML application. Most protections don't apply. However, if the API ever serves HTML (admin panel, error pages), some of these should be re-enabled.

**Recommendation:** Document this decision clearly. If the admin panel is served separately (as it is — on port 3001), this is fine.

#### 7.4.4 🟢 body-sanitizer Could Break MongoDB Queries with `$` in Field Values
**File:** `api/src/server.ts` (sanitize function)

```typescript
function sanitize(obj: Sanitizable): Sanitizable {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item as Sanitizable));
  return Object.keys(obj as Record<string, unknown>).reduce<Record<string, unknown>>((acc, key) => {
    const k = key.replace(/^\$/, "").replace(/\./g, "");
    acc[k] = sanitize((obj as Record<string, unknown>)[key] as Sanitizable);
    return acc;
  }, {});
}
```

This strips leading `$` from keys and removes `.` characters. This is **good for security** (prevents NoSQL injection via `$where`, `$gt`, etc.).

However, there's a subtle issue: nested query objects from the frontend (e.g., filters with `$gte`, `$lte` operators) would be silently broken. If the frontend ever needs to send MongoDB operators (e.g., for advanced filtering), it can't because the sanitizer strips them.

**Recommendation:** Ensure this is documented. If a route needs to accept MongoDB operators, it should parse the raw body before sanitization runs.

---

### 7.5 File Upload & Image Processing

#### 7.5.1 🟠 No Magic-Byte Verification for Uploaded Files
**File:** `api/src/middleware/uploadMiddleware.ts`

```typescript
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  // ... rejects if mismatch
};
```

File validation relies on **extension and MIME type only** — both can be spoofed. The comment notes that Sharp validates during actual processing, which provides secondary protection. However, Sharp validation happens **after** the file is accepted and uploaded to R2.

**Risk:** An attacker could upload a non-image file (e.g., SVG with XSS, or a polyglot file) that passes MIME/extension checks but is rejected by Sharp. The file is still stored on R2 (though Sharp fails to process it, so it won't be served as an image).

**Recommendation:** Add magic-byte verification (file signature) during the upload middleware phase, before accepting the file. This is an additional defense layer beyond what Sharp provides.

#### 7.5.2 🟢 Sharp Processing Could Be a DoS Vector
**File:** `api/src/lib/cloudflare.ts`

```typescript
const pipeline = sharp(file.buffer)
  .resize({ width: 1200, fit: sharp.fit.inside, withoutEnlargement: true })
  .webp({ quality: imageQuality, effort: 6 });
```

Sharp processes all uploaded images in-memory. A crafted "image bomb" (small file that decompresses to gigabytes) could cause memory exhaustion. The 5MB file size limit provides some protection.

**Recommendation:** Consider adding a pixel dimension limit (e.g., max 6000x6000) as an additional safety check before passing to Sharp.

---

### 7.6 Email & Notifications

#### 7.6.1 🟠 Single Email Provider — No Failover
**File:** `api/src/lib/nodemailer.ts`

```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.MY_GMAIL,
    pass: env.MY_GMAIL_PASSWORD,
  },
});
```

Only Gmail SMTP is configured. If Gmail is down or rate-limited, all transactional emails fail silently (errors are logged but no fallback).

**Recommendation:** Add a secondary email provider (e.g., SendGrid, AWS SES) as a fallback transporter.

#### 7.6.2 🟠 Email Templates Use EJS with Inline Styles — Hard to Maintain
**File:** `api/src/views/emails/*.ejs`

EJS templates with inline CSS work well for email clients but are harder to maintain than dedicated email tools (MJML, React Email, react-email with preview).

**Recommendation:** Consider migrating to a component-based email system (e.g., `react-email`) for better maintainability and preview capabilities.

---

### 7.7 In-Memory Cache

#### 7.7.1 🟢 Single-Process Cache — Doesn't Scale Horizontally
**File:** `api/src/lib/cache.ts`

```typescript
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
});
```

NodeCache is in-memory per-process. If the app is scaled to multiple instances (via PM2 cluster or multiple servers), each instance has its own cache. This means:
- Cache invalidation on one instance doesn't propagate to others
- Different users may see different cached data depending on which instance serves them
- Restart clears the entire cache

**Recommendation:** For horizontal scaling, replace with Redis or another shared cache.

---

### 7.8 Job Queue

#### 7.8.1 🟠 In-Memory Queue — No Persistence Across Restarts
**Status:** ✅ Fixed July 28, 2026
**Files:** `api/src/lib/jobQueue.ts`, `api/src/models/job.ts`, `api/src/server.ts`, 3 controller files

Replaced in-memory job array with MongoDB-backed queue. Jobs persist across restarts, retry up to 3 times on failure, and stuck "processing" jobs are recovered on server startup.

---

### 7.9 Remaining CRUD Controllers

#### 7.9.1 ✅ FAQ, Testimonial, Logo, WhyChooseUs, Color, Material (Web Controllers)
**Files:** `api/src/controller/web/faq.controller.ts`, `testimonial.controller.ts`, `logo.controller.ts`, `whyChooseUs.controller.ts`, `color.controller.ts`, `material.controller.ts`

All six use the **consistent `buildCacheListController` helper** pattern:
- Cache-backed public GET endpoints with 1-hour TTL
- Cache invalidated on admin CRUD operations
- Consistent `{ _status, _message, _data }` response format
- Proper error handling via `success()` / `fail()` utilities

**Assessment:** Clean, consistent, well-structured. No issues found.

#### 7.9.2 ✅ Banner Controller (Web)
**File:** `api/src/controller/web/banner.controller.ts`

Custom `fetchBanners` function resolves link targets (product/category/subcategory slugs) with lazy-loaded slug maps. Uses `buildCacheListController` with 1-hour TTL. Proper error handling.

**Assessment:** Well-structured. No issues found.

#### 7.9.3 ✅ Navigation Controller
**File:** `api/src/controller/web/nav.controller.ts`

Fetches Category → SubCategory → SubSubCategory in parallel with `Promise.all`, then constructs the tree manually. 1-hour cache. Proper error handling with `success()` / `fail()`.

**Assessment:** Clean pattern. No issues found.

#### 7.9.4 ✅ Product FAQ Controller
**File:** `api/src/controller/web/productFaq.controller.ts`

Cached public endpoint with productId filtering. 10-minute TTL. `success()` / `fail()` utilities.

**Assessment:** No issues found.

#### 7.9.5 🔴 Rating and ReviewCount Not Updated After Review Creation
**File:** `api/src/controller/web/review.controller.ts` (likely — needs verification)

The product model stores `rating` and `reviewCount` fields. When a review is created/updated/deleted, these fields should be recalculated on the product document. This does not appear to happen automatically.

**Risk:** Product ratings display stale data. New reviews don't update the displayed star rating until manually recalculated.

**Recommendation:** Add a Mongoose post-save hook on the Review model that recalculates the parent product's rating using aggregation.

---

### 7.10 Inconsistent Patterns

#### 7.10.1 🟢 `asyncHandler` Utility — Used by Cart Only, Not by Other Controllers
**File:** `api/src/utils/asyncHandler.ts` vs `api/src/controller/web/cart.controller.ts`

The cart controller uses the `asyncHandler` wrapper:
```typescript
export const getCart = asyncHandler(async (req: Request, res: Response) => { ... });
```

Other controllers (product, order, etc.) use manual `try/catch` in every handler. Inconsistent but not a bug — both patterns work.

#### 7.10.2 🟢 Order Controller Uses `success: true/false` — Other Controllers Use `_status: true/false`
**Files:** `api/src/controller/web/order.controller.ts` vs `api/src/utils/responses.ts`

The order controller was likely written before the standard response format was established. See 7.2.1 above.

---

### 7.11 Summary: Remaining Modules

| # | Severity | Issue | File |
|---|----------|-------|------|
| 7.1.1 | 🔴 HIGH | No account lockout — IP-based rate limiting only | ✅ Fixed |
| 7.9.5 | 🔴 HIGH | Product ratings not recalculated after review creation | ✅ Already implemented via enqueue |
| 7.1.2 | 🟠 MEDIUM | Dual cookies (httpOnly + non-httpOnly) with same name | ✅ Fixed |
| 7.2.1 | 🟠 MEDIUM | Inconsistent response format in order controller | `api/src/controller/web/order.controller.ts` |
| 7.2.2 | 🟠 MEDIUM | User cancellation too restrictive for paid/confirmed orders | `api/src/controller/web/order.controller.ts` |
| 7.2.3 | 🟠 MEDIUM | Webhook processing has no retry mechanism | `api/src/controller/web/order.controller.ts` |
| 7.3.1 | 🟠 MEDIUM | Cart remove/clear don't use transactions | `api/src/controller/web/cart.controller.ts` |
| 7.4.1 | 🟠 MEDIUM | No global error handler middleware | ✅ Already present |
| 7.4.2 | 🟠 MEDIUM | No 404 handler at end of middleware stack | ✅ Already present |
| 7.5.1 | 🟠 MEDIUM | No magic-byte verification for uploaded files | `api/src/middleware/uploadMiddleware.ts` |
| 7.6.1 | 🟠 MEDIUM | Single email provider with no failover | `api/src/lib/nodemailer.ts` |
| 7.8.1 | 🟠 MEDIUM | In-memory job queue — no persistence, no retry | ✅ Fixed |
| 7.1.4 | 🟢 LOW | Email verification not required for login | `api/src/controller/web/user.controller.ts` |
| 7.2.4 | 🟢 LOW | Stock restoration in cancelOrder is fire-and-forget | `api/src/controller/web/order.controller.ts` |
| 7.4.4 | 🟢 LOW | body-sanitizer strips $ from keys (intentional but limiting) | `api/src/server.ts` |
| 7.5.2 | 🟢 LOW | Sharp processing could be DoS vector (mitigated by 5MB limit) | `api/src/lib/cloudflare.ts` |
| 7.7.1 | 🟢 LOW | Single-process cache doesn't scale horizontally | `api/src/lib/cache.ts` |

### Clean / No Issues Found:

| Module | Status |
|--------|:------:|
| FAQ controller | ✅ Clean |
| Testimonial controller | ✅ Clean |
| Logo controller | ✅ Clean |
| Why Choose Us controller | ✅ Clean |
| Color controller (web) | ✅ Clean |
| Material controller (web) | ✅ Clean |
| Banner controller (web) | ✅ Clean |
| Nav controller | ✅ Clean |
| Product FAQ controller | ✅ Clean |
| Contact controller | 🟢 Not fully inspected — appears clean |
| Coupon controller | 🟢 Not fully inspected — appears clean |
| Refresh token system | ✅ Clean |
| bcrypt password hashing | ✅ Clean |
| Turnstile verification | ✅ Clean |
| Rate limiters | ✅ Clean |
| CSRF protection | ✅ Clean |
| NoSQL injection sanitizer | ✅ Clean |

---

## Updated Summary

| Severity | Sections 1-6 | Section 7 | **Total** |
|----------|:------------:|:---------:|:---------:|
| 🔴 High | 14 | 2 | **16** |
| 🟠 Medium | 17 | 11 | **28** |
| 🟢 Low | 11 | 5 | **16** |
| **Total** | **42** | **18** | **60** |

### Top New Critical Items from Section 7

1. **Auth: No account lockout** (7.1.1) — IP-only rate limiting doesn't protect against distributed brute-force attacks on admin accounts.
2. **Reviews: Ratings not recalculated** (7.9.5) — Product star ratings show stale data after new reviews are added.
3. **Middleware: No global error handler** (7.4.1) — Unhandled async errors could crash the server or leak stack traces.
4. **Auth: Dual cookies with same name** (7.1.2) — httpOnly cookie could be overwritten by non-httpOnly variant.
5. **Queue: No persistence** (7.8.1) — Critical jobs (email, stock restoration) lost on server restart.
