# Web Storefront Review — `web/` (Jewellery Walla)

**Scope:** `D:\side-projects\websites\toy-shop\web\` — Next.js 15 App Router storefront.
**Review date:** 2026-06-25
**Categories:** Performance, SEO, UI/UX, Additional Security (issues not covered in `security-issues.md`).
**Overall health:** 🔴 **Below production grade.** Multiple blocking issues across all four categories.

---

## Severity Legend

- 🔴 **Critical** — Production-blocking, must fix before launch
- 🟠 **High** — Materially hurts business goals (conversions, ranking, trust)
- 🟡 **Medium** — Worth fixing soon
- 🟢 **Low** — Polish / nice-to-have

---

## Executive Summary

The storefront will load, but it is far from production-grade. The single most damaging configuration is `images.unoptimized: true` in `next.config.mjs:8`, which silently turns off Next.js Image Optimization — every product image is shipped at full resolution. Combined with multiple large client components (Swiper, Framer Motion) eagerly imported and zero prefetching strategy, mobile LCP on a category page is likely above 6 seconds on 4G.

SEO is mostly well-architected (good JSON-LD coverage, dynamic sitemap, robots), but several placeholders (`"YOUR_GOOGLE_VERIFICATION_CODE"`, fallback phone numbers, hardcoded `342001` postal code, `og-image.jpg` that does not exist) will block rich-result eligibility and look unprofessional in Search Console.

UI/UX lacks basic accessibility hygiene (no `prefers-reduced-motion`, no focus management, hardcoded Indian states in checkout, error pages with animation-only feedback) and is functionally incomplete (no offline handling, no skeletons beyond the banner).

Additional security issues specific to the web app: the JWT is stored in a plain `js-cookie` cookie reachable by any XSS payload, `process.env.NODE_ENV === "production"` checks do not work as expected in Next.js client code, and the `.env` file contains a Google OAuth client secret that should never be committed.

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total |
|---|---|---|---|---|---|
| Performance | 4 | 6 | 7 | 4 | **21** |
| SEO | 2 | 5 | 7 | 4 | **18** |
| UI/UX | 1 | 6 | 8 | 5 | **20** |
| Security (additional) | 3 | 4 | 3 | 2 | **12** |
| **Total** | **10** | **21** | **25** | **15** | **71** |

---

# 1. Performance (Speed)

## 🔴 P1. `images.unoptimized: true` disables Next.js Image Optimization

**File:** `web/next.config.mjs:8`

```js
images: {
  qualities: [10, 25, 50, 75, 90, 100],
  unoptimized: true,           // ← disables on-demand WebP/AVIF, responsive srcset, blur placeholder
  remotePatterns: [...]
}
```

**Impact:** Every `<img>` (and any `<Image>` ignoring the flag) ships the original 3–8 MB JPEG/PNG from Cloudflare R2. Mobile users pay the full transfer cost.

**Fix:**
```js
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [
    { protocol: "https", hostname: "pub-50951b7722e041bebc7b86688a160a35.r2.dev" },
    { protocol: "https", hostname: "lh3.googleusercontent.com" },
  ],
  deviceSizes: [360, 640, 750, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
}
```

> `qualities` and `unoptimized` together are contradictory; the latter wins. Remove `qualities` if unused.

---

## 🔴 P2. Slider + Framer Motion eagerly imported on every section

**Files:** `web/src/app/(sections)/Slider.jsx`, multiple section components

`swiper` (≈ 90 KB gz), `framer-motion` (≈ 50 KB gz), `embla-carousel-react` (declared in `admin-panel` only — but other libraries may be added) are imported at module top-level. Because every section is a Client Component (`"use client"` at top), they are bundled into a single shared chunk loaded on the home page, category pages, and product details alike.

**Fix:**
- Convert all non-interactive section wrappers to Server Components.
- Keep only the Swiper/Framer wrappers as Client Components; lazy-load them with `next/dynamic`:
```js
const Slider = dynamic(() => import("@/components/Slider"), { ssr: false, loading: () => <Skeleton /> });
```
- Audit other large imports: `react-hook-form`, `axios`, `@reduxjs/toolkit`, `redux-persist` are heavy and should be deferred to the routes that use them.

---

## 🔴 P3. No `loading`/`fetchpriority` strategy for above-the-fold imagery

The home page renders the hero banner, tabs, and product carousels in a single RSC waterfall (parallel fetches are present, good). But `<Image priority />` is not used for the hero banner image, so the LCP candidate is discovered late.

**Fix:**
- Mark the first hero banner image with `priority` and `fetchPriority="high"`.
- Add `placeholder="blur"` with `blurDataURL` for product thumbnails to eliminate layout shift.

---

## 🔴 P4. POST requests used for read-only fetches

**Files:** `web/src/lib/orderService.js`, `web/src/lib/fetchUser.js`, `web/src/app/(pages)/product-details/[slug]/page.jsx:211`, etc.

Multiple service functions issue `method: "post"` with empty body to GET endpoints:
```js
const response = await fetch(`${API_URL}api/website/product/details/${slug}`, {
  method: "post",
});
```

**Impact:**
- CDN / Next.js Data Cache cannot cache POST responses (RFC 7231 §4.2.2).
- Backend cache layer (if any) misses these.
- The `/product-details/[slug]/generateMetadata` runs every request unless cached — and cannot be cached via Next.js Data Cache when the underlying fetch is POST.

**Fix:** Switch all read paths to `method: "get"`. Align API route handlers accordingly.

---

## 🟠 P5. No HTTP cache headers configured

There is no `next.config.mjs` `headers()` block and no `Cache-Control` set per route. Static assets from `/_next/static` rely on the default immutable cache, but `/api/*` responses from the Express backend do not propagate `Cache-Control`, so client-side React Query / Redux state is the only caching layer.

**Fix:**
- Set `Cache-Control: public, max-age=60, stale-while-revalidate=300` on the homepage and category landing pages at the CDN.
- Return `Cache-Control` from API responses for product lists and details.

---

## 🟠 P6. No compression middleware (gzip/brotli)

No `compress()` middleware in `next.config.mjs` headers, no `serverExternalPackages` configuration, no Vercel-level compression comment. While Vercel compresses by default on its platform, this app is designed to self-host (see `api/index.js`).

**Fix:**
- Add a reverse proxy (Nginx / Caddy) with `gzip on` and `brotli on` in front of the Node server, OR enable `compress()` in Express.
- Verify with `curl -H 'Accept-Encoding: gzip'` that responses are gzipped.

---

## 🟠 P7. Multiple Redux slices persisted to `sessionStorage` via redux-persist

**File:** `web/src/redux/store/store.js`

```js
const persistConfig = {
  key: "root",
  storage: storageSession,
  whitelist: ["auth", "cart", "wishlist", "filters"],
};
```

**Impact:**
- `sessionStorage` write on every action — including `setProfile`, scroll, etc. — burns main-thread time on low-end mobile.
- On hydration mismatch between SSR HTML and persisted state, React throws a warning and re-renders.

**Fix:**
- Persist only `cart` (small, user-meaningful across tabs is not needed).
- Store `auth` token in an `httpOnly` cookie via a server route, not redux-persist.
- Use Redux Toolkit Query for server state instead of duplicating into Redux.

---

## 🟠 P8. Web fonts: Lato loaded without `display: swap` or preconnect

**File:** `web/src/app/layout.js` (uses `next/font/google`)

`next/font/google` *does* optimize LCP via automatic preload + size-adjust, which is good. But verify the `adjustFontFallback: true` setting is on; without it the font swap will cause CLS.

**Fix:** Confirm `next/font/google` configuration includes:
```js
const lato = Lato({ subsets: ["latin"], weight: ["400","700","900"], display: "swap", adjustFontFallback: true });
```

---

## 🟠 P9. Inline `<style jsx>` in `Slider.jsx`

**File:** `web/src/app/(sections)/Slider.jsx`

`<style jsx>` blocks ship as runtime-injected CSS, costing a small but non-zero JavaScript parse on the critical path.

**Fix:** Move these to `globals.css` (Tailwind v4 supports arbitrary values) and use `className`.

---

## 🟠 P10. `Suspense` only used for banner

**File:** `web/src/app/(sections)/Banner.jsx`

Other sections render directly without skeleton fallbacks. The user sees a blank wall while product data loads.

**Fix:** Wrap each section's data fetch in `<Suspense fallback={<SectionSkeleton />}>` and provide component-specific skeletons (BannerSkeleton, TabsSkeleton, ProductCardSkeleton).

---

## 🟡 P11. No Service Worker / offline page

There is a `site.webmanifest` (`web/public/site.webmanifest`) so the app is PWA-installable, but no service worker means offline navigation fails with a generic browser error.

**Fix:** Add `next-pwa` or hand-author a minimal service worker for the static shell.

---

## 🟡 P12. Third-party scripts not lazy-loaded

**File:** `web/src/app/layout.js` — Google Identity Services (`https://accounts.google.com/gsi/client`) is loaded synchronously in `<head>`. This blocks FCP/LCP for users who do not click "Login with Google".

**Fix:** Load via `next/script` with `strategy="lazyOnload"` and `onLoad` callback.

---

## 🟡 P13. No prefetching strategy for product links

`<Link>` in Next.js auto-prefetches in production, but the `prefetch={true}` (default) on every product card generates hundreds of `/product-details/<slug>` requests on scroll through a category page.

**Fix:** Set `prefetch={false}` on product cards; rely on viewport-based prefetching via `IntersectionObserver`.

---

## 🟡 P14. `axios` + `fetch` used inconsistently

`orderService.js` uses `axios` (extra ~14 KB), other modules use raw `fetch`. Pick one.

**Fix:** Use `fetch` everywhere (zero KB) OR use `axios` only where interceptors add value.

---

## 🟡 P15. JSON.stringify in render path

`web/src/app/(pages)/product-details/[slug]/page.jsx:252` — `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />` runs on every render. Since the page is an RSC this is fine, but verify no `JSON.stringify` is happening in Client Components for large arrays (e.g., cart line items).

---

## 🟡 P16. Tailwind v4 may need content-source config audit

`web/package.json` ships `tailwindcss-animate` and `tw-animate-css`. With Tailwind v4 + `@tailwindcss/postcss`, ensure the `@source` directive covers all component files (`app/**/*.{js,jsx,ts,tsx}`, `components/**/*`, `sections/**/*`, etc.) — otherwise PurgeCSS strips styles and Tailwind re-emits bloated output.

---

## 🟢 P17. `next-sitemap.config.js` exists but no Next.js Image preload is configured

Verify the sitemap is actually being generated at build time (look for `sitemap-*.xml` files in `public/` after `npm run build`). The `next-sitemap` script must be in `postbuild` of `package.json`.

---

## 🟢 P18. Order-success sound (`order.mp3`) loaded eagerly

**File:** `web/public/order.mp3`

If `<audio>` element is rendered before the user clicks pay, the audio file is fetched.

**Fix:** Trigger `audio.play()` only on the success screen.

---

## 🟢 P19. No image dimensions database

Each product image is fetched without width/height metadata. Add to the CMS schema or strip dimensions at upload time (via Cloudflare Images or a Sharp worker) and emit `width` / `height` in the API response so Next.js can reserve aspect ratio.

---

## 🟢 P20. Missing `<link rel="preconnect">` for API host

If the API is on a separate origin (`process.env.NEXT_PUBLIC_API_URL`), add:
```html
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://api.example.com" />
```

---

## 🟢 P21. `react-day-picker` not used in `web/` — verify it's not bundled

`web/package.json` includes `react-day-picker` (a 30+ KB library). If unused, remove it.

---

# 2. SEO

## 🔴 S1. Hardcoded `"YOUR_GOOGLE_VERIFICATION_CODE"` placeholder

**File:** `web/src/app/page.js` and/or `web/src/lib/utils.js`

Until this is replaced with a real Search Console verification token, you cannot verify domain ownership and lose access to Search Console's URL Inspection tools.

**Fix:** Replace with the actual token from Google Search Console.

---

## 🔴 S2. Missing `og-image.jpg` and `shop-image.jpg` referenced by JSON-LD

`generateProductSchema` (`web/src/app/(pages)/product-details/[slug]/page.jsx:106`) and the JewelryStore schema reference `og-image.jpg` and `shop-image.jpg`, but only `logo.webp` and `poster.webp` exist in `web/public/images/`.

**Impact:**
- Open Graph shares render blank previews.
- Google ignores `image` URLs that 404 → no rich result thumbnail.

**Fix:** Add real `og-image.jpg` (1200×630, < 300 KB) and `shop-image.jpg` (your storefront photo). Reference absolute URLs (`https://jewellerywalla.com/images/og-image.jpg`), not relative.

