# Web — Storefront

Next.js 16 customer-facing storefront for the Toy Shop e-commerce platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| State | Redux Toolkit + redux-persist (sessionStorage) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Animations | framer-motion / motion |
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
| `/story` | Brand story |
| `/contact` | Contact form |
| `/about` | About us |
| `/reset-password` | Password reset flow |
| `/verify-email` | Email verification |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build (includes sitemap generation) |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm lighthouse` | Run Lighthouse CI baseline (requires `pnpm build && pnpm start` first) |
| `pnpm lint` | Run TypeScript check |

## Quality Tooling

- **Lighthouse CI** (`lighthouserc.js`) — Performance, accessibility, SEO, and best-practice budgets on desktop preset. Reports saved to `lhci_reports/`.
- **axe-core** (`@axe-core/react`) — Development-time accessibility audit. Violations logged to browser console on every interaction. Disabled in production builds.

## Auth Flow

1. Backend sets `userToken` httpOnly cookie on register/login/google-auth
2. Frontend reads token from sessionStorage (redux-persist) for `Authorization` header
3. Server components read from `cookies()` (next/headers)
4. Refresh token rotation: 15min JWT + 7-day revocable refresh token
5. Logout clears httpOnly cookie server-side

## Environment Variables

Copy `web/.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/
REVALIDATE_SECRET=your-random-secret-here
NEXT_PUBLIC_CDN_HOST=cdn.toyshop.com
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL for server component data fetching |
| `REVALIDATE_SECRET` | Shared secret with admin panel — validates `/api/revalidate` requests |
| `NEXT_PUBLIC_CDN_HOST` | CDN hostname used in Content-Security-Policy header and next/image remotePatterns |

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
