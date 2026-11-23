# API Usage Record

> Living document — record every API endpoint, where it is called from, and whether it
> returns more data than the caller needs. Update it whenever a route is added/changed.
> Goal: find payload-shedding opportunities (`?minimal=`, `?fields=`, `?limit=`) so the
> website doesn't ship large documents to callers that only need a few fields.

Legend:
- **Caller** — web = storefront (`web/`), admin = admin panel (`admin-panel/`), both.
- **Payload** — rough size of the response document (H = heavy, M = medium, L = light).
- **Trim?** — can this response be reduced with a param? (yes / done / n/a)

---

## Web (public) endpoints

### Products — `api/src/routes/web/product.routes.ts`

| Method | Endpoint | Caller | Payload | Trim? | Notes |
|---|---|---|---|---|---|
| GET | `/api/website/product/all` | web sitemap + `generateStaticParams` (product-details) | H (full docs) | **done** | `?minimal=true` returns only `slug updatedAt`. |
| GET | `/api/website/product/details/:slug` | web product-detail page, metadata, `useProduct`, batch fallback | H | n/a | Full page needs everything. |
| POST | `/api/website/product/batch` | web guest cart & guest wishlist (`useProductsByIds`) | M | yes | Returns full product docs for `{ids}`. Guest cards only need name/image/price/slug/stock — could accept `?fields=`. |
| GET | `/api/website/product/get-by-search` | web search page, home search suggestions (`getProducts`, `fetchProductsBySearch`) | M | yes | Search suggestions (`limit=8`) only need name/slug/image/price. Consider `?fields=`. |
| GET | `/api/website/product/get-by-filter` | web product listing (`useProductListing`) | M | yes | Grid only needs card fields. `PRODUCT_SELECT` is already trimmed but includes description/variants — could drop `description` for listing. |
| GET | `/api/website/product/get-by-category/:cat/:sub/:subsub` | web category grid | M | yes | Same as above. |
| GET | `/api/website/product/get-related-products` | web related-products carousel | M | yes | Only card fields needed. |
| GET | `/api/website/product/new-arrivals` | web home `getNewArrivals` | M | yes | Card fields only. |
| GET | `/api/website/product/trending-products` | web home `getTrendingProducts` | M | yes | Card fields only. |
| GET | `/api/website/product/best-sellers` | web home `getBestSellers` | M | yes | Card fields only. |
| GET | `/api/website/product/tab-products` | web home `getTabsData` | M | yes | Card fields only. |
| GET | `/api/website/product/featured-for-footer` | web root layout `getFeaturedProducts` | M | yes | Only 2 products; card fields only. |

### Navigation / filters

| Method | Endpoint | Caller | Payload | Trim? | Notes |
|---|---|---|---|---|---|
| GET | `/api/website/nav` | web root layout, sitemap, category `generateStaticParams`, ProductsTab | M (full tree) | **done** | `?minimal=true` returns `_id slug updatedAt status deletedAt` (+ refs) — used by sitemap & static params. |
| GET | `/api/website/color` | web category filter sidebar (`getColor`) | L | n/a | |
| GET | `/api/website/material` | web category filter sidebar (`getMaterial`) | L | n/a | |

### Homepage / content

| Method | Endpoint | Caller | Payload | Trim? | Notes |
|---|---|---|---|---|---|
| GET | `/api/website/home-page` | web home `getHomeSections` | M | yes | Sections config only — verify no unused nested config is sent. |
| GET | `/api/website/banner` | web home DefaultBanner, VideoSection, PromoBannerSection | M | yes | Could accept `?active=true` to filter server-side. |
| GET | `/api/website/testimonial` | web home `fetchTestimonials` | L | n/a | |
| GET | `/api/website/whyChooseUs` | web home `getWhyChooseUs` | L | n/a | |
| GET | `/api/website/faq` | web FAQ page | L | n/a | |
| GET | `/api/website/logo` | web root layout `getLogo` | L | n/a | |
| GET | `/api/website/result/suggestion` | web search suggestions (`useSearchSuggestions`) | M | yes | Same as get-by-search — only top ~8 matches needed. |

### Cart / Wishlist (auth)

| Method | Endpoint | Caller | Payload | Trim? | Notes |
|---|---|---|---|---|---|
| GET | `/api/website/cart/view` | web cart page (SSR), `useCartView`, Header badge | H (full embedded products) | yes | Page needs full product data, but Header badge reuses this — consider a light `/count` endpoint. |
| POST | `/api/website/cart/add` | web ProductCard, guest-sync, product detail | L | n/a | |
| PUT | `/api/website/cart/items/update/:itemId` | web Cart page | L | n/a | |
| PUT | `/api/website/cart/items/remove/:itemId` | web Cart page | L | n/a | |
| GET | `/api/website/wishlist/view` | web wishlist page (SSR), `useWishlistView` | H (full embedded products) | yes | Only id/slug/name/image/price/stock needed — consider `?fields=` or lean select. |
| POST | `/api/website/wishlist/add` | web ProductCard, guest-sync | L | n/a | |
| PUT | `/api/website/wishlist/remove/:productId` | web ProductCard, Wishlist page | L | n/a | |

### Orders / payments / shipping (auth)

| Method | Endpoint | Caller | Payload | Trim? | Notes |
|---|---|---|---|---|---|
| GET | `/api/website/order/my-orders` | web profile orders | H | yes | List view doesn't need full item docs — consider `?fields=` / pagination. |
| GET | `/api/website/order/single/:id` | web order detail | H | n/a | |
| POST | `/api/website/order/create` | web checkout | H (response echoes order) | n/a | |
| POST | `/api/website/order/create-razorpay-order` | web checkout | L | n/a | |
| POST | `/api/website/order/verify-payment` | web checkout | L | n/a | |
| POST | `/api/website/order/cancel` / `cancel-or-rto` / `rto` / `pickup` / `label` / `invoice` / `estimate` / `track/:id` | web order-track & profile | L/M | n/a | |
| POST | `/api/website/shipping/track/:orderId` | web Track page | L | n/a | |

### Auth / users (web)

`/register`, `/login`, `/re-login`, `/logout`, `/refresh`, `/verify-otp`, `/verify-user`,
`/change-password`, `/update-profile`, `/profile`, Google endpoints — all L/M, no trimming needed.

### Misc web

`/contact/create`, `/location/reverse-geocode`, `/product-faq` — L/M, n/a.

---

## Admin endpoints (`api/src/routes/admin/`)

All behind `protect, adminOnly` (some + `csrfProtection`). CRUD per entity follows the same
shape — e.g. `POST /view` list endpoints below are the ones that can ship more data than the
table needs:

| Endpoint | Caller | Trim? | Notes |
|---|---|---|---|
| `POST /api/admin/product/view` | admin products page (`fetchProducts`) | **done** | Already paginated (50/page); `search` supported. Could add `?fields=` for the table columns. |
| `POST /api/admin/order/all` | admin orders page | H | Returns every order with full items — the table only needs a handful of fields; add pagination/`?fields=`. |
| `POST /api/admin/{banner|category|subCategory|subSubCategory|color|material|review|faq|logo|testimonial|whyChooseUs}/view` | admin list pages | M | Tables use ~5 columns; `?fields=` would help. |
| `POST /api/admin/ai-response/list` | admin AI responses page | M | Paginated (50) — fine. |

---

## Data-shedding priority list

1. **`GET /api/website/product/all`** — ✅ done (`?minimal=true`, used by sitemap + static params).
2. **`GET /api/website/nav`** — ✅ done (`?minimal=true`).
3. **`POST /api/admin/order/all`** — returns every order fully populated; add `page/limit` + lean select for the orders table.
4. **`GET /api/website/cart/view` + `wishlist/view`** — Header only needs counts; add light `/count` endpoints or a `?count=true` param.
5. **`POST /api/website/product/batch`** — guest cart/wishlist cards need ~6 fields; add `?fields=`.
6. **Listing endpoints** (`get-by-filter`, `get-by-category`, `new-arrivals`, etc.) — drop `description`/`variants` from the list select; cards don't render them.
7. **Search endpoints** (`get-by-search`, `suggestion`) — add `?fields=` for the suggestion dropdown.

---

## Cache status (web server-side fetches)

All web server-side data fetches are now cached via `"use cache"` + `cacheLife` + `cacheTag`
except the intentional exceptions below:

| Caller | Endpoint | Status |
|---|---|---|
| root layout `getNavigation` | `/api/website/nav` | ✅ cached (`navigation` profile) |
| root layout `getFeaturedProducts` | `/api/website/product/featured-for-footer` | ✅ cached (`best-sellers`) |
| root layout `getLogo` | `/api/website/logo` | ✅ cached (`navigation`) |
| home sections/banners/products/testimonials | home-data.ts | ✅ cached |
| category colors/materials | `getColor`/`getMaterial` | ✅ cached (`filters`) |
| product detail | `getProducts(slug)` | ✅ cached (`products`, `product:{slug}` tag) |
| search page, faq page, ProductsTab nav | — | ✅ cached |
| sitemap product/category fetches | `?minimal=true` | ✅ cached (`search` / `navigation`) |
| cart/wishlist SSR fetches | cart/view, wishlist/view | ⛔ intentionally dynamic (auth cookie — must not cache) |