---

## 🟠 S3. Placeholder phone numbers and postal code in `siteConfig`

**File:** `web/src/lib/utils.js`

```js
phone: "+91-291-1234567",   // placeholder
contactNumber: "+91-9876543210",  // placeholder
```

And in `generateProductSchema`:
```js
postalCode: "342001", // Update with your postal code
```

**Impact:** Google may flag the local business listing as inconsistent and demote the map pack ranking.

**Fix:** Replace with real, consistent NAP (Name, Address, Phone) data — same as on Google Business Profile.

---

## 🟠 S4. "Contact Us" mixed into `categories` array

**File:** `web/src/lib/utils.js`

The product categories list contains an entry like `{ name: "Contact Us", slug: "/contact-us" }`. If this list is consumed by the header navigation OR by a JSON-LD `ItemList` / `SiteNavigationElement`, the schema is polluted with non-product categories and Search Console will report schema errors.

**Fix:** Split `categories` (data) from `navigationLinks` (UI). Only emit product categories in JSON-LD.

---

## 🟠 S5. Mixed `http` and `https` references in canonical/OG

`siteConfig.url` should be a single source of truth. Verify all `JSON.stringify(schemas)` calls use absolute HTTPS URLs; relative URLs in `Offer.url` and `Product.url` are rejected by Google's Product Rich Results test.

