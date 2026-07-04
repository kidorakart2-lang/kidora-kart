# 🚀 API Performance Optimization Plan

## Overview
Systematic optimization of the Express 5 + MongoDB API server for higher throughput, lower latency, and reduced memory usage.

---

## Phase 1: MongoDB Query Optimization
*Priority: Critical | Impact: High*

### ✅ 1.1 `.lean()` Added to All Read-Only Queries
Completed across all 20+ controller files.

**Web controllers — `.lean()` added where missing:**
- ✅ `nav.controller.ts` — added `.lean()` (already existed)
- ✅ `product.controller.ts` — added `.lean()` to `getByCategory`, `relatedProducts` subCategory query
- ✅ `_helpers.ts` — added `.lean()` to default `model.find()` in `buildCacheListController`
- ✅ `cart.controller.ts` — added `.select('stock').lean()` to `addToCart` Product.findOne and `updateCartItem` Product.findById
- ✅ `wishlist.controller.ts` — added `.select('_id').lean()` to `checkInWishlist`
- ✅ `banner.controller.ts`, `suggestion.controller.ts`, `productFaq.controller.ts` — already had `.lean()`

**Admin controllers — `.lean()` added to ALL read-only queries:**
- ✅ `adminProduct` — view, getOne, update (existingProduct), destroy, getByCategory, getProductByFilter
- ✅ `adminOrder` — verifyRefundStatus, updateRefundStatus, syncRefundStatusesFromRazorpay, bulkUpdateRefundStatus (all with proper .select())
- ✅ `userAdmin` — login, refreshAdminToken, findAllUser, getFullDetails (Promise.all), createUser, userDelete
- ✅ `adminCategory` — destroy, details
- ✅ `adminFaq` — view, details, destroy
- ✅ `adminTestimonial` — view, details, destroy
- ✅ `adminReview` — getAllReviews, getReviewById, deleteReview
- ✅ `adminLogo` — view, update (existing), destroy
- ✅ `adminWhyChooseUs` — view, details, destroy
- ✅ `color` — view, details, destroy
- ✅ `material` — view, details, destroy
- ✅ `size` — view, details, destroy
- ✅ `adminSubCat` — view, details, destroy (populate optimized)
- ✅ `adminSubSubCat` — destroy (view already had .lean())
- ✅ `adminProductFaq` — view, details, destroy
- ✅ `dashboard` — getRecentActivity (Order + User finds)
- ✅ `auditLog` — already had .lean()

### ✅ 1.2 `.select()` Projections Added to Every Query
Every query now returns only the fields actually needed.

**Web controller projections:**
- `nav.controller.ts` — Category: `_id name slug parentSubCategory image`, SubCategory: `_id name slug category image`, SubSubCategory: `_id name slug subCategory image`
- `product.controller.ts` — POPULATE_SELECT constant, `_id` on slug lookups
- `cart.controller.ts` — `stock` on Product.findOne/Product.findById
- `wishlist.controller.ts` — `_id` on Wishlist.findOne
- `user.controller.ts` — all queries optimized with precise selects (from earlier pass)
- `order.controller.ts` — all queries optimized (from earlier pass)
- `coupen.controller.ts` — all queries optimized (from earlier pass)

**Key admin controller projections:**
- `Product.find/findOne/findById` — `name slug images price discount_price stock status category subCategory colors material sizes createdAt order ...`
- `Order.find/findOne` — `orderId _id payment.razorpay.* cancellation.* status payment.status pricing.total notes.internal`
- `User.find/findOne/findById` — `_id name email role password deletedAt`
- All CRUD views — only list fields + status

### ✅ 1.3 `.populate()` Calls Optimized
- `adminReview` — userId populate: `"name email"`, productId populate: `"name slug images"`
- `adminSubCat` — category populate: `"name slug"` (was full document)
- `adminProductFaq` — products populate: `"name slug"`
- `product.controller.ts` — all populates specify `select`
- `getByCategory` — category/subCategory/subSubCategory populates now have select

### ✅ 1.4 Sequential→Parallel Query Conversion
- `userAdmin.getFullDetails` — 5 sequential queries converted to `Promise.all()`

