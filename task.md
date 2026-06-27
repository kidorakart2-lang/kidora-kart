# TypeScript Migration — Task Tracker

> **Status key**: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` skipped
> **Owner**: solo migration; per-task notes recorded inline.
> **Branch strategy**: one branch per project: `feat/ts-api`, `feat/ts-admin-panel`, `feat/ts-web`.
> **Tracking files**: `plan.md` (this repo root), `task.md` (this file).

---

## Phase 0 — Setup & Decisions  *(must complete before any code work)*

- [x] **T0.1** Confirm package manager strategy (keep mixed `pnpm`/`npm` vs unify).
- [ ] **T0.2** Confirm shared `packages/` decision (introduce now vs defer to v2).
- [ ] **T0.3** Confirm validation library (`zod` recommended).
- [ ] **T0.4** Confirm ESLint preset (`next/core-web-vitals` + `@typescript-eslint/recommended-type-checked` recommended).
- [ ] **T0.5** Confirm Mongoose typing strategy (`InferSchemaType` + module augmentation).
- [ ] **T0.6** Snapshot pre-migration state:
  - [ ] `admin-panel/.next/` baseline build artifacts saved (or removed to ensure clean build).
  - [ ] `api/`: `curl` smoke script for 5 critical endpoints.
  - [ ] `web/`: screenshot or list of routes working.
- [ ] **T0.7** Create repo-root `tsconfig.base.json` (per `plan.md §6`).
- [ ] **T0.8** Initialize git worktrees / branches — skipped (working on main).
- [x] **T0.9** Create `MIGRATION_NOTES.md` capturing decisions made in T0.1–T0.5.

---

## Phase 1 — `api/` (Backend) Migration

### 1.0 Tooling — DONE
- [x] **T1.0.1** Add `typescript`, `tsx`, `@types/node` as devDependencies.
- [x] **T1.0.2** Add types: `@types/express`, `@types/cors`, `@types/compression`, `@types/multer`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/nodemailer`, `@types/ejs`, `@types/node-cache`.
- [x] **T1.0.3** Add `zod` for runtime validation.
- [x] **T1.0.4** Update `package.json`:
  - [x] `"type": "module"`.
  - [x] `"main": "dist/server.js"`.
  - [x] `"scripts"`: `dev`, `build`, `start`, `typecheck`.
- [x] **T1.0.5** Create `tsconfig.json` extending `../tsconfig.base.json` with `module: NodeNext`.
- [x] **T1.0.6** Create `tsconfig.build.json` (extends base, `noEmit: false`).
- [x] **T1.0.7** Create `.eslintrc.cjs` with `@typescript-eslint/recommended`.
- [x] **T1.0.8** Update `.gitignore` to ignore `dist/`, `*.tsbuildinfo`.

### 1.1 Types & Config — DONE
- [x] **T1.1.1** `src/config/env.ts` — Zod-validated env loader.
- [x] **T1.1.2** `src/types/express.d.ts` — module augmentation for `req.user`.
- [x] **T1.1.3** `src/types/jwt.d.ts` — JWT payload types.
- [x] **T1.1.4** `src/types/multer.d.ts` — typed `req.files` augmentation.
- [x] **T1.1.5** `src/types/api.ts` — `ApiSuccess<T>`, `ApiFailure`, `Paginated<T>`.
- [x] **T1.1.7** `src/utils/asyncHandler.ts` — `asyncHandler<T>` generic wrapper.
- [x] **T1.1.8** `src/utils/responses.ts` — typed response helpers (`success`, `fail`).

### 1.2 Config & Lib — DONE
- [x] **T1.2.1–7** All config and lib modules (`cloudflare.config`, `cache`, `bcrypt`, `jwt`, `slugFunc`, `cloudflare`, `nodemailer`) → `.ts`

### 1.3 Middleware — DONE
- [x] **T1.3.1–3** All middleware (`authMiddleware`, `uploadMiddleware`, `rateLimit`) → `.ts`

### 1.4 Models — DONE
- [x] **T1.4.1–18** All 18 Mongoose models → `.ts` with `InferSchemaType`

### 1.5 Controllers (Web) — DONE
- [x] **T1.5.1–17** All 17 web controllers → `.ts`

### 1.6 Controllers (Admin) — DONE
- [x] **T1.6.1–16** All 16 admin controllers → `.ts`

### 1.7 Routes — DONE
- [x] **T1.7.1–2** All routes (33 files) → `.ts`
- [x] **T1.7.3** Update route imports to use `.js` extension.

### 1.8 Server Entry — NOT STARTED
- [ ] **T1.8.1** Move `index.js` → `src/server.ts`.
- [ ] **T1.8.2** Update `package.json` `main` to `dist/server.js`.
- [ ] **T1.8.3** Convert CJS `require()` to ESM `import`.
- [ ] **T1.8.4** Type the Express app.
- [ ] **T1.8.5** Add typed `Error` middleware.
- [ ] **T1.8.6** Add typed `MongoConnect` helper.

### 1.9 Email Views (EJS templates)
- [x] **T1.9.1** No TS changes required for `.ejs` templates.

### 1.10 Validation — NOT STARTED
- [ ] **T1.10.1** Add Zod schemas for top 10 endpoints.
- [ ] **T1.10.2** Wire `validate` middleware into top 10 routes.