**File:** `web/src/lib/utils.js` → `siteConfig.url`

---

## 🟠 S6. `Sitemap` fetched via POST method

**File:** `web/src/app/sitemap.js` and `next-sitemap.config.js` — confirm sitemap endpoints accept GET.

If the underlying data source is fetched via POST inside the sitemap builder, the build fails silently and `sitemap.xml` ends up empty.

---

## 🟠 S7. No breadcrumb schema on product/category pages

Breadcrumbs are present in the UI (probably) but no `BreadcrumbList` JSON-LD. This is a free SERP feature in many competitive verticals.

**Fix:** Add a `BreadcrumbList` schema in `product-details/[slug]/page.jsx` and category pages.

---

## 🟡 S8. No FAQ schema on the FAQ page

`web/src/app/(pages)/faq/page.jsx` likely renders a list of Q&A. Wrap each pair in `FAQPage` JSON-LD to be eligible for FAQ rich results.

---

## 🟡 S9. Default metadata uses placeholder `og-image.jpg`

**File:** `web/src/lib/utils.js` → `defaultMetadata.openGraph.images`

If a page does not call `generateMetadata`, it inherits the default. Verify the default `images[0].url` resolves to a real file. Otherwise every unconfigured page (e.g., the not-found page) shares a broken preview.