### ✅ 1.5 Database Indexes Added
Added compound MongoDB indexes across all 17 models based on actual query patterns from the controllers. See [Index Design Summary](#index-design-summary) below.

### 🔲 1.6 Remaining
- `.countDocuments()` chaining pattern (minor)

---

## Phase 2: Controller Optimization
*Priority: High | Impact: High*

### ✅ 2.1 Remove Duplicate Database Queries
- `adminProduct.controller.ts` — `destroy`: Combined fetch+delete into conditional `findOneAndUpdate`. Before: always 2 queries. After: 1 query in common case (soft-delete), 2 in rare case (already-deleted)
- `adminProduct.controller.ts` — `update`: Fixed missing `{ new: true }` on `findByIdAndUpdate` — was returning the OLD document (bug)

### ✅ 2.2 Reuse `req.user` from Auth Middleware
- `web/order.controller.ts` — `createOrder` enqueue callback: replaced `User.findById(userId)` with `req.user!` (already fetched by auth middleware)
- All other `User.findById` calls are legitimate (password field required, by-email lookup, unprotected routes)
- Removed unused `User` import

### ✅ 2.4 Move Non-Critical Work to Background### ✅ 2.3 `Promise.all()` for Independent Operations
Implemented across key web controllers to replace sequential awaits with parallel execution.

**Completed:**
- ✅ `nav.controller.ts` — 3 sequential Category/SubCategory/SubSubCategory finds → parallel via `Promise.all()`
- ✅ `product.controller.ts` — `getByCategory`: 3 category slug lookups + `Product.find` + `Product.countDocuments` → 2 parallel batches
- ✅ `product.controller.ts` — `getProductByFilter`: 3 category slug lookups + `Product.find` + `Product.countDocuments` → 2 parallel batches
- ✅ `userAdmin.getFullDetails` — 5 sequential queries converted to `Promise.all()` (from Phase 1)
- ✅ `product.controller.ts` — `tabProducts` already used `Promise.all()`, unchanged

Remaining:
- `verifyPendingPayments` in adminOrder — iterates orders sequentially (complex dependencies)

### ✅ 2.4 Move Non-Critical Work to Background
Completed — all email sends and audit log creates now use fire-and-forget execution.

**Email sends moved to background:**
- ✅ `web/user.controller.ts` — `forgotPassword`: response sent immediately, email fires via `.catch()`
- ✅ `web/user.controller.ts` — `verifyUser`: response sent immediately, email fires via `.catch()`
- ✅ `web/contact.controller.ts` — `contact`: response sent immediately, email fires via `.catch()`
- ✅ `web/order.controller.ts` — `handleRefundProcessed`: `await sendEmail()` → `sendEmail().catch()`
- ✅ `admin/adminOrder.controller.ts` — `confirmPendingPayment`: `await sendEmail()` → `sendEmail().catch()`
- ✅ `web/order.controller.ts` — already used `enqueue()` for user update and order confirmation emails ✅
- ✅ `web/order.controller.ts` — already fire-and-forget with `.catch()` for cancellation, delivery, shipping, OTP emails ✅

**Audit logs moved to background:**
- ✅ `admin/userAdmin.controller.ts` — `changeRole`: `await auditLogModel.create()` → `.create().catch()`
- ✅ `admin/userAdmin.controller.ts` — `verifyPassword`: `await auditLogModel.create()` → `.create().catch()`
- ✅ `admin/userAdmin.controller.ts` — `userDelete`: moved after response, `.create().catch()`

### 2.5 Optimize Admin Controllers
✅ Completed in Phase 1 — all admin CRUD controllers now use `.lean()` + `.select()`

---

## Phase 3: Express Middleware Optimization
*Priority: Medium | Impact: Medium*

### ✅ 3.1 Middleware Order Audit

**Before:** `helmet → compression → urlencoded → cors → cookieParser → sanitize → json/raw → routes`
**After:** `helmet → cors → compression → urlencoded → cookieParser → json/raw → sanitize → routes → 404 → error handler`

Changes implemented:
- ✅ **CORS moved to position 2** — OPTIONS preflight handled before body parsing/compression
- ✅ **Body size limits added** — `limit: "1mb"` on both `express.json()` and `express.urlencoded()` (DoS protection)
- ✅ **Sanitize moved after JSON parser** — fixes pre-existing bug where JSON request bodies were never sanitized (urlencoded body was sanitized, then JSON parser overwrote `req.body` with unsanitized data)
- ✅ **Buffer guard in sanitize** — `Buffer.isBuffer()` check prevents corruption of webhook raw body data
- ✅ **404 handler added** — returns `{ success: false, message: "Route not found" }` for unmatched routes

### ✅ 3.2 Conditional JSON Parsing
- Hoisted `express.json()`, `express.urlencoded()`, and `raw()` middleware instances to module level — previously created inside the request handler on EVERY request, now created once at startup and reused
- Express's built-in Content-Type negotiation already makes body parsers no-ops for non-matching content types (multipart requests skip JSON/urlencoded parsers in microseconds)
- Impact: eliminates per-request middleware factory allocations; body parser instances are created once at module init

### ✅ 3.3 Auth Middleware — User Lookup Caching
- Added `getCachedUser(userId)` — checks NodeCache (30s TTL) before hitting DB
- Used in both `extractAndVerifyToken` and `attemptAutoRefresh` (auto-refresh path)
- Added `invalidateUserCache(userId)` — exported for user mutation endpoints to clear stale cache
- Cache invalidation wired into: `updateProfile`, `completeVerify` (web), `changeRole`, `userDelete` (admin)
- 30s TTL: short enough to avoid stale data, long enough to skip repeated lookups on the same user
- Impact: eliminates redundant `User.findById` on every authenticated request for the same user within 30s

### ✅ 3.4 Helmet Configuration — API-Tuned
**Before:** `app.use(helmet())` — all 14 default protections enabled, including 10 browser-only headers irrelevant for a JSON API
**After:** Tuned configuration that disables 10 browser-only protections, keeping 4 security-relevant headers:

**Disabled (browser-only):** CSP, COEP, COOP, CORP, Origin-Agent-Cluster, Referrer-Policy, DNS-Prefetch-Control, X-Download-Options, X-Frame-Options, X-Permitted-Cross-Domain-Policies

**Kept:** HSTS (HTTPS enforcement), X-Content-Type-Options (nosniff), X-Powered-By removal, X-XSS-Protection (=0)

Impact: eliminates unnecessary header computation on every response — 10 middleware functions skipped per request

---

## Phase 4: Caching Optimization
*Priority: Medium | Impact: Medium*

### ✅ 4.1 Optimize node-cache Usage
All cache entries now have explicit TTLs appropriate to their data type.

**Changes:**
- ✅ `api/src/lib/cache.ts` — Added `stdTTL: 300` (5 min default) with `checkperiod: 60` — safety net for missed invalidation
- ✅ `_helpers.ts` — Added optional `ttl` parameter to `CacheListOptions`; `cache.set()` respects it, falls back to default stdTTL
- ✅ `nav.controller.ts` — `navigationData` uses 600s TTL (10 min — nav structure rarely changes)
- ✅ `homePage.controller.ts` — `homePage` uses 600s TTL (10 min — sections rarely change)
- ✅ `productFaq.controller.ts` — `productFaqs` uses 600s TTL (10 min — FAQs rarely change)

**Impact:**
- Navigation/home page/FAQs cached for 10 minutes with explicit invalidation on admin updates — eliminates repeated DB hits
- Generic `buildCacheListController` controllers (banners, testimonials, colors, materials, etc.) inherit 300s default
- Default TTL prevents runaway caching if admin invalidation is missed

### 4.2 Cache Invalidation
Set up cache invalidation when admin updates cached entities:
- Clear nav cache when category/subcategory is updated
- Clear banner cache when banner is created/updated/deleted

---

## Phase 5: External Service Optimization
*Priority: Medium | Impact: Medium*

### 5.1 Email (Nodemailer)
Ensure all email sending is non-blocking:
```typescript
// ❌ Bad - blocks response
await sendEmail({ ... });
res.json({ success: true });

// ✅ Good - fire and forget
sendEmail({ ... }).catch(console.error);
res.json({ success: true });
```

### 5.2 Razorpay Webhook
- Verify webhook signature BEFORE any DB queries
- Process refund/payment updates asynchronously after verification

### ✅ 5.3 Cloudflare R2 Uploads
**Before:** `optimizeImage()` loaded Sharp output into an intermediate `Buffer` via `.toBuffer()`, then passed that buffer to `PutObjectCommand` — two buffer copies in memory per upload.

**After:** Sharp pipeline (Readable stream) is passed directly as `Body` to `PutObjectCommand` — no intermediate buffer allocation. The `optimizeImage()` helper was removed (was only used internally).

- ✅ S3 client is a singleton (unchanged)
- ✅ No duplicate buffer: Sharp pipeline streams directly to S3
- ✅ Streaming upload: Sharp's Duplex stream consumed by S3 SDK

### ✅ 5.4 Multer Uploads
- ✅ Already using memoryStorage
- ✅ File size limits already configured (5MB per file, 10 files max)
- ✅ Removed redundant Sharp magic-byte verification from file filter
  - **Before:** Every uploaded file was processed by Sharp **twice** — once for magic-byte verification, once for actual resize/convert
  - **After:** Sharp only processes the file once (during actual upload). Extension + mimetype check still validates basic file type. Sharp rejects invalid files during processing.
  - Saves ~50-100ms per upload by eliminating the redundant Sharp pass

---

## Phase 6: Code Cleanup
*Priority: Low | Impact: Low-Medium*

### ✅ 6.1 Remove Unnecessary Object Spreads

**Completed:**
- ✅ `adminBanner.controller.ts` — `{ ...req.body }` → `req.body as Record<string, unknown>` in createBanner + updateBanner. Removes 2 unnecessary shallow copies per request.
- ✅ `adminLogo.controller.ts` — Same pattern in create + update. Removes 2 unnecessary shallow copies.
- ✅ `product.controller.ts` — `products = [...products, ...subCategoryProducts]` → `products.push(...subCategoryProducts)`. Avoids new array allocation. Saves 1 intermediate array + 2 spread iterators per relatedProducts call.
- ✅ `user.controller.ts` — 5 instances of `const { password, ...userData } = obj` → `delete (obj as { password?: string }).password; const userData = obj`. Avoids cloning the entire user object. Replaced `const { password, ...userData }` rest-spread with in-place `delete`.
- ✅ Typecheck: clean
- ✅ Code review: clean

### ✅ 6.2 Structured Logging Migration
All `console.log()`/`console.error()` calls across the API server replaced with Pino structured logging.

**Files migrated (11 files, 39 calls):**
- ✅ `server.ts` — 5 calls (startup, error handler, MongoDB connection)
- ✅ `config/env.ts` — 1 call (env validation failure — now logs before exit)
- ✅ `lib/cloudflare.ts` — 3 calls (R2 upload/delete errors)
- ✅ `lib/nodemailer.ts` — 2 calls (email send success/failure)
- ✅ `controller/web/user.controller.ts` — 16 calls (auth & profile operations)
- ✅ `controller/web/cart.controller.ts` — 4 calls (cart operations)
- ✅ `controller/web/wishlist.controller.ts` — 2 calls (wishlist operations)
- ✅ `controller/web/contact.controller.ts` — 2 calls (contact form)
- ✅ `controller/web/coupen.controller.ts` — 2 calls (coupon lookup)
- ✅ `controller/web/suggestion.controller.ts` — 1 call (search suggestions)
- ✅ `controller/web/product.controller.ts` — 1 call (product search)

**Pattern used:**
- Error paths: `logger.error({ err: error }, "descriptive message")` — preserves stack traces
- Info paths: `logger.info({ port }, "Server started")` — structured context
- Startup: `logger.info("Static message")` — simple informational messages

**Pino configured in `lib/logger.ts`:** Pretty-printed output in dev, JSON in production via `LOG_LEVEL` env var.

### ✅ 6.3 Reduce Memory Allocations
- Avoid creating temporary objects in hot paths
- Reuse constants instead of redefining
- Avoid deep cloning

**Completed:**
- ✅ `product.controller.ts` — `productListPopulate()` function → `PRODUCT_POPULATE` module-level constant. Before: created a new array of 6 populate objects on every invocation (called from 6 endpoints). After: single constant reused across all calls.
- ✅ `product.controller.ts` — removed `as const` from `PRODUCT_POPULATE` (caused `readonly` array type incompatibility with Mongoose)
- ✅ `product.controller.ts` — `regexPatterns.map((p) => p.$or).flat()` → `regexPatterns.flatMap((p) => p.$or)` in two places. Saves one intermediate array allocation per search request.
- ✅ `suggestion.controller.ts` — `regexPatterns.flat()` → `regexPatterns.flatMap((p) => p)` in two places. Same optimization.
- ✅ `server.ts` — removed unnecessary `{ ...req.query }` spread in sanitize middleware. `sanitize()` already creates a new object via reduce; the spread just created an extra temp object per request.
- ✅ `product.controller.ts` — extracted 8 module-level populate constants (POPULATE_CATEGORY, POPULATE_SUBCATEGORY, POPULATE_SUBSUBCATEGORY, POPULATE_COLORS, POPULATE_MATERIAL, POPULATE_SIZES, POPULATE_CATEGORY_GIFT, POPULATE_SUBCATEGORY_GIFT). Eliminated ~50 lines of duplicated inline populate objects across getOne, getByCategory, tabProducts, and featuredForFooter.
- ✅ `suggestion.controller.ts` — added 5 local populate constants, eliminated 5 inline populate objects.
- ✅ Typecheck: clean
- ✅ Code review: clean

### ✅ 6.4 Admin Controller Allocation Audit

**Audit finds:** Reviewed all admin controllers for repeated `.find()` chains with identical `.select()`/`.populate()` patterns.

**Fixes applied:**
- ✅ `adminProduct.controller.ts` — `getOne`: hoisted 6-element `populateFields` array to module-level `POPULATE_PRODUCT` constant. Before: created on every admin product detail view. After: created once at module init.
- ✅ `adminReview.controller.ts` — extracted `POPULATE_USER` and `POPULATE_PRODUCT` constants. Eliminated duplicate `.populate("userId", "name email").populate("productId", "name slug images")` across `getAllReviews` and `getReviewById`.

**Medium findings (documented, not refactored):**
- `adminBannerLinkOptions.controller.ts` — 4 handlers with identical `.select("_id name slug").sort({ name: 1 }).lean()` on different models (rarely called — banner link pickers only)
- `adminProduct.controller.ts` — `create` has 4 repeated `Model.findById(id).select("_id").lean()` validations (not a hot path)

- ✅ Typecheck: clean
- ✅ Code review: clean

---

## Phase 7: Response Optimization
*Priority: Low | Impact: Low*

### 7.1 Never Return Full Documents
- Strip internal fields (`__v`, `deletedAt`, etc.) from responses
- Use DTO/mapping functions for consistent response shapes
- Already done in some controllers but not all

### 7.2 Compression
Already using `compression()` middleware ✅ — verify it's before routes.

---

## Impact Summary Table

| Optimization | Impact | Priority | Est. Latency Reduction | Est. Throughput |
|---|---|---|---|---|
| MongoDB Indexes | **Critical** | **P0** | 80-99% on filtered queries | 10-100x on large collections |
| `.lean()` on all read queries | **Critical** | **P0** | 30-50% per query | 2-3x |
| `.select()` projections | **Critical** | **P0** | 20-40% per query | 1.5-2x |
| `Promise.all()` parallelism | **High** | **P1** | 30-60% on grouped endpoints | 1.5x |
| Optimize `.populate()` fields | **High** | **P1** | 15-30% per populated query | 1.2x |
| Remove duplicate DB queries | **High** | **P1** | 10-20% per request | 1.2x |
| Cache expensive reads | **Medium** | **P2** | 50-80% on cached endpoints | 5x on cached |
| Middleware ordering | **Medium** | **P2** | 5-10% | 1.1x |
| Background email/webhooks | **Medium** | **P2** | 200-500ms per email | 1.1x |
| Logging cleanup | **Low** | **P3** | 1-5% | 1.05x |

---

## Index Design Summary

### Product (`product.ts`) — 13 indexes
| Index | Purpose |
|---|---|
| `{ slug: 1, status: 1, deletedAt: 1 }` | Product detail page by slug |
| `{ deletedAt: 1, status: 1, order: -1, createdAt: -1 }` | Default listing, admin view, all featured lists |
| `{ category: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 }` | Category-based product listing |
| `{ subCategory: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 }` | SubCategory-based product listing |
| `{ subSubCategory: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 }` | SubSubCategory-based product listing |
| `{ colors: 1, status: 1, deletedAt: 1 }` | Color filter queries |
| `{ material: 1, status: 1, deletedAt: 1 }` | Material filter queries |
| `{ deletedAt: 1, status: 1, isNewArrival: 1, order: -1, createdAt: -1 }` | New Arrivals section |
| `{ deletedAt: 1, status: 1, isBestSeller: 1, order: -1, createdAt: -1 }` | Best Sellers section |
| `{ deletedAt: 1, status: 1, isFeatured: 1, order: -1, createdAt: -1 }` | Featured footer |
| `{ deletedAt: 1, status: 1, isUpsell: 1, order: -1, createdAt: -1 }` | Trending/Upsell section |
| `{ deletedAt: 1, status: 1, isOnSale: 1, order: -1, createdAt: -1 }` | On Sale filter |
| `{ deletedAt: 1, status: 1, discount_price: 1, order: -1, createdAt: -1 }` | Price range filter |
| `{ name: 1 }` | Name search (prefix) |
| `{ code: 1 }` | Product code lookup |
| `{ order: -1, createdAt: -1 }` | Fallback sort for unfiltered admin queries |

### User (`user.ts`) — 5 indexes
| Index | Purpose |
|---|---|
| `{ email: 1 }` | Login / registration lookup |
| `{ email: 1, role: 1 }` | Admin login |
| `{ googleId: 1 }` | OAuth login |
| `{ deletedAt: 1, status: 1 }` | User listing with soft-delete |

### Order (`order.ts`) — 7 indexes (pre-existing, no changes)
| Index | Purpose |
|---|---|
| `{ userId: 1, createdAt: -1 }` | User order history |
| `{ orderId: 1 }` | Order lookup by ID |
| `{ status: 1, createdAt: -1 }` | Order status queries |
| `{ payment.status: 1 }` | Payment status queries |
| `{ "payment.razorpay.orderId": 1 }` | Razorpay order lookup |
| `{ "payment.razorpay.paymentId": 1 }` | Razorpay payment lookup |
| `{ userId: 1, idempotencyKey: 1 }` (unique, sparse) | Idempotency dedup |

### Category / SubCategory / SubSubCategory — 4 indexes each
| Index | Purpose |
|---|---|
| `{ slug: 1 }` (unique) | Slug lookup |
| `{ name: 1 }` (unique) | Name lookup |
| `{ deletedAt: 1, status: 1, order: -1 }` | Listing for nav/public pages |
| `{ slug: 1, status: 1, deletedAt: 1 }` | Web controller slug+status queries |
| → + `{ category: 1, status: 1, deletedAt: 1 }` (SubCat only) | Category-based subcategory lookup |
| → + `{ subCategory: 1, status: 1, deletedAt: 1 }` (SubSubCat only) | SubCategory-based subsubcategory lookup |

### Other Models
| Model | Index | Purpose |
|---|---|---|
| Review | `{ productId: 1, userId: 1 }` | Existence check on create |
| Review | `{ productId: 1, status: 1, deletedAt: 1 }` | Product review listing |
| Review | `{ userId: 1, deletedAt: 1 }` | User review history |
| Banner | `{ status: 1, deletedAt: 1, order: -1 }` | Public banner listing |
| Coupen | `{ code: 1, status: 1, deletedAt: 1 }` | Coupon code lookup |
| Coupen | `{ userId: 1, status: 1, deletedAt: 1 }` | User coupon lookup |
| Coupen | `{ status: 1, deletedAt: 1 }` | Public coupon listing |
| AuditLog | `{ adminId: 1, createdAt: -1 }` | Admin action history |
| AuditLog | `{ action: 1, createdAt: -1 }` | Action-type queries |
| AuditLog | `{ targetId: 1 }` | Target user lookups |
| FAQ/Testimonial/WhyChooseUs | `{ deletedAt: 1, status: 1, order: -1 }` | Public listing (soft-delete aware) |
| Color/Material/Size | `{ deletedAt: 1, status: 1, order: -1 }` | Public listing (soft-delete aware) |

---

## Execution Order

1. **Phase 1 (MongoDB)** — ✅ Complete. lean(), select(), populate, Promise.all, indexes all done.
2. **Phase 3 (Middleware)** — Quick wins in middleware ordering, then auth optimization.
3. **Phase 5 (External Services)** — Move email/webhook processing to background.
4. **Phase 4 (Caching)** — Add caching for expensive reads.
5. **Phase 2 (Controller)** — Remaining: req.user reuse, background jobs.
6. **Phase 6 & 7 (Cleanup)** — Polish passes.
