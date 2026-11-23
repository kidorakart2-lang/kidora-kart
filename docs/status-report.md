# Website Testing Status Report

> **Updated:** Aug 9, 2026
> **Environment:** Local — API `http://localhost:5000` + Web `http://localhost:3001`
> **DB:** Local MongoDB `jewelley_walla` (jewellery products)
> **Tooling:** browser-act CLI (chrome browser)

## Legend
- ✅ **PASS** — verified working end-to-end
- ⚠️ **PARTIAL** — renders but has known gaps / needs manual verification
- ❌ **FAIL** — broken
- ⏳ **PENDING** — not yet tested
- 🔴 **BLOCKED** — cannot test (dependency / data / auth missing)

---

## Test Matrix

| # | Page / Flow | Status | Notes |
|---|-------------|--------|-------|
| 1 | Home `/` — hero, sections, product cards render | ✅ PASS | Banners, category tiles, price bands, collections, New Arrivals with real products (Premium Gold Bangles ₹3,499), Why Choose Us, footer |
| 2 | Product detail `/product-details/:slug` | ✅ PASS | Premium Gold Bangles: gallery (4 imgs), ₹3,499 / ₹3,999 (13% OFF), color Red, Buy Now + Add to Cart, specs (Material/Weight/SKU), delivery estimate 4-5 days, reviews (0) |
| 3 | Category page `/category/[...slug]` | ⏳ PENDING | |
| 4 | Search `/search?q=` | ⏳ PENDING | |
| 5 | Cart page `/cart` — logged-in | ⏳ PENDING | (needs auth account) |
| 6 | Cart page `/cart` — guest (add → persist across reload) | ✅ PASS | Add as guest → cart shows Premium Gold Bangles (img/name/Red/₹3,499/9 in stock), Subtotal ₹3,499 + ₹50 ship = ₹3,549; persists across reload |
| 7 | Wishlist `/wishlist` — guest (populated cards) | ✅ PASS | Added Ivory Gold Bangles as guest → card shows image + name + ₹3,499/₹4,299 (19% OFF) + "Login to save permanently" notice |
| 8 | Wishlist `/wishlist` — logged-in | ⏳ PENDING | |
| 9 | Checkout flow `/checkout` | ⏳ PENDING | |
| 10 | Login / Signup | ⏳ PENDING | |
| 11 | FAQ `/faq` | ⏳ PENDING | |
| 12 | Contact `/contact-us` | ⏳ PENDING | |
| 13 | Order tracking `/order-track` | ⏳ PENDING | |
| 14 | Profile `/profile` | ⏳ PENDING | |
| 15 | Change password | ⏳ PENDING | |
| 16 | Homepage sections (bento grid image cover fix) | ✅ PASS (visual) | Category/product images render full-bleed in cards; no background gaps visible in markdown/state |
| 17 | Search suggestions (header) | ⏳ PENDING | |
| 18 | Footer nav / featured products | ✅ PASS | Footer renders (Free Shipping/Secure Payment/Certified Quality blocks visible on cart page) |
| 19 | Auth: logout | ⏳ PENDING | |
| 20 | Admin panel products (search + pagination) | ⏳ PENDING | |

---

## Browser Console Errors

| Page | Errors |
|------|--------|
| (collect during testing) | |

---

## Bugs Found During Testing

| # | Page | Bug | Severity | Status |
|---|------|-----|----------|--------|
| | | | | |

---

## Pages Left to Test / Blocker Notes

- (fill in)