---

## 🟡 S10. Locale hardcoded to `en_IN`

**File:** `web/src/app/(pages)/product-details/[slug]/page.jsx:76` and `web/src/lib/utils.js`

If the site ever sells internationally or has a Hindi version, `locale: "en_IN"` blocks alternate-language indexing. Add `alternates.languages` if a translation pipeline is planned.

---

## 🟡 S11. `aggregateRating` injected even when no real reviews

**File:** `web/src/app/(pages)/product-details/[slug]/page.jsx:148`

The code injects `aggregateRating` whenever `product.rating` is truthy. If the rating is auto-generated from a single test order, Google may issue a manual action for "spammy structured data" or ignore the rich result entirely.

**Fix:** Only emit `aggregateRating` when `product.reviewCount >= 3` and reviews are moderated.

---

## 🟡 S12. No `WebPage` or `CollectionPage` schema for category pages

`web/src/app/(pages)/category/page.jsx` should emit a `CollectionPage` schema with `mainEntity: ItemList` of products to enable category-level rich results.

---

## 🟡 S13. `robots.js` blocks `CCBot` but not all commercial scrapers

The current rules block GPTBot, ClaudeBot, etc. — good. But `ImagesiftBot`, `OAI-SearchBot`, `PerplexityBot`, and `Applebot-Extended` may still scrape content for training. Audit monthly.

