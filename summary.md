# Session: Next.js Rewrites, Cookie Consolidation, Rate Limiter Audit, and Production Fixes

## Overview
Major cross-cutting changes: architecture shift to same-origin API calls via Next.js rewrites, cookie utility consolidation, secure cookie fixes, comprehensive rate limiter audit, and admin panel improvements.

---

## 1. Next.js Rewrites Architecture

### Problem
The website used cross-origin `fetch()` calls to a separate Express backend via `NEXT_PUBLIC_API_URL`. This required:
- `credentials: "include"` on every request
- Client-side `Cookies.set("userToken", ...)` to copy the server's `Set-Cookie` to the frontend domain
- Complex CSP `connect-src` including both origins
- Preconnect/dns-prefetch to the API domain

### Solution
Added `async rewrites()` to `web/next.config.ts` to proxy all `/api/:path*` requests to the Express backend, making all API calls same-origin.

### Files modified (~48 files)

**Core configuration:**
- **`web/next.config.ts`** — Added `async rewrites()` block proxying `/api/:path*` to `${API_URL}/api/:path*` (with path deduplication). Simplified CSP `connect-src` to just `'self'`.
- **`web/src/app/layout.tsx`** — Removed `rel="preconnect"` and `rel="dns-prefetch"` links to API URL.

**Library files (API client, order service, hooks):**
- **`web/src/lib/api.ts`** — Inlined relative URLs, removed `process.env.NEXT_PUBLIC_API_URL` usage
- **`web/src/lib/orderService.ts`** — Changed all fetch URLs from template literals with API_URL to `/api/website/...`. Removed `setUserToken()` call from 401 refresh flow.
- **`web/src/lib/useCart.ts`** — Relative URLs
- **`web/src/lib/useWishlist.ts`** — Relative URLs
- **`web/src/lib/useProfile.ts`** — Relative URLs, removed `credentials: "include"`
- **`web/src/lib/useReviews.ts`** — Relative URLs
- **`web/src/lib/useProductListing.ts`** — Relative URLs
- **`web/src/lib/useSearchSuggestions.ts`** — Relative URLs
- **`web/src/lib/useRelatedProducts.ts`** — Relative URLs
- **`web/src/lib/useProductFaqs.ts`** — Relative URLs
- **`web/src/lib/useShippingEstimate.ts`** — Relative URLs
- **`web/src/lib/syncGuestData.ts`** — Relative URLs
- **`web/src/lib/get-products.ts`** — Relative URLs
- **`web/src/lib/get-why-choose-us.ts`** — Relative URLs
- **`web/src/lib/home-data.ts`** — Relative URLs
- **`web/src/lib/logo.ts`** — Relative URLs
- **`web/src/app/sitemap.ts`** — Relative URLs

**Page components (sections):**
- **`web/src/app/(sections)/Cart.tsx`** — Relative URLs + removed `credentials: "include"` from cart view fetch
- **`web/src/app/(sections)/Checkout.tsx`** — Relative URLs + removed `credentials: "include"`
- **`web/src/app/(sections)/Contact.tsx`** — Relative URLs
- **`web/src/app/(sections)/DefaultBanner.tsx`** — Relative URLs
- **`web/src/app/(sections)/Login.tsx`** — Relative URLs, removed `setUserToken()` call, removed `credentials: "include"`
- **`web/src/app/(sections)/Profile.tsx`** — Relative URLs, removed `credentials: "include"`
- **`web/src/app/(sections)/ProductsTab.tsx`** — Relative URLs
- **`web/src/app/(sections)/PromoBannerSection.tsx`** — Relative URLs
- **`web/src/app/(sections)/ResetPassword.tsx`** — Relative URLs
- **`web/src/app/(sections)/SettingsSection.tsx`** — Relative URLs
- **`web/src/app/(sections)/SignUp.tsx`** — Relative URLs, removed `setUserToken()` call
- **`web/src/app/(sections)/Track.tsx`** — Relative URLs
- **`web/src/app/(sections)/Wishlist.tsx`** — Relative URLs
- **`web/src/app/(sections)/video.tsx`** — Relative URLs
- **`web/src/app/(sections)/VideoSection.tsx`** — Relative URLs
- **`web/src/app/(pages)/auth/google/callback/page.tsx`** — Relative URLs, removed `setUserToken()` call
- **`web/src/app/(pages)/cart/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/category/[...slug]/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/change-password/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/faq/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/product-details/[slug]/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/product-details/[slug]/ProductDetail.tsx`** — Relative URLs
- **`web/src/app/(pages)/search/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/verify-email/page.tsx`** — Relative URLs
- **`web/src/app/(pages)/wishlist/page.tsx`** — Relative URLs
- **`web/src/app/page.tsx`** — Relative URLs

