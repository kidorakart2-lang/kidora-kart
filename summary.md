## Goal
- Rebrand the full monorepo from "Jewellery Walla" to "Toy Shop" by env-ifying brand references, updating defaults, and writing comprehensive READMEs for all packages.

## Constraints & Preferences
- Do NOT change UI content (page copy, metadata, SEO descriptions, heading text in sections/pages).
- Only env-ify, rebrand `.env.example` defaults, and do minimum structural changes needed.
- For accessibility fixes: do NOT add hardcoded colors — use CSS variables or theme tokens.
- Write detailed, accurate READMEs for every package after all code changes are done.

## Progress
### Done
- **Rewrote all 4 READMEs** with full, accurate content:
  - `readme.md` (root): Brand config table, deploy section, Google OAuth section, agent skills table.
  - `api/README.md`: Tech stack (pino logger, Gemini AI), env vars, deploy commands, Google OAuth flow table.
  - `admin-panel/README.md`: Full env vars section, known issues table, agent skills.
  - `web/README.md`: Full env vars section, SEO notes, CSP/image config notes.
- **Added deploy command** to root and api READMEs.
- **Documented Google OAuth redirect URIs** needed in Google Cloud Console.
- **Added `NEXT_PUBLIC_GOOGLE_CLIENT_ID`** to `web/.env.example`.
- **Fixed accessibility: missing button name** in `web/src/components/ui/placeholders-and-vanish-input.tsx` — added `aria-label="Search"` to submit button.
- **Fixed contrast violations**:
  - `web/src/components/comman/Footer.tsx:313`: `text-[var(--brand-primary)]` → `text-[var(--brand-primary-dark)]` (amber-700 `#b45309`, ~4.53:1 — passes AA).
  - `web/src/components/comman/CookieConsent.tsx:49`: `bg-brand-600` → `bg-brand-700` with hover `bg-brand-800` (same token, passes AA).
- **Fixed heading order** (`web/src/components/comman/Footer.tsx:101`): Feature card titles (`<h4>`) changed to `<p>` — no heading-level skip before footer's `<h3>` sections. Footer heading hierarchy is now `h3 → h3 → h3 → h3 → h4`.
- **Fixed duplicate ARIA IDs**:
  - `web/src/components/ui/placeholders-and-vanish-input.tsx`: Added optional `inputId` prop (defaults to `"search"`); `<label htmlFor>` and `<input id>` now use the prop.
  - `web/src/components/comman/Header.tsx`: Added `inputId` to `SearchBarProps` and `SearchBar`; desktop instance omits it (gets `"search"`), mobile instance passes `inputId="mobile-search"`.
- **Rebrand env-ification (from prior sessions)**: Updated `api/env.ts` Zod defaults, `api/.env.example`, all 7 EJS email templates, `admin-panel` config/layout/sidebar/receipt/ProductPage, `web` config/sitemap.
- **Fixed 7 Mongoose duplicate schema index warnings** — removed redundant `schema.index()` calls whose indexes were already created by field-level `unique: true` / `index: true`:
  - `api/src/models/cart.ts`: Removed `cartSchema.index({ user: 1 })`
  - `api/src/models/wishlist.ts`: Removed `wishlistSchema.index({ user: 1 })`
  - `api/src/models/category.ts`: Removed `categorySchema.index({ slug: 1 }, { unique: true })`
  - `api/src/models/subCategory.ts`: Removed `subCategorySchema.index({ slug: 1 }, { unique: true })`
  - `api/src/models/subSubCategory.ts`: Removed `subSubCategorySchema.index({ slug: 1 }, { unique: true })`
  - `api/src/models/order.ts`: Removed `orderSchema.index({ orderId: 1 })` and `orderSchema.index({ "payment.status": 1 })`
- **Investigated Mongoose duplicate schema index warnings**: Full exploration of all 24 model files identified the duplicate declarations.
- **Performance optimizations (web)**:
  - Removed framer-motion from `ProductCard.tsx` — replaced with CSS `:hover` transitions and image crossfade
  - Removed framer-motion from `VideoSection.tsx` — replaced infinite decorative animations with CSS `@keyframes`, content animations with CSS classes
  - Added `priority={i === 0}` and `sizes="100vw"` to BannerSlider first slide
  - Added `optimizePackageImports: ["lucide-react"]` to `next.config.ts`
  - Fixed Swiper pagination bullets composited animation (`will-change: transform`, removed `background-color` transition)
  - Dynamically imported 5 below-fold sections in `page.tsx`: GenderCategorySection, ShopByPrice, TabProducts, WhyChooseUs, ProductsTab