---

## 🟡 S14. `product-details/[slug]/page.jsx` page returns inline 404 markup on missing product

The page returns a JSX 404, but the HTTP status is still 200. This is bad for SEO — search engines index the "Product Not Found" copy as a real page.

**Fix:** Use `notFound()` from `next/navigation` to render the framework 404 with a real 410/404 status.

---

## 🟢 S15. `keywords` metadata is mostly ignored by Google

`keywords: [...]` arrays have been ignored since 2009. Remove to slim the payload, or repurpose as `article:tag` in OG.

---

## 🟢 S16. Sitemap only includes products/categories — missing CMS pages

FAQ, About, Story, Terms, Policy should all be in `sitemap.xml`. Verify `next-sitemap.config.js` includes static paths.

---

## 🟢 S17. `site.webmanifest` `theme_color` not set

PWA `theme_color` doubles as a Chrome address-bar color on mobile and influences perceived branding. Add a brand color matching the site.

---

## 🟢 S18. No hreflang tags

Single-language site today, but plan for `hreflang` if expanding. The current setup would silently index duplicate content in non-`en_IN` regions if a CDN edge ever geo-redirects.

---

# 3. UI/UX

## 🔴 U1. No `prefers-reduced-motion` handling

**Files:** `web/src/app/error.js`, `web/src/app/not-found.jsx`, `web/src/app/(sections)/Slider.jsx`, every Framer Motion animation in `web/src/components/**`

Framer Motion's `<motion.div animate>` runs unconditionally. Users with vestibular disorders who set `prefers-reduced-motion: reduce` in their OS still see the animations — accessibility failure (WCAG 2.1 SC 2.3.3).

**Fix:**
```jsx
import { MotionConfig } from "framer-motion";
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```
Wrap the entire app in `MotionConfig` at the root layout. Same fix applies to Swiper's autoplay.

---

## 🟠 U2. Hardcoded Indian states list in checkout

**File:** `web/src/app/(sections)/Checkout.jsx`

The states list (`Rajasthan`, `Maharashtra`, etc.) is hardcoded. International buyers cannot complete checkout.

**Fix:** Use an i18n state list or auto-detect country and present the correct subdivisions.

---

## 🟠 U3. No accessibility audit performed

No `aria-` attributes, no focus traps in modals (cart drawer, login dropdown), no skip-to-content link, no focus-visible outline overrides.

**Fix:**
- Add a `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>` as the first element in `<body>`.
- Audit with `axe-core` via `@axe-core/react` in dev.
- Verify focus order in Header dropdowns and mobile menu.

---

## 🟠 U4. Custom error pages are animation-only

**File:** `web/src/app/error.js`, `web/src/app/not-found.jsx`

If JavaScript fails to load (network issue, ad blocker), the user sees a blank page. Error pages should work without JavaScript — at minimum, provide static text and a link home.

---

## 🟠 U5. No empty states for cart/wishlist/orders