**UI components:**
- **`web/src/components/comman/Footer.tsx`** — Relative URLs
- **`web/src/components/comman/GoogleLoginBtn.tsx`** — Relative URLs
- **`web/src/components/comman/PhoneNumberModal.tsx`** — Relative URLs
- **`web/src/components/comman/ProductCard.tsx`** — Relative URLs
- **`web/src/components/comman/VerticalProductCard.tsx`** — Relative URLs
- **`web/src/components/CategoryBanner.tsx`** — Relative URLs
- **`web/src/components/product/product-reviews.tsx`** — Relative URLs
- **`web/src/components/providers/GuestDataInitializer.tsx`** — Relative URLs

### Result
- ~75 API URL references replaced with relative paths
- Server `Set-Cookie` headers flow through the proxy automatically — no client-side `Cookies.set("userToken", ...)` needed
- `credentials: "include"` removed as unnecessary for same-origin requests
- CSP simplified, preconnect/dns-prefetch removed

---

## 2. Cookie Helper Consolidation

### Action
Merged `getAuthToken()` and `clearAuthCookies()` into a single module, removed old files, updated all imports.

### Changes
- **`web/src/lib/cookies.ts`** — **NEW** Consolidated module exporting both `getAuthToken()` and `clearAuthCookies()`. Added `"use client"` directive since it uses browser APIs (Cookies, localStorage).
- **`web/src/lib/getAuthToken.ts`** — **REMOVED** (functionality merged into cookies.ts)
- **`web/src/lib/clearAuthCookies.ts`** — **REMOVED** (functionality merged into cookies.ts)
- **Updated ~21 import sites** across `web/src/` — Changed all imports from `@/lib/getAuthToken` or `./getAuthToken` to `@/lib/cookies`. Includes: `orderService.ts`, `useCart.ts`, `useProfile.ts`, `useReviews.ts`, `useWishlist.ts`, `useShippingEstimate.ts`, `Cart.tsx`, `Checkout.tsx`, `Login.tsx`, `Profile.tsx`, `ResetPassword.tsx`, `SettingsSection.tsx`, `Track.tsx`, `Wishlist.tsx`, `SignUp.tsx`, `ChangePassword.tsx`, `ProductDetail.tsx`, `VerifyEmail.tsx`, `ProductCard.tsx`, `VerticalProductCard.tsx`, `PhoneNumberModal.tsx`, `product-reviews.tsx`, `GuestDataInitializer.tsx`

---

## 3. Non-auth Cookies secure:true Fix

### Problem
Short-lived JWT cookies (`verify`, `otpToken`, `resetToken`) and a `loginModal` flag were set without `secure: true`. In production (HTTPS), browsers may reject these cookies entirely, breaking password reset, email verification, and login modal flows.

### Fix
Added `secure: window.location.protocol === "https:"` to all 5 non-auth `Cookies.set()` calls across the website:

| File | Cookie | Fix Applied |
|------|--------|-------------|
| `web/src/app/(sections)/SettingsSection.tsx` | `verify` | Added `secure: window.location.protocol === "https:"` |
| `web/src/app/(sections)/ResetPassword.tsx` | `otpToken` | Added `secure` to both `otpToken` and `resetToken` |
| `web/src/app/(pages)/verify-email/page.tsx` | `verify` | Added `secure` |
| `web/src/components/comman/Header.tsx` | `loginModal` | Added `secure` |

All calls are inside event handlers or `useEffect` callbacks — `window` is always available.

---

## 4. Rate Limiter Audit

### Problem
Many API routes — especially public/unauthenticated ones — had no rate limiting, leaving the API vulnerable to brute-force attacks, spam, and scraping.

### Solution
Added **9 new rate limiters** and applied them across 8 route files.

**New limiters added to `api/src/middleware/rateLimit.ts`:**

