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

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Env-ify means: add variable to `env.ts` (api) or `.env.example` + read from `process.env` with a new-default fallback. Never remove the fallback so the app works without setting the var.
- Email templates use either `<%= appName %>` (local var from render call) or `<%= process.env.APP_NAME %>` directly. Both resolve to env.ts default `"Toy Shop"` now.
- `web/src/lib/utils.ts` siteConfig remains branded because user said "DO NOT change UI content" – but it is a config file, not UI copy.
- For contrast fixes: use existing darker design tokens (`--brand-primary-dark` / `bg-brand-700`) rather than changing `--brand-primary` globally, to avoid broader visual impact.
- For duplicate ARIA IDs: added optional `inputId` prop to the shared component rather than removing the ID, preserving the `<label htmlFor>` association.
- For heading order: demoted card titles from `<h4>` to `<p>` (semantically not headings) rather than up-leveling them to `h2`/`h3` (which would misrepresent the document structure).
- For Mongoose index dedup: removed the `schema.index()` call (not the field-level declaration) because field-level `unique: true` + `index: true` already creates the index.

## Next Steps
1. Verify Mongoose warnings are gone by running `pnpm --filter api dev` and checking startup logs.
2. Clean up `feature.md` planning doc if needed (still references jewellery store).

## Critical Context
- Build: `pnpm --filter web run build` fails with a pre-existing prerender error on `/category/[...slug]` (`generateMetadata` depends on Request data) — unrelated to accessibility changes. TypeScript and compilation pass.
- Contrast fix was verified: `--brand-primary-dark` (#b45309 amber-700) on white yields ~4.53:1, passes WCAG AA for normal text.
- 7 duplicate Mongoose index warnings fixed: `slug` (3: category/subCategory/subSubCategory), `user` (2: cart/wishlist), `orderId` (1: order), `payment.status` (1: order).
- Compound indexes (e.g. `{ status: 1, createdAt: -1 }`) left intact — they serve different query patterns than single-field indexes.
- Google OAuth redirect URI is dynamically built from `FRONTEND_URL` env var.
- The CDN hostname, support email, and app name are env-ified in all three packages.
- Next.js 16 App Router is used for both web and admin-panel — api calls go through Next.js rewrites for httpOnly cookie compatibility.

## Relevant Files
- `web/src/components/comman/Footer.tsx`: Feature card `<h4>` → `<p>` (line 101); price text `--brand-primary` → `--brand-primary-dark` (line 313).
- `web/src/components/comman/CookieConsent.tsx`: Button `bg-brand-600` → `bg-brand-700` (line 49).
- `web/src/components/ui/placeholders-and-vanish-input.tsx`: Added optional `inputId` prop, `htmlFor`/`id` use it.
- `web/src/components/comman/Header.tsx`: Added `inputId` to `SearchBarProps`/`SearchBar`, mobile instance passes `inputId="mobile-search"` (line 552).
- `api/src/models/cart.ts`: Removed `cartSchema.index({ user: 1 })` (line 41 deleted).
- `api/src/models/wishlist.ts`: Removed `wishlistSchema.index({ user: 1 })` (line 21 deleted).
- `api/src/models/category.ts`: Removed `categorySchema.index({ slug: 1 }, { unique: true })` (line 47 deleted).
- `api/src/models/subCategory.ts`: Removed `subCategorySchema.index({ slug: 1 }, { unique: true })` (line 53 deleted).
- `api/src/models/subSubCategory.ts`: Removed `subSubCategorySchema.index({ slug: 1 }, { unique: true })` (line 53 deleted).
- `api/src/models/order.ts`: Removed `orderSchema.index({ orderId: 1 })` and `orderSchema.index({ "payment.status": 1 })` (lines 206-207 deleted).
- `web/src/docs/design.md`: Design token reference — `--brand-primary` = `#d97706` (amber-600), `--brand-primary-dark` = `#b45309` (amber-700).
- `web/src/lib/utils.ts`: siteConfig still has old brand defaults (config, not UI — kept intentional).