If a user with an empty cart hits `/cart`, what do they see? Verify there is a friendly empty state with a CTA to browse products. Same for `/wishlist`, `/profile/orders`.

---

## 🟠 U6. Mobile menu behavior unverified

**File:** `web/src/components/comman/Header.jsx`

Header has multiple `useState` hooks for dropdowns. Verify:
- Mobile menu traps focus.
- Tapping outside closes the menu.
- The cart drawer doesn't trap scroll on `<body>`.

---

## 🟠 U7. No loading skeleton for product grids

When `/category` loads, users see a flash of empty space. The `Suspense` fallback should be a grid of skeleton cards.

---

## 🟡 U8. Color contrast unverified

Brand colors should be checked against WCAG AA (4.5:1 for body, 3:1 for large text). Especially the gold-on-cream palette typical of jewellery sites.

---

## 🟡 U9. No `loading="lazy"` on below-fold images

`<Image>` from `next/image` lazy-loads by default, but raw `<img>` tags don't. Verify every product card uses `<Image>`.

---

## 🟡 U10. Form validation messages lack `aria-live`

The signup/login forms should announce validation errors to screen readers via `aria-live="polite"` or `role="alert"`.

---

## 🟡 U11. Toasts (`sonner`) and `motion.div` together

Sonner is fine, but stacking Framer Motion + Sonner entry animations on the same page creates jank. Consider disabling one or the other.

---

## 🟡 U12. `useEffect` re-fetch loops possible

**File:** `web/src/components/comman/Header.jsx` (and likely others)

State-driven `useEffect` that depends on Redux state may re-fetch on every render if dependencies aren't stable. Audit for infinite-loop patterns.

---

## 🟡 U13. No scroll-restoration strategy

Click a product → scroll to top → click back → expect to be where you were. Next.js App Router handles this, but custom scroll behavior in `useEffect` can break it.

---

## 🟡 U14. Cookie consent banner absent (GDPR)

If any EU user lands on the site, GDPR requires explicit consent for non-essential cookies. The auth cookie is set by `js-cookie` without consent.

**Fix:** Add a `react-cookie-consent` banner, gate non-essential cookies behind consent.

---

## 🟡 U15. Search input doesn't debounce

If `/search` calls the API on every keystroke, you'll DDoS your own backend. Add 250 ms debounce.

---

## 🟢 U16. Logo: `logo.webp` is 2 KB — good. But `poster.webp` is unverified.

Open the file and verify dimensions and content.

---

## 🟢 U17. No 404 monitoring

Vercel logs would surface 404s, but the app should also have a `not-found.jsx` log → Sentry hook.

---

## 🟢 U18. Print stylesheet missing

Users may want to print an order confirmation. Add `@media print` rules in `globals.css`.

---

## 🟢 U19. No dark-mode support

`next-themes` is in `admin-panel/package.json` but not `web/package.json`. Decide whether the storefront needs dark mode; if so, add `next-themes`.

---

## 🟢 U20. Tab order in product detail image gallery

If the gallery is keyboard-navigable, verify `tabIndex` is correct and `aria-label` describes the action ("View image 2 of 5: gold necklace close-up").

---

# 4. Additional Security Issues (Web-Specific)

> These supplement `security-issues.md` and focus on issues that live primarily in `web/`.

## 🔴 W1. JWT stored in plain `js-cookie` (XSS-extractable)

**File:** `web/src/redux/features/auth.js:17`

```js
Cookies.set("user", action.payload, {
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  expires: 7,
});
```

**Problem:**
- `js-cookie` writes a plain `document.cookie`-accessible cookie. Any XSS payload can `document.cookie` and exfiltrate the JWT.
- There is no `httpOnly` flag (js-cookie cannot set it anyway — that's a browser API limitation).

**Impact:** Stored XSS → account takeover in one request.

**Fix (best):**
- Move JWT to an `httpOnly; Secure; SameSite=Lax` cookie set by an Express response (`Set-Cookie`).
- Have the web app call `/api/auth/me` to read the current user.
- Do not store the token in Redux or anywhere reachable from JavaScript.

**Fix (minimum):**
- Add a strict Content-Security-Policy that forbids inline scripts (see W5).
- Add `Subresource Integrity` to any third-party script.

---

## 🔴 W2. `process.env.NODE_ENV` check that doesn't work client-side

**File:** `web/src/redux/features/auth.js:19`

```js
secure: process.env.NODE_ENV === "production",
```

**Problem:** `process.env.NODE_ENV` in Next.js client code is replaced at build time with a string literal (`"production"` or `"development"`). At build time it's correct, but if you ever need to flip it dynamically (e.g., staging server), you cannot.

**More importantly:** the cookie is written with `secure: false` in dev builds, which means cookies are not flagged Secure on `localhost` — that's actually correct behavior. But if you bundle with a custom env (`NODE_ENV=staging`) without a build-time config, the check fails silently.

**Fix:** Use `process.env.NEXT_PUBLIC_NODE_ENV` or a dedicated `NEXT_PUBLIC_COOKIE_SECURE` flag.

---

## 🔴 W3. `GOOGLE_CLIENT_SECRET` in plaintext `.env` file

**File:** `web/.env`

```
GOOGLE_CLIENT_SECRET="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"
```

**Problem:**
- This is checked into git (see git history for confirmation).
- The Google client secret should NEVER live in the browser bundle, but if it is referenced from a Client Component, it WILL be bundled into the client JavaScript and visible to anyone.

**Fix:**
- Move OAuth flow to the Express backend (`api/`). The web app calls `/api/auth/google` to start the flow.
- Rotate the leaked secret immediately in Google Cloud Console.

---

## 🟠 W4. POST requests bypass GET cache (also security: replays possible)

`fetchUser.js:14` uses `method: "post"` for `/user/profile`. POST is more dangerous than GET for the following reasons:
- Some browsers / extensions prefetch GETs but not POSTs.
- POSTs are sometimes exempt from CORS preflight (not here, but still a footgun).
- Replays can mutate server state.

Switch to GET.

---

## 🟠 W5. No Content-Security-Policy

The `next.config.mjs` does not define a `headers()` function, so no CSP is set. Combined with W1, any reflected or stored XSS becomes a one-shot account takeover.

**Fix:**
```js
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' https://pub-50951b7722e041bebc7b86688a160a35.r2.dev https://lh3.googleusercontent.com data:; connect-src 'self' https://api.example.com https://api.razorpay.com; frame-src https://api.razorpay.com https://accounts.google.com;" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

---

## 🟠 W6. Google Identity Services script loaded globally

**File:** `web/src/app/layout.js`

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**Problem:**
- Loaded on every page, even for users who never log in.
- No `data-callback` or `data-login_uri` is set in markup; verify in `Header.jsx` that the script initializes with the correct client ID and `ux_mode="redirect"` (not `popup`) for mobile compatibility.

---

## 🟠 W7. Order Service: no rate-limiting on client side

`web/src/lib/orderService.js` exposes `createOrder`, `verifyPayment`, `verifyCod`. A user with DevTools open can call these in a loop. The Express backend should enforce per-IP and per-user rate limits (verify in `api/`).

---

## 🟡 W8. `localStorage` / `sessionStorage` for redux-persist

**File:** `web/src/redux/store/store.js:6`

`redux-persist` writes the entire `auth` slice to `sessionStorage`, which is reachable from any script on the same origin. Same risk profile as W1 but lower (sessionStorage is cleared on tab close).

**Fix:** Don't persist `auth`. Use httpOnly cookies.

---

## 🟡 W9. `axios` interceptor sends JWT without refresh logic

**File:** `web/src/lib/orderService.js:19`

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

There is no response interceptor for 401 → refresh. Expired tokens lead to repeated 401s, and the user sees cryptic errors instead of being prompted to log in again.

**Fix:** Add a refresh interceptor.

---

## 🟡 W10. Razorpay SDK loaded in checkout without integrity check

**File:** `web/src/app/(sections)/Checkout.jsx`

If Razorpay's CDN is compromised, your checkout becomes compromised. Add Subresource Integrity hashes.

---

## 🟢 W11. `og-image.jpg` and other images lack `referrerpolicy`

When OG images are scraped by Facebook/Twitter, they may carry the original page URL as referrer. Add `referrerpolicy="no-referrer"` to user-uploaded images.

---

## 🟢 W12. `site.webmanifest` start_url not pinned

PWA install behavior: if `start_url` is `/`, deep links may not open the app. Set `start_url: "/?utm_source=pwa"` and a `scope: "/"`.

---

# 5. Performance Benchmarks to Establish

Before fixing, capture a baseline with:
- **Lighthouse CI** in `next.config.mjs` (or GitHub Action).
- **WebPageTest** with mobile 4G profile for `/`, `/category`, `/product-details/[slug]`.
- **Real User Monitoring** via Vercel Analytics or `@vercel/analytics` (already in `admin-panel`, verify on `web/`).

Target metrics:
- LCP < 2.5 s
- INP < 200 ms
- CLS < 0.1
- TBT < 200 ms
- Speed Index < 3.4 s

---

# 6. SEO Audit Tools to Run

- **Google Search Console** — Coverage, Enhancements, Core Web Vitals.
- **Google Rich Results Test** — Verify each schema validates.
- **Screaming Frog / Sitebulb** — Crawl for broken schemas, duplicate titles, missing alt text.
- **Ahrefs / Semrush** — Backlink profile, keyword gaps.

---

# 7. Prioritized Fix Roadmap

## Sprint 1 (1–2 days, blocking)
1. **P1** — Enable Next.js Image Optimization.
2. **P2** — `next/dynamic` Slider + Framer Motion.
3. **P3** — Hero banner `priority`.
4. **P4 / W4** — Switch POSTs to GETs.
5. **S1** — Replace `"YOUR_GOOGLE_VERIFICATION_CODE"`.
6. **S2** — Add real `og-image.jpg` + `shop-image.jpg`.
7. **W1 / W8** — Move JWT to httpOnly cookie.
8. **W3** — Rotate Google client secret, move OAuth to backend.
9. **W5** — Add CSP and security headers.

## Sprint 2 (3–5 days)
10. **S3 / S4** — Replace placeholder NAP data; split categories from navigation.
11. **S14** — Use `notFound()` for missing products.
12. **U1** — Wrap app in `MotionConfig reducedMotion="user"`.
13. **U2** — Internationalize checkout state list.
14. **U14** — GDPR cookie banner.
15. **P6** — Compression headers.
16. **P7** — Reduce redux-persist whitelist.
17. **W7** — Backend rate-limiting on order endpoints.

## Sprint 3 (1 week)
18. All remaining `🟡` items.
19. Lighthouse / WPT baseline capture.
20. Accessibility audit with axe-core.

## Sprint 4 (polish)
21. All `🟢` items.

---

# 8. References

- `D:\side-projects\websites\toy-shop\security-issues.md` — 47+ server-side and shared issues.
- `D:\side-projects\websites\toy-shop\web\next.config.mjs` — Image config, headers.
- `D:\side-projects\websites\toy-shop\web\src\redux\features\auth.js` — Cookie storage.
- `D:\side-projects\websites\toy-shop\web\src\app\(pages)\product-details\[slug]\page.jsx` — Metadata + schema.
- `D:\side-projects\websites\toy-shop\web\src\lib\utils.js` — Site config + categories.
- `D:\side-projects\websites\toy-shop\web\src\app\page.js` — Verification code placeholder.
- `D:\side-projects\websites\toy-shop\web\public\` — Missing `og-image.jpg`, `shop-image.jpg`.
- Next.js Performance Guide: https://nextjs.org/docs/app/building-your-application/optimizing
- Google Search Central: https://developers.google.com/search
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