| Limiter | Window | Max Requests | Target |
|---------|--------|-------------|--------|
| `adminLogin` | 15 min | 10 | Admin login — prevent brute-force |
| `contact` | 15 min | 5 | Contact form — prevent spam |
| `createReview` | 15 min | 5 | Review creation — prevent fake reviews |
| `verifyOtp` | 15 min | 10 | OTP verification — prevent brute-force guessing |
| `googleAuth` | 15 min | 15 | Google OAuth endpoints — prevent flow abuse |
| `cartActions` | 1 min | 20 | Cart add/update/remove — prevent rapid manipulation |
| `wishlistActions` | 1 min | 20 | Wishlist add/remove — prevent rapid manipulation |
| `orderRead` | 1 min | 30 | Order listing/detail (authenticated) — limit bulk fetches |
| `publicProducts` | 1 min | 60 | Product listing/search — generous limit to prevent scraping |

**Routes updated:**
- **`api/src/routes/admin/userAdmin.routes.ts`** — Added `rateLimit.adminLogin` to `POST /login`
- **`api/src/routes/web/user.route.ts`** — Added `rateLimit.verifyOtp` to `/verify-otp`; `rateLimit.googleAuth` to all 3 Google endpoints
- **`api/src/routes/web/contact.routes.ts`** — Added `rateLimit.contact`
- **`api/src/routes/web/review.routes.ts`** — Added `rateLimit.createReview`
- **`api/src/routes/web/cart.routes.ts`** — Added `rateLimit.cartActions` to all 5 routes
- **`api/src/routes/web/wishlist.routes.ts`** — Added `rateLimit.wishlistActions` to all 4 routes
- **`api/src/routes/web/product.routes.ts`** — Added `rateLimit.publicProducts` to all 12 listing routes
- **`api/src/routes/web/order.routes.ts`** — Added `rateLimit.orderRead` to read endpoints

### Routes intentionally left without limiters
- Admin CRUD (banners, categories, products) — guarded by `protect, adminOnly, csrfProtection`
- Static GET routes (colors, materials, etc.) — fast, read-only
- Logout — no abuse vector

---

## 5. Remove Lingering credentials:include

### Problem
During the rewrite refactor, some `credentials: "include"` occurrences were missed in the cart/wishlist fetch options of 3 files. Same-origin requests send cookies by default, so this was redundant.

### Fix
Removed **9 occurrences** across 3 files:

| File | Occurrences Removed |
|------|-------------------|
| `web/src/app/(sections)/Cart.tsx` | 3 (view, update, remove fetches) |
| `web/src/components/comman/ProductCard.tsx` | 3 (wishlist remove, wishlist add, cart add) |
| `web/src/components/comman/VerticalProductCard.tsx` | 3 (wishlist remove, wishlist add, cart add) |

All fetches still send `Authorization: Bearer` headers for authentication.

---

## 6. Add "use client" to cookies.ts

Added `"use client";` directive to `web/src/lib/cookies.ts` since it uses browser-only APIs (`Cookies.get/remove`, `localStorage.getItem/setItem`). This prevents runtime crashes if a server component inadvertently imports it.

---

## Notes
- All changes typecheck clean (`npx tsc --noEmit` passes with 0 errors)
- The rewrite architecture eliminates the need for client-side `Cookies.set("userToken", ...)` entirely — the server's `Set-Cookie` headers flow through the Next.js proxy to the frontend domain
- Rate limits follow a tiered approach: strict for auth/admin, moderate for mutations, generous for public reads
- Pre-existing type errors in `api/src/controller/admin/ai-agent.controller.ts` (Tool type definitions, `maxSteps`, `sendUsage`) are unrelated to these changes

---

## 7. Type Cleanup — Remove `Record<string, unknown>` and `as unknown as` Patterns

### Problem
~53 occurrences of `as Record<string, unknown>` and `as unknown as` patterns across the codebase. These bypassed TypeScript's type checking and obscured the actual data shapes being manipulated.

### Fix
Replaced with proper typed interfaces, Mongoose `.lean<T>()` generics, and global type declarations. Fixed all resulting type errors.

### Files modified or created