- **Cache TTL extended**: All 7 `buildCacheListController` endpoints (faqData, navigationData, whyChooseUsData, bannerData, colorData, materialData, testimonialData) changed from 300s to 3600s
- **Admin panel dynamic logo**: Added dynamic site logo fetch (from cached API) to login page, ForgotPassword, ResetPassword, and Sidebar — with sessionStorage caching and SVG fallback
- **Critical bug fix: Reset password flow** — Removed `protect` middleware from `/api/website/user/reset-password` route; rewrote `resetPassword` controller to verify `password_reset` JWT instead of requiring authentication. The forgot-password flow now works end-to-end.
- **Email template fixes**: Fixed `process.env.APP_NAME` → `appName` and `process.env.APP_URL` → `appUrl` across all 10 EJS templates. Removed broken `process.env.APP_LOGO_URL` from verify-email.ejs. Fixed hardcoded "Jewellry Wala" in payment-failed.ejs. Added `appUrl` to `nodemailer.ts` render data.
- **Dead code cleanup**: Deleted unused `web/src/app/(sections)/ForgotPassword.tsx` placeholder. Removed unused `email` state variable from both web and admin ResetPassword components.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Env-ify means: add variable to `env.ts` (api) or `.env.example` + read from `process.env` with a new-default fallback. Never remove the fallback so the app works without setting the var.
- Email templates use `<%= appName %>` and `<%= appUrl %>` (passed from `nodemailer.ts`) instead of `process.env.*`
- `web/src/lib/utils.ts` siteConfig remains branded because user said "DO NOT change UI content" – but it is a config file, not UI copy.
- For contrast fixes: use existing darker design tokens (`--brand-primary-dark` / `bg-brand-700`) rather than changing `--brand-primary` globally, to avoid broader visual impact.
- For duplicate ARIA IDs: added optional `inputId` prop to the shared component rather than removing the ID, preserving the `<label htmlFor>` association.
- For heading order: demoted card titles from `<h4>` to `<p>` (semantically not headings) rather than up-leveling them to `h2`/`h3` (which would misrepresent the document structure).
- For Mongoose index dedup: removed the `schema.index()` call (not the field-level declaration) because field-level `unique: true` + `index: true` already creates the index.

## Next Steps
1. Verify Mongoose warnings are gone by running `pnpm --filter api dev` and checking startup logs.
2. Clean up `feature.md` planning doc if needed (still references jewellery store).
3. Run Lighthouse audit to measure impact of performance fixes.

## Critical Context
- Build: `pnpm --filter web run build` fails with a pre-existing prerender error on `/category/[...slug]` (`generateMetadata` depends on Request data) — unrelated to changes. TypeScript and compilation pass.
- Reset-password flow was broken: `/api/website/user/reset-password` endpoint required `protect` middleware so users who forgot their password couldn't complete the flow. Fixed by removing `protect` and verifying the `password_reset` JWT instead.
- 10 email templates had `process.env.*` variables that weren't passed by `nodemailer.ts`. All are now fixed to use `appName` and `appUrl`.
- Google OAuth redirect URI is dynamically built from `FRONTEND_URL` env var.
- The CDN hostname, support email, and app name are env-ified in all three packages.
- Next.js 16 App Router is used for both web and admin-panel — api calls go through Next.js rewrites for httpOnly cookie compatibility.

## Relevant Files
- `web/src/components/comman/ProductCard.tsx`: Removed framer-motion, CSS `:hover` transitions, image crossfade, responsive `sizes` prop.
- `web/src/app/(sections)/VideoSection.tsx`: Removed framer-motion, CSS `@keyframes` for decorative animations, CSS animation classes for content.
- `web/src/app/(sections)/BannerSlider.tsx`: Added `priority={i === 0}`, `sizes="100vw"`, unique alt texts.
- `web/next.config.ts`: Added `optimizePackageImports: ["lucide-react"]`.
- `web/src/index.css`: Added VideoSection CSS keyframes, fixed Swiper bullet composited animation.
- `web/src/app/page.tsx`: 5 sections converted to dynamic imports.
- `api/src/controller/web/logo.controller.ts`: Extended cache TTL to 3600s.
- `api/src/controller/web/faq.controller.ts`, `whyChooseUs.controller.ts`, `nav.controller.ts`, `banner.controller.ts`, `color.controller.ts`, `material.controller.ts`, `testimonial.controller.ts`: All extended to 3600s TTL.
- `api/src/controller/web/user.controller.ts`: Fixed `resetPassword` — removed auth requirement, now verifies `password_reset` JWT.
- `api/src/routes/web/user.route.ts`: Removed `protect` middleware from `reset-password`.
- `api/src/lib/nodemailer.ts`: Added `appUrl: env.APP_URL` to template render data.
- `api/src/views/emails/*.ejs`: All 10 templates fixed — `process.env.APP_NAME` → `appName`, `process.env.APP_URL` → `appUrl`.
- `admin-panel/app/page.tsx`: Dynamic logo with sessionStorage caching.
- `admin-panel/components/ForgotPassword.tsx`: Dynamic logo, full form implementation.
- `admin-panel/components/ResetPassword.tsx`: Dynamic logo, fixed payload for reset-password.
- `admin-panel/components/sidebar.tsx`: Dynamic logo in brand area.
- `web/src/app/(sections)/ResetPassword.tsx`: Fixed payload, removed unused `email` state.
- `admin-panel/components/ResetPassword.tsx`: Fixed payload, removed unused `email` state.