# Web — Storefront

Next.js 16 customer-facing storefront for the Jewellery Walla e-commerce platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| State | Redux Toolkit + redux-persist (sessionStorage) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Animations | motion (ESM-only re-export of framer-motion) |
| HTTP | native fetch |
| Carousel | swiper |
| Notifications | sonner |
| Auth | JWT (httpOnly cookie) + Google OAuth (backend) |
| Sitemap | next-sitemap v4 (build-time generation) |

## Project Structure

```
web/src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with Lato font, metadata, CSP
│   ├── page.tsx                # Home page (hero, sections, tabbed products)
│   ├── error.tsx               # Error boundary with retry
│   ├── loading.tsx             # Loading skeleton
│   ├── not-found.tsx           # 404 page
│   ├── (pages)/                # Route groups: cart, wishlist, product-details, category, etc.
│   └── (sections)/             # Shared section components: Banner, Slider, Cart, Checkout, etc.
├── components/
│   ├── comman/                 # Header, Footer, ProductCard, SearchBar
│   ├── ui/                     # shadcn/ui components + custom (images-slider)
│   └── product/                # ProductReviews, RelatedProducts
├── hooks/                      # use-mobile
├── lib/                        # utils.ts (site config, metadata, schema helpers), fetchCartWislist, fetchUser, orderService, getAuthToken, syncGuestData
├── redux/                      # Redux store, features (auth, cart, wishlist, filters)
├── types/                      # Shared types (auth, product, order, sync)
└── proxy.ts                    # API proxy (not used — auth via httpOnly cookies)
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home (hero banner, product tabs, testimonials) |
| `/category/[slug]` | Category listing with filters |
| `/product-details/[slug]` | Product detail with reviews, FAQs, related |
| `/cart` | Cart with quantity management |
| `/wishlist` | Wishlist management |
| `/checkout` | Checkout with COD/Razorpay/COD-advance |
| `/login` | Login |
| `/signup` | Registration |
| `/faq` | FAQ |
| `/contact` | Contact form |
| `/reset-password` | Password reset flow |
| `/verify-email` | Email verification |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on **port 3001** (`next dev -p 3001`) |
| `pnpm build` | Production build (includes sitemap generation) |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm lighthouse` | Run Lighthouse CI baseline (requires `pnpm build && pnpm start` first) |
| `pnpm lint` | Run TypeScript check |

## Quality Tooling

- **Lighthouse CI** (`lighthouserc.js`) — Desktop preset, single run. Reports saved to `lhci_reports/`.

  | Category | Budget |
  |----------|--------|
  | Performance | ≥ 0.80 (warn) |
  | Accessibility | ≥ 0.90 (warn) |
  | SEO | ≥ 0.90 (warn) |
  | Best Practices | ≥ 0.90 (warn) |

- **axe-core** (`@axe-core/react`) — Development-time accessibility audit. Violations logged to browser console on every interaction. Disabled in production builds.

## Auth Flow

1. Backend sets `userToken` httpOnly cookie on register/login/google-auth
2. Frontend reads token from sessionStorage (redux-persist) for `Authorization` header
3. Server components read from `cookies()` (next/headers)
4. Refresh token rotation: 15min JWT + 7-day revocable refresh token
5. Logout clears httpOnly cookie server-side

## Redux State Structure

6 slices persisted to `sessionStorage` via redux-persist:

| Slice | Key | Persisted | Description |
|------|-----|-----------|-------------|
| `auth` | `auth` | ✅ (token filtered, user null on rehydrate) | JWT token, user profile, login/logout actions |
| `cart` | `cart` | ✅ | Cart items, quantities, selected color/size per item |
| `wishlist` | `wishlist` | ✅ | Wishlist item IDs, guest wishlist support |
| `filters` | `filters` | ❌ | Category filter state (selected subcategories, sub-subcategories) |
| `ui` | `ui` | ❌ | Sidebar open state, cart/wishlist sheet visibility, login modal |
| `logo` | `logo` | ❌ | Site logo URL fetched from API |

The persist whitelist is `["cart", "wishlist", "auth"]`. Auth tokens are stripped during serialization (token lives in httpOnly cookie). An encryption transform is applied conditionally. On `QuotaExceededError`, storage is cleared and re-attempted gracefully.

## Cache Invalidation Flow

The admin panel triggers cache purges via the shared `/api/revalidate` endpoint on **this app (`:3001`)**:

```
POST /api/revalidate
Authorization: Bearer <REVALIDATE_SECRET>
Content-Type: application/json

{ "tags": ["products", "homepage"] }
```

1. **Admin CRUD** → calls `invalidateCache([tag1, tag2, ...])` in the admin panel's `@/lib/invalidate-cache.ts`, which fetches `{FRONTEND_URL}/api/revalidate` (`NEXT_PUBLIC_FRONTEND_URL`, must point here — `http://localhost:3001`)
2. **Authenticates with `Authorization: Bearer <REVALIDATE_SECRET>`** — the secret is never sent in the body (matching this app's `REVALIDATE_SECRET` env var)
3. **Server calls `revalidateTag(tag, profile)`** for each tag, purging the Next.js Data Cache
4. **Tags are defined** in `@/lib/revalidation-tags.ts` with constants like `TAG_PRODUCTS`, `TAG_CATEGORIES`, `TAG_HOMEPAGE`, and scoped helpers like `productTag(id)`, `categoryTag(slug)`, `brandTag(slug)`

**Other details:**
- `GET /api/revalidate` is **public** and returns a version stamp — the client-side `CacheInvalidationProvider` (via `useCacheInvalidation.ts`) polls it every 30s and invalidates React Query caches when the stamp changes.
- The route's `next.config.ts` adds CORS headers (`Access-Control-Allow-Origin: *`, `POST, OPTIONS`) so the admin panel's cross-origin fetch from `:3000` works.
- The admin panel's `next.config.ts` rewrites `/api/revalidate` to this app so it isn't proxied to the API backend.

This is how admin edits to products, banners, categories, or homepage sections instantly reflect on the storefront without a full redeploy.

## Theming & CSS Variables

The app uses a two-tier theming system — shadcn/ui semantic tokens + brand-specific customization variables — defined in `globals.css` with light and `.dark` overrides.

### Brand Colors

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--brand-primary` | `#b45309` / `#d4af37` (gold) | `#fbbf24` (amber-400) | Primary accent, headings, CTAs |
| `--brand-secondary` | `#e11d48` (rose-600) | `#fb7185` (rose-400) | Secondary accent |
| `--brand-heading` | `#d97706` | `#fbbf24` | Heading color |
| `--brand-primary-dark` | `#b45309` | `#f59e0b` | Hover/active states |
| `--brand-primary-light` | `#fbbf24` | `#fde68a` | Highlights, badges |
| `--brand-section-bg` | `#f8f8f8` | `#1e1e2e` | Alternating section backgrounds |
| `--brand-gradient-from` | `#d97706` | `#fbbf24` | Gradient start |
| `--brand-gradient-to` | `#b45309` | `#f59e0b` | Gradient end |

### Full Palette Scales

- **`--brand-{50..950}`** — Amber scale (warm gold). Light mode: lighter yellows → dark amber. Dark mode: dark browns → light gold.
- **`--brand-accent-{50..950}`** — Rose scale (pinkish red). Light mode: soft pinks → deep red. Dark mode: dark maroons → soft pinks.

### Card Theme Variables

4 bento-style cards with distinct colors, each with `bg`, `icon`, and `ring` slots:

| Variable | Example (Light) |
|----------|----------------|
| `--brand-card-1-bg` | `oklch(0.987 0.022 95.277)` |
| `--brand-card-1-icon` | `oklch(0.555 0.163 48.998)` |
| `--brand-card-1-ring` | `oklch(0.879 0.169 91.605)` |

(Prefix `1` through `4` for each card slot.)

### Price Badge Gradients

| Variable | Colors |
|----------|--------|
| `--brand-price-1-from/via/to` | `#fbbf24` → `#eab308` → `#d97706` (gold) |
| `--brand-price-2-from/via/to` | `#c084fc` → `#d946ef` → `#9333ea` (purple) |
| `--brand-price-3-from/via/to` | `#fb7185` → `#ec4899` → `#e11d48` (rose) |
| `--brand-price-4-from/via/to` | `#34d399` → `#14b8a6` → `#059669` (green) |

### Utility Classes

| Class | Effect |
|-------|--------|
| `.bg-section` | Applies `--brand-section-bg` |
| `.bg-section-subtle` | Applies `--brand-section-bg-subtle` (semi-transparent) |
| `.hover-lift` | `translateY(-1)` on hover |
| `.hover-glow` | Box-shadow using `--brand-primary` with 30% opacity on hover |
| `.section-container` | Max-width 1280px centered with responsive padding |
| `.section-heading` | Responsive heading typography |
| `.section-subheading` | Subheading typography |

## Environment Variables

Environment variables live in the **gitignored `web/.env`** file (there is no committed example for web):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/
REVALIDATE_SECRET=your-random-secret-here
NEXT_PUBLIC_CDN_HOST=cdn.jewellerywalla.com
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL for server component data fetching |
| `REVALIDATE_SECRET` | Shared secret with admin panel — validates `/api/revalidate` requests |
| `NEXT_PUBLIC_CDN_HOST` | CDN hostname used in Content-Security-Policy header and next/image remotePatterns |
| `AI_PROVIDER` | **Backend-only.** AI provider: `"gemini"` (default) or `"openrouter"`. See `api/.env.example` |
| `OPENROUTER_API_KEY` | **Backend-only.** OpenRouter API key (required when `AI_PROVIDER=openrouter`). See `api/.env.example` |
| `OPENROUTER_MODEL` | **Backend-only.** OpenRouter model ID, e.g. `"openrouter/free"` (default). See `api/.env.example` |

## Cache Components (`"use cache"`)

Next.js 16 Cache Components model enabled via `cacheComponents: true` in `next.config.ts`. All server data fetchers use the `"use cache"` directive with `cacheLife()` profiles and `cacheTag()` for tag-based invalidation managed by the admin panel.

**20 `"use cache"` directives across 10 files:**

| File | Functions | Cache Profile | Tags |
|------|-----------|--------------|------|
| `app/layout.tsx` | `getNavigation()`, `getFeaturedProducts()` | `navigation`, `products` | `TAG_NAVIGATION`, `TAG_FEATURED_PRODUCTS` |
| `app/page.tsx` | `GetTestimonials()`, `getTabsData()`, `getNewArrivals()`, `getBestSellers()`, `getTrendingProducts()` | `testimonials`, `tabs`, `products`, `best-sellers` | `TAG_TESTIMONIALS`, `TAG_HOMEPAGE`, `TAG_PRODUCTS`, `TAG_TABS`, `TAG_BEST_SELLERS` |
| `app/(sections)/DynamicSections.tsx` | `getHomeSections()`, `getWebsiteBanners()`, `fetchProducts()`, `fetchProductsBySearch()`, `fetchTestimonials()` | `homepage`, `products`, `search`, `testimonials` | `TAG_HOMEPAGE`, `TAG_PRODUCTS`, `TAG_TESTIMONIALS` |
| `app/(sections)/DefaultBanner.tsx` | `GetBanners()` | `homepage` | `TAG_HOMEPAGE` |
| `app/(sections)/WhyChooseUs.tsx` | `getWhyChooseUs()` | `homepage` | `TAG_HOMEPAGE` |
| `app/(sections)/ProductsTab.tsx` | `getProducts()` | `search` | `TAG_PRODUCTS` |
| `app/(pages)/category/[...slug]/page.tsx` | `getColor()`, `getMaterial()` | `filters` | `TAG_FILTERS` |
| `app/(pages)/product-details/[slug]/page.tsx` | `getProducts()` | `products` | `productTag(slug)`, `TAG_PRODUCTS` |
| `app/(pages)/faq/page.tsx` | `GetFaq()` | `faq` | `TAG_FAQ` |
| `app/(pages)/search/page.tsx` | `getProducts()` | `search` | `TAG_SEARCH` |

**PPR (Partial Prerendering):** Auto-enabled by `cacheComponents: true`. Homepage wraps data-heavy sections in `<Suspense>` boundaries so the static shell renders immediately while dynamic content (sliders, testimonials, tab products) streams in.

## Swiper Usage

**7 components** use swiper for carousels/sliders. All components are `"use client"` and dynamically imported via `next/dynamic()` — swiper JS is code-split and lazy-loaded.

| Component | Modules Used | CSS Imports |
|-----------|-------------|-------------|
| `Slider.tsx` | `Autoplay`, `EffectCoverflow` | `swiper/css`, `swiper/css/effect-coverflow` |
| `Testimonial.tsx` | `Autoplay`, `Navigation` | `swiper/css`, `swiper/css/navigation` |
| `RoundCategorySlider.tsx` | `Autoplay` | `swiper/css` |
| `SquareCategorySlider.tsx` | `Autoplay` | `swiper/css` |
| `GiftItems.tsx` | `Autoplay` | `swiper/css` |
| `RelatedProducts.tsx` | `Autoplay`, `Pagination` | `swiper/css` |
| `image-slider.tsx` | `Navigation` | `swiper/css`, `swiper/css/navigation` |

**Optimization notes:**
- All swiper components are dynamically imported — no render-blocking ✅
- Each component imports only the specific module CSS it needs ✅
- `swiper/css/effect-cards` was removed from Testimonial.tsx (dead import — never used `EffectCards` module) ✅
- No barrel imports from swiper are used ✅

## SEO & Schema

- Dynamic sitemap (build-time via next-sitemap)
- robots.txt (blocks AI scrapers)
- JSON-LD: Product, Organization, Store, BreadcrumbList, FAQPage, ItemList
- Open Graph + Twitter Card metadata on all pages

## Agent Skills

The following `.agents/skills/` are relevant to this project:

| Skill | Why |
|-------|-----|
| `vercel-react-best-practices` | React/Next.js perf optimization — dynamic imports, Suspense, bundle splitting, caching |
| `ui-ux-pro-max` | Design system, color palette, typography, UX patterns for storefront |
| `web-design-guidelines` | Vercel Web Interface Guidelines compliance check |
| `vercel-optimize` | Vercel cost and performance optimization |
| `vercel-react-view-transitions` | View Transition API for smooth page transitions |
| `security-review` | OWASP scanning for JWT, XSS, CSP, OAuth |
| `ponytail` | Minimal-solution mode |