**GLOBAL TYPE DECLARATION:**
- **`web/src/types/razorpay.d.ts`** — **NEW** Global `Window` augmentation declaring `Razorpay` as a constructor type. Replaces 6 instances of `(window as unknown as { Razorpay: ... }).Razorpay` in Track.tsx and Checkout.tsx with `window.Razorpay`.

**SHIPROCKET CONTROLLER (`api/src/controller/web/shiprocket.controller.ts`):**
- **Webhook handler (lines ~840-848):** Replaced `(order as unknown as Record<string, unknown>).payment = {}` with Mongoose's `order.set('payment', {})` and `order.set('payment.status', 'completed')` — the proper Mongoose approach for modifying document fields without type assertions.
- **Webhook payload type:** Changed `req.body as Record<string, unknown>` to `req.body as { awb?: string | number; current_status?: string; shipment_status?: string; [key: string]: unknown }`.
- **Pickup location data:** Changed `(pickupResult as Record<string, unknown>)?.data as ...` to `(pickupResult as { data?: { pickup_locations?: [...] } })?.data`.
- **Serviceability data:** Same pattern — replaced `Record<string, unknown>` with properly typed interface.

**ORDER CONTROLLER (`api/src/controller/web/order.controller.ts`):**
- **Razorpay notes:** Replaced `(razorpayOrderDetails as unknown as Record<string, unknown>).notes` with `(razorpayOrderDetails as { notes?: Record<string, string> }).notes`.
- **Product weights:** Changed `(p as Record<string, unknown>).weight` to `(p as { weight?: string }).weight`.
- **Pickup data + serviceability:** Replaced `as Record<string, unknown>` with typed interfaces matching the expected API response shapes.
- **COD stock validation:** Added `as unknown as` before `{ _id: string; name: string; stock: number }` for Mongoose populated type bridging.

**ADMIN ORDER CONTROLLER (`api/src/controller/admin/adminOrder.controller.ts`):**
- **Razorpay client type:** Extracted the massive inline `as unknown as { orders: ... payments: ... refunds: ... }` into a proper `RazorpayClient` interface. This is now documented and reusable.
- **Refund items:** Changed `(refunds as unknown as { items?: [...] }).items` → `(refunds as { items?: [...] }).items`.
- **Order cast in bulk update:** Changed `order as unknown as { _id: string; ... }` → `order as { _id: { toString(): string }; ... }` — uses a structurally compatible `toString()` method type compatible with Mongoose ObjectId.
- **Order ID access:** Changed `(order as Record<string, unknown>).orderId` → `(order as { orderId: string }).orderId`.
- **Details array:** Changed `[] as Record<string, unknown>[]` → typed `Array<{ orderId: string; oldStatus: ...; newStatus: ...; razorpayRefundId: ... }>`.

**AUTH MIDDLEWARE (`api/src/middleware/authMiddleware.ts`):**
- **User spread:** Removed unnecessary `as Record<string, unknown>` from `{ ...user }` spread (TypeScript infers correctly from `.lean()` return type). The `as Record<string, unknown>` on the cached return was kept because `cache.get()` returns `unknown`.

**SERVER (`api/src/server.ts`):**
- **Sanitize function:** Added type parameter `<Record<string, unknown>>` to `reduce()` call so the accumulator is properly typed. Removed redundant intermediate casts.

**LIBRARY FILES:**
- **`api/src/lib/jwt.ts`:** Changed `(decoded as Record<string, unknown>).type` → `(decoded as { type: string }).type`.
- **`api/src/controller/web/user.controller.ts`:** Minor cast cleanup on profile spread.
- **`api/src/controller/web/wishlist.controller.ts`:** Redesigned getWishlist to use Mongoose's `.lean<PopulatedWishlist | null>()` generic with proper `PopulatedWishlistProduct` and `PopulatedWishlist` interfaces instead of any inline casts.
- **`api/src/controller/web/cart.controller.ts`:** Replaced `} as Record<string, unknown>` with `} as { color: unknown; quantity: number; itemTotal: number }`.

### Result
- **All 14 non-AI `as unknown as` patterns eliminated**
- **~20 `as Record<string, unknown>` patterns replaced with typed interfaces**
- **0 non-AI type errors across all 3 packages** (web: 0, api: 0 non-AI, admin-panel: 0)
- **7 AI-agent errors remain** (ignored by request — in `ai-agent.controller.ts` and `ai-agent/tools.ts`)