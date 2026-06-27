# TypeScript Migration TODO

## Phase 0 — Setup & Decisions

- [ ] T0.1 Confirm package manager strategy (pnpm vs npm)
- [ ] T0.2 Confirm shared packages/shared-types decision
- [ ] T0.3 Confirm validation library (zod recommended)
- [ ] T0.4 Confirm ESLint preset
- [ ] T0.5 Confirm Mongoose typing strategy
- [ ] T0.6 Snapshot baseline pre-migration
- [x] T0.7 Root `tsconfig.base.json` exists
- [ ] T0.8 Create branches: `feat/ts-api`, `feat/ts-admin-panel`, `feat/ts-web`
- [x] T0.9 Create `MIGRATION_NOTES.md`

## Phase 1 — api/ (Backend)

### Completed
- [x] All models (18) → `InferSchemaType` + `.ts`
- [x] All controllers (33) → `.ts`
- [x] All middleware (3) → `.ts`
- [x] All lib modules (6) → `.ts`
- [x] All routes (33) → `.ts`
- [x] Types & config → `.ts`
- [x] Zod env validation
- [x] `tsconfig.json` + `tsconfig.build.json` exist
- [x] Relaxed strict flags for pragmatic migration

### Remaining (api/)
- [x] Fix **75 TypeScript errors** — null safety, model type alignment, ObjectId access
- [x] Migrate `index.js` → `src/server.ts`
- [x] Verify `tsc --noEmit` exit 0
- [ ] Fix **3 remaining build errors** in `bannerUrl.ts` (`BannerLink` missing `label`, `paths[link.type]` undefined)
- [ ] Smoke test with dev server

## Phase 2 — admin-panel (Admin Dashboard)

### Completed
- [x] `tsconfig.json` updated (strict, `allowJs: false`)
- [x] `next.config.mjs` suppression removed: `ignoreBuildErrors`, `ignoreDuringBuilds`

### Remaining (admin-panel/)
- [ ] `lib/` modules: `utils.js`, `api.js`, `animations.js`, `export-utils.js`, `mock-data.js` → `.ts`
- [ ] Components (25+) → `.tsx`
- [ ] App pages (40+) → `.tsx`
- [ ] Middleware → `.ts`
- [ ] `next.config.mjs` → `next.config.ts`
- [ ] Add `typecheck` script to `package.json`

## Phase 3 — web/ (Storefront)

### Completed
- [x] `tsconfig.json` created (extends base, strict: true)
- [x] All files renamed `.js`/`.jsx` → `.ts`/`.tsx`
- [x] `next-env.d.ts` created
- [x] `components.json` set `tsx: true`
- [x] Starter types added to `icons/index.tsx`, `lib/utils.ts`, `redux/store/store.ts`

### Remaining (web/)
- [ ] Add type annotations to all components, pages, redux slices, hooks — **909 errors**
- [ ] `next.config.mjs` → `next.config.ts`
- [ ] `next-sitemap.config.js` → `.ts`

## Build Status (2026-06-27)

| Project | Build | Notes |
|---------|-------|-------|
| `admin-panel/` | ✅ Passes | `next build` succeeds |
| `web/` | ✅ Passes | `next build` + sitemap generation succeeds |
| `api/` | ❌ 3 errors | `bannerUrl.ts`: `BannerLink` missing `label` property; `paths[link.type]` returns `string \| undefined` |

## Verification (all projects)
- [ ] `api/` — `tsc --noEmit` exits 0
- [x] `web/` — Build passes (June 27)
- [x] `admin-panel/` — Build passes (June 27)
- [ ] Smoke tests for primary user flows
