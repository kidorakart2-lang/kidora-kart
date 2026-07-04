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

### 🔲 2.1 Remove Duplicate Database Queries<br>### ✅ 2.2 Reuse `req.user` from Auth Middleware
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

### 3.2 Conditional JSON Parsing
Only parse JSON for routes that need it. Skip for file upload routes that use multer.

### 3.3 Auth Middleware
- The `protect` middleware always fetches user from DB even for token-refresh scenarios
- Consider caching user lookups for short durations
- The auto-refresh logic in auth middleware adds complexity — evaluate if proactive refresh handles it

### 3.4 Helmet Configuration
Current: `app.use(helmet())` — uses all default middleware. Can be tuned to remove unnecessary protections for API-only servers.

---

## Phase 4: Caching Optimization
*Priority: Medium | Impact: Medium*

### 4.1 Optimize node-cache Usage
Current cache configuration is minimal (plain `new NodeCache()` with defaults).

**Recommended caching candidates:**
- Navigation data (categories/subcategories) — rarely changes, expensive query
- Banners — rarely changes
- FAQ list — rarely changes
- Home page sections — rarely changes
- Product filter results — short TTL (30-60s)
- Category/product slugs resolution

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

### 5.3 Cloudflare R2 Uploads
- The S3 client is already a singleton ✅
- Ensure file buffers are not duplicated in memory
- Stream uploads when possible instead of loading into memory

### 5.4 Multer Uploads
- Already using memoryStorage ✅
- File size limits already configured ✅
- Magic byte verification adds overhead — consider removing for trusted admin uploads

---

## Phase 6: Code Cleanup
*Priority: Low | Impact: Low-Medium*

### 6.1 Remove Unnecessary Object Spreads
```typescript
// ❌ Creates temporary object
const result = { ...data, extra: field };

// ✅ More efficient
data.extra = field;
```

### 6.2 Reduce Console Logging
- Replace `console.log` in production-critical paths
- Avoid logging large objects (entire request bodies, responses)
- Use structured logging only when needed

### 6.3 Reduce Memory Allocations
- Avoid creating temporary objects in hot paths
- Reuse constants instead of redefining
- Avoid deep cloning

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