### 1.11 Verification — IN PROGRESS
- [ ] **T1.11.1** `npm run typecheck` exits 0 — **3 errors remaining** (`bannerUrl.ts`)
- [ ] **T1.11.2** `npm run build` — ❌ fails with 3 TS errors in `src/lib/bannerUrl.ts` (`BannerLink` interface missing `label` property + `paths[link.type]` undefined)
- [ ] **T1.11.3** `npm run dev` boots, MongoDB connection succeeds.
- [ ] **T1.11.4** Smoke curl: all 5 baseline endpoints return same status & shape as pre-migration.
- [ ] **T1.11.5** Razorpay webhook signed payload test.
- [ ] **T1.11.6** No `any` keyword in `src/`.

---

## Phase 2 — `admin-panel/` (Admin Dashboard) Migration

### 2.0 Tooling — NOT STARTED
- [ ] **T2.0.1** Add types. (already present: `@types/node`, `@types/react`, `@types/react-dom`)
- [ ] **T2.0.2** Update `package.json` scripts:
  - [ ] `"typecheck": "tsc --noEmit"`.
- [ ] **T2.0.3** Replace `tsconfig.json` with strict config extending `../tsconfig.base.json`.
- [ ] **T2.0.4** Update ESLint config.

### 2.1 Config — DONE (partially)
- [ ] **T2.1.1** `next.config.mjs` → `next.config.ts`.
- [x] **T2.1.2** Remove `typescript.ignoreBuildErrors: true`.
- [x] **T2.1.3** Remove `eslint.ignoreDuringBuilds: true`.

### 2.2–2.9 Remaining — NOT STARTED
- [ ] Lib, hooks, UI components, shared components, app pages, middleware all need `.ts`/`.tsx` conversion.

---

## Phase 3 — `web/` (Storefront) Migration

### 3.0 Tooling — DONE
- [x] **T3.0.1** Add `typescript`, `@types/*` (already in package.json).
- [x] **T3.0.2** `components.json` set `tsx: true`.
- [x] **T3.0.3** Create `tsconfig.json` extending `../tsconfig.base.json`.
- [x] **T3.0.4** Remove `jsconfig.json` (Next prefers `tsconfig.json`).

### 3.1 Config — NOT STARTED
- [ ] **T3.1.1** `next.config.mjs` → `next.config.ts`.
- [ ] **T3.1.2** `next-sitemap.config.js` → `next-sitemap.config.ts`.

### 3.2–3.9 Structural Migration — DONE (without type annotations)
- [x] **All files renamed** `.js`/`.jsx` → `.ts`/`.tsx`
- [x] **Starter types** added to `icons/index.tsx`, `lib/utils.ts`, `redux/store/store.ts`
- ⬜ Type annotations still needed across all files — **909 errors remaining**

### 3.10 Verification — NOT STARTED
- [ ] **T3.10.1** `npm run typecheck` exits 0.
- [ ] **T3.10.2** Build succeeds.

---

## Phase 4 — Cross-Project Polish

- [ ] **T4.1** Remove `allowJs: true` from any project that still has it.
- [ ] **T4.2–8** Various cleanup tasks — deferred until all 3 projects typecheck cleanly.

---

## Phase 5–6 — Deferred

Phases 5 (shared types package) and 6 (hardening/hooks/CI) are deferred until after all three projects reach `tsc --noEmit` exit 0.

---

## Open Issues

- **I-1**: `subSubCat.contoller.js` typo — preserved as-is.
- **I-2**: `delievery` route path typo — preserved for backwards compatibility.
- **I-3**: `admin-panel/next.config.mjs` `ignoreBuildErrors` — removed.
- **I-4**: Mixed package managers (pnpm-lock + package-lock) — Phase 0 to decide.
- **I-5**: `web/jsconfig.json` — removed (tsconfig.json supersedes it).

### Risk Log
- **R-1**: `verbatimModuleSyntax: true` — mitigated by `"type": "module"` migration in api/.
- **R-2**: `exactOptionalPropertyTypes: true` — relaxed to `false` in api/ for Mongoose compatibility.
- **R-3**: `noPropertyAccessFromIndexSignature` — relaxed to `false` in api/ for Record<string, unknown> patterns.

### Progress Log
- **2026-06-25**: Plan + Task files created. Phase 0 pending user decisions.
- **2026-06-26**: Phase 1 api/ migration complete (models, controllers, middleware, lib, routes all `.ts`). 75 TS errors remain. Phase 3 web/ structural setup done (134 TS/TSX files, 909 errors). Phase 2 admin-panel not started.

---

## Definition of Done — Migration Complete

A migration phase is "done" when:

1. ✅ `tsc --noEmit` (or equivalent) returns exit code 0.
2. ✅ Build command (`next build` or `tsc -p tsconfig.build.json`) succeeds.
3. ✅ Lint passes (or warnings are explicitly documented).
4. ✅ Smoke tests for the project's primary user flows pass.
5. ✅ No `any` introduced or pre-existing ones eliminated (search returns 0 in `src/`).
6. ✅ No new TODOs in code referencing "fix types later".
7. ✅ All migrated files committed; no orphaned `.js` next to `.tsx` twins.
8. ✅ Branch is up to date with default branch and ready to merge.

The full migration is complete when **all of Phase 1, Phase 2, and Phase 3** satisfy "done", and Phase 4 polish is merged.

---

*Last updated: 2026-06-27.*
