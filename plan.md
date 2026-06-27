# TypeScript Migration Plan — Toy Shop Monorepo

> **Goal**: Convert the entire monorepo from JavaScript (mixed `.js` / `.jsx`) to TypeScript with zero loss of functionality, while enforcing modern best practices, type safety, and a unified, maintainable codebase.

---

## 1. Repository Overview

The repo is a **3-project monorepo** for a jewellery e-commerce platform ("Jewellery Walla"):

| Project | Stack | Role | Current TS Coverage |
|---|---|---|---|
| `admin-panel/` | Next.js 16 (App Router), React 19, Tailwind v4, Radix UI, TanStack Query | Admin dashboard + delivery portal | Partial — only `components/ui/*`, `app/layout.tsx`, `hooks/use-*.ts`, `lib/utils.js` listed in `tsconfig` |
| `web/` | Next.js 16 (App Router), React 19, Redux Toolkit, Tailwind v4, Radix UI | Customer-facing storefront | None — `jsconfig.json` only has `@/*` path alias; no `tsconfig.json` |
| `api/` | Express 5 + Mongoose 8 + JWT + Multer + Cloudflare R2 + Razorpay + Nodemailer | Backend REST API + Webhooks | None — pure CommonJS `.js` |

### Total File Counts (approx.)
- **`api/`**: 1 root file + 14 models + 14 controllers + 27 routes + 4 middleware + 7 lib + 1 config + ~12 email templates
- **`admin-panel/`**: ~15 app pages + ~22 dashboard files + 1 layout + ~55 UI components + ~22 shadcn primitives + 6 hooks + 5 lib
- **`web/`**: ~50+ app files (sections/pages) + ~30 UI components + 6 lib + 6 redux slices + 1 proxy

### Key Pain Points Today
- `admin-panel/next.config.mjs` has `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` — **errors are being silently suppressed**.
- `web/` has no TypeScript at all (uses `jsconfig.json`).
- `api/` uses CommonJS `require()` and untyped Mongoose schemas — no `InferSchemaType` or interfaces.
- Mixed module systems: Next.js uses ESM (`import`), `api/` uses CJS (`require`).
- No shared types between `web` and `admin-panel` and `api`.

---

## 2. Best Practices & Guiding Principles

The migration follows these principles (codified from the TS/Next/Express communities and reference projects like `vercel/commerce`, `t3-stack`, `node-typescript-boilerplate`):

### 2.1 TypeScript Best Practices
1. **Strict mode** — enable all `strict*` flags; do not loosen them later.
2. **`noUncheckedIndexedAccess`** — avoid off-by-one and `undefined` slips.
3. **`exactOptionalPropertyTypes`** — distinguishes "missing" from "explicit `undefined`".
4. **Avoid `any`** — use `unknown` and narrow; `eslint-disable` comments allowed only with a `// reason:`.
5. **Type-only imports** — `import type` everywhere to keep `tsc --noEmit` clean and bundle size down.
6. **`tsconfig.json` per project + `tsconfig.base.json`** — DRY inheritance via `extends`.
7. **`isolatedModules`** — emit-free compatibility for SWC/Turbopack/Next.
8. **`verbatimModuleSyntax`** — only what TS needs (transformation-friendly).
9. **ESM-first** — `"type": "module"` for the API; top-level `await` allowed.
10. **Path aliases** — `@/*` per project; never use deep `../../../` imports.

### 2.2 Next.js (App Router) Best Practices
1. **App Router conventions** — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
2. **Server Components by default** — opt-in `"use client"` only for stateful/leaf nodes.
3. **Co-located types** — colocate `interface`/`type` with the component, *or* put domain types in `src/types/`.
4. **`next.config.ts`** — migrate `next.config.mjs` to TS for typed config.
5. **Typed env** — `src/env.ts` (or `env.mjs`) with `zod` validation.
6. **Generated types** — `next typegen` & `.next/types/`.
7. **Route handlers** — type `Request`, `NextRequest`, and `params` via `RouteContext<{...}>`.
8. **`next-env.d.ts`** — keep it auto-generated; don't edit.
9. **`middleware.ts`** — needs typed `NextRequest` + `NextResponse`.

### 2.3 Express + Mongoose Best Practices
1. **Inferred model types** — `type Product = InferSchemaType<typeof productSchema>`.
2. **Repository/Service layer** — controllers stay thin; business logic in `services/`.
3. **Typed `Request`/`Response`** — `Request<Params, ResBody, ReqBody, Query>`.
4. **Validation** — `zod` schemas at the edge (`middlewares/validate.ts`).
5. **ESM** — `"type": "module"` + `import`/`export`.
6. **Async error handling** — single `asyncHandler` wrapper or `express-async-errors`.
7. **TS-Node + tsx** for dev, `tsc` for production builds.
8. **Strict env** — `src/config/env.ts` parsed with `zod`.

### 2.4 Tooling Best Practices
1. **Package manager** — keep current (mixed `pnpm-lock.yaml` + `package-lock.json`); standardize per-project during migration.
2. **Formatter** — Prettier with `printWidth: 100`.
3. **Linter** — `eslint-config-next` (apps) + `@typescript-eslint/recommended` + `eslint-config-prettier`.
4. **Pre-commit** — `lint-staged` + `husky` + `pre-commit` running `tsc --noEmit` per project (optional, project-wide).
5. **CI-friendly** — every project must compile with `tsc --noEmit` cleanly.

---

## 3. Architecture: Target End-State

```
toy-shop/
├── plan.md                       ← (this file)
├── task.md                       ← live task tracker (this migration)
├── admin-panel/                  ← Next.js 15 admin (TypeScript)
├── api/                          ← Express 5 backend (TypeScript, ESM)
├── web/                          ← Next.js 15 storefront (TypeScript)
└── packages/                     ← NEW: shared types package (optional, v2)
    └── shared-types/             ← API contracts, domain models
```

> Decision (deferred until §6 Task 1.2): introduce `packages/shared-types` only if cross-project type duplication > ~30 types. Otherwise, define API contracts in each Next.js app and rely on `axios` types.

---

## 4. Strategy & Approach

### 4.1 Migration Strategy: Strangler Fig + Parallel Run

We will **not** rewrite-and-replace. Instead, a layered approach per project:

1. **Phase A — Foundation**: install TS, set strict `tsconfig.json`, enable `allowJs` + `checkJs` + `noEmit` initially (so JS still runs, but errors are flagged).
2. **Phase B — Type Definitions**: write `src/types/` files for domain models (User, Product, Order, Cart, etc.) and `src/types/api.d.ts` for external libs lacking types.
3. **Phase C — Type the Leaf Utilities First**: pure `.js` modules (`utils.js`, `api.js`, `mock-data.js`, `slugFunc.js`, `cache.js`) → migrate first because they have no React/Express deps.
4. **Phase D — Models & Middleware (API)**: Mongoose models → typed `InferSchemaType`; middleware → typed.
5. **Phase E — Controllers & Routes (API)**: type `req`/`res`, request bodies, query params, response shapes.
6. **Phase F — Redux & Hooks (web & admin-panel)**: state shape, action creators, hooks.
7. **Phase G — Components**: leaf components → presentational components → page components.
8. **Phase H — Remove JS-only fallback**: turn off `allowJs` project-by-project.
9. **Phase I — Enable strict checks + remove `ignoreBuildErrors`/`ignoreDuringBuilds` flags** in `next.config`.
10. **Phase J — Verification**: `tsc --noEmit` zero errors; build runs; smoke tests pass.

### 4.2 Order of Operations (per project)

1. Install deps: `typescript`, `@types/node`, `@types/react*`, `@types/express`, `tsx`, `ts-node` (only where needed).
2. Add `tsconfig.json` (extends `tsconfig.base.json` if shared).
3. Rename `*.js` → `*.ts` / `*.jsx` → `*.tsx` (or add ts-compat files alongside).
4. Run `tsc --noEmit`, fix errors.
5. Run dev server, smoke-test.
6. Remove `allowJs` (if previously on).

### 4.3 Risk Mitigation
- **Keep JS files in place until they have a TS twin** — do not delete originals during rename; delete after smoke test.
- **Branch per project** — three independent migration branches (`feat/ts-admin-panel`, `feat/ts-api`, `feat/ts-web`) that can be merged sequentially.
- **Lock down `package-lock.json` / `pnpm-lock.yaml`** — only add TS-related packages; never bump unrelated deps during migration.
- **Screenshots / curl snapshots** — manual smoke before/after each project.
- **No behavior change** — pure type-only changes during migration; logic stays identical.

---

## 5. Per-Project Plan

### 5.1 `admin-panel/`

**Current state**
- `tsconfig.json` already exists (loose — `allowJs: true`, `target: ES6`, no `noUncheckedIndexedAccess`).
- `next.config.mjs` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — **must remove**.
- `components/ui/*` is mostly `.tsx` already (shadcn generated). Other components are `.jsx`.
- `hooks/use-*.ts` already TS.
- `lib/animations.js`, `lib/api.js`, `lib/export-utils.js`, `lib/mock-data.js`, `lib/utils.js` — JS.
- `app/` is mostly `.jsx` (page.jsx, layout.tsx, error.jsx, not-found.jsx, QueryProvider.jsx).
- `middleware.js` — JS.
- `components/{data-table, header, sidebar, multi-select, etc.}.jsx` — JS.

**Target state**
- All `.jsx` → `.tsx`, all `.js` → `.ts`.
- `tsconfig.json` upgraded to strict.
- `next.config.mjs` → `next.config.ts`.
- `next.config.ts` no longer suppresses TS errors.

**Type plan**
- `src/types/user.ts` — `AdminUser`, `DeliveryUser` (subset of Mongoose `User`).
- `src/types/product.ts`, `order.ts`, `cart.ts`, `wishlist.ts`, `category.ts`.
- `src/types/api.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`.
- `src/types/auth.ts` — `LoginPayload`, `TokenResponse`.
- `src/types/next-env.d.ts` already exists.

**Order of files to migrate (priority order)**
1. `lib/utils.js`, `lib/animations.js`, `lib/api.js`, `lib/export-utils.js`, `lib/mock-data.js` → `*.ts`
2. `app/layout.tsx` (already TS — tighten types)
3. `app/QueryProvider.jsx` → `.tsx` (typed `QueryClient`)
4. `app/page.jsx`, `app/error.jsx`, `app/not-found.jsx` → `.tsx`
5. `components/SingleImageUploader.tsx` (already TS — tighten)
6. `components/theme-provider.tsx` (already TS)
7. `components/*.jsx` (data-table, header, sidebar, multi-select, drawer, order-receipt, etc.) → `.tsx`
8. `components/ui/*.tsx` already TS — tighten types & fix any `any` usages
9. `app/dashboard/**/page.jsx` → `.tsx`
10. `app/dashboard/layout.jsx`, `app/delievery/layout.jsx` → `.tsx`
11. `middleware.js` → `middleware.ts` (typed `NextRequest`)
12. `next.config.mjs` → `next.config.ts`
13. `hooks/use-toast.ts`, `hooks/use-mobile.ts`, `hooks/use-file-upload.ts` — already TS, tighten.

### 5.2 `api/`

**Current state**
- `index.js` (CommonJS, 122 lines).
- `package.json` has no `"type": "module"`, no `"scripts.dev"`, no `typescript`.
- `src/models/*.js` — Mongoose schemas (CommonJS).
- `src/controllers/{web,admin}/*.js` — untyped Express handlers.
- `src/routes/{web,admin}/*.js` — Express routers.
- `src/middleware/{authMiddleware, uploadMiddleware, rateLimit}.js` — untyped.
- `src/lib/{jwt, bcrypt, cloudflare, cache, nodemailer, slugFunc}.js` — untyped.
- `src/config/cloudflare.config.js` — untyped.

**Target state**
- `"type": "module"` in `package.json`.
- `src/server.ts` (renamed `index.ts`) — bootstraps Express + Mongoose.
- `src/models/*.ts` — typed Mongoose models using `InferSchemaType<typeof schema>` + `HydratedDocument<T>`.
- `src/controllers/{web,admin}/*.ts` — `Request<...>`, `Response<...>` typing.
- `src/routes/{web,admin}/*.ts` — `Router` typed, controllers typed.
- `src/middleware/*.ts` — typed (extend `Request` with `req.user` via module augmentation).
- `src/lib/*.ts` — typed helpers.
- `src/config/*.ts` — typed config.
- `src/utils/asyncHandler.ts` — wraps async route handlers, forwards errors to `next(err)`.
- `src/middlewares/validate.ts` — Zod validator middleware.
- `src/config/env.ts` — `zod`-validated env loader.
- `scripts/` — `dev` runs `tsx watch src/server.ts`; `build` runs `tsc -p tsconfig.build.json`; `start` runs `node dist/server.js`.
- `tsconfig.json` extends base, target `ES2022`, module `NodeNext`, `strict: true`.
- `tsconfig.build.json` excludes tests, sets `noEmit: false`, `outDir: dist`.
- `nodemon.json` or `tsx --watch` for dev.

**Type plan**
- `src/types/express.d.ts` — module augmentation:
  ```ts
  declare global {
    namespace Express {
      interface Request {
        user?: IUser | null;
      }
    }
  }
  ```
- `src/types/models/*.ts` — interfaces for `IUser`, `IProduct`, etc.
- `src/types/api.ts` — `ApiSuccess<T>`, `ApiFailure`.
- `src/types/jwt.ts` — JWT payload shape.
- `src/types/multer.d.ts` — module augmentation for `Express.Request.files` etc.

**Migrations order**
1. `src/config/cloudflare.config.js` → `.ts`
2. `src/lib/{jwt, bcrypt, cache, slugFunc, cloudflare, nodemailer}.js` → `.ts`
3. `src/middleware/{authMiddleware, uploadMiddleware, rateLimit}.js` → `.ts`
4. `src/utils/{asyncHandler, ApiError, ApiResponse}.ts` (new)
5. `src/models/*.js` → `.ts`
6. `src/controllers/{web,admin}/*.js` → `.ts`
7. `src/routes/{web,admin}/*.js` → `.ts`
8. `index.js` → `src/server.ts`
9. `package.json` — add `scripts`, `"type": "module"`, build outputs.

### 5.3 `web/`

**Current state**
- Has `jsconfig.json` (just `@/*` path) — needs full `tsconfig.json`.
- `package.json` has `tsx: false` in `components.json` (shadcn config) — flip to `true`.
- All files are `.js` / `.jsx`.
- `next.config.mjs` — typed JSDoc only.
- `next-sitemap.config.js` — JS, simple.
- No TS deps.

**Target state**
- `tsconfig.json` extends base.
- `next.config.mjs` → `next.config.ts`.
- `next-sitemap.config.js` → `next-sitemap.config.ts`.
- All `*.jsx` → `*.tsx`; `*.js` → `*.ts`.

**Type plan**
- `src/types/index.ts` — shared domain types (mirror admin-panel + API).
- `src/types/next-env.d.ts` (auto-generated by Next).
- `src/types/seo.ts` — typed `siteConfig`, `defaultMetadata`, `Metadata` overrides.
- `src/types/next-sitemap.d.ts` — type the config.

**Order of files to migrate**
1. `src/lib/utils.js` → `.ts` (incl. `siteConfig`, `defaultMetadata`)
2. `src/hooks/use-mobile.js` → `.ts`
3. `src/redux/store/store.js` → `.ts` (`makeStore`, `RootState`, `AppDispatch`)
4. `src/redux/features/*.js` (auth, cart, wishlist, filters, logo, uiSlice) → `.ts` (slice types)
5. `src/middleware.js` → `.ts`
6. `src/lib/{fetchUser, fetchCartWislist, orderService, syncGuestData}.js` → `.ts`
7. `src/components/{comman, product, ui, providers, icons}/*.jsx` & `.js` → `.tsx` / `.ts`
8. `src/app/(pages)/*/page.jsx` → `.tsx`
9. `src/app/(sections)/*.jsx` → `.tsx`
10. `src/app/{layout, page, error, loading, not-found, robots, sitemap, favicon.ico}.js(x)` → `.tsx` / `.ts`
11. `src/app/error.js` → `.tsx`
12. `next-sitemap.config.js` → `next-sitemap.config.ts`
13. `next.config.mjs` → `next.config.ts`
14. `components.json` — flip `tsx: true`.

---

## 6. Shared `tsconfig.base.json`

A new `tsconfig.base.json` at repo root will be referenced by all three projects. (For Next.js projects, `tsconfig.json` must live inside the project — so they `extend` the base via relative path.)

```jsonc
// tsconfig.base.json (planned)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "incremental": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  }
}
```

Per-project overrides:
- **`admin-panel/tsconfig.json`**: `jsx: preserve`, `module: esnext`, `moduleResolution: bundler`, `paths: { "@/*": ["./*"] }`, `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`.
- **`api/tsconfig.json`** (project) **+ `tsconfig.build.json`**: `module: nodenext`, `moduleResolution: nodenext`, `target: ES2022`, `outDir: dist`, `noEmit: false` in build config.
- **`web/tsconfig.json`**: same shape as admin-panel but `baseUrl: src`, `paths: { "@/*": ["./src/*"] }`.

---

## 7. Dependency Matrix

### `admin-panel` (added)
- `typescript` ^5.6
- `@types/node` ^22 (already)
- `@types/react` ^19 (already)
- `@types/react-dom` ^19 (already)
- `@types/js-cookie` ^3
- `tsx` ^4 (dev only)

### `api` (added)
- `typescript` ^5.6
- `tsx` ^4 (dev only) — replaces `node index` in dev
- `@types/node` ^22
- `@types/express` ^4 / ^5
- `@types/cors` ^2
- `@types/compression` ^1
- `@types/multer` ^1
- `@types/jsonwebtoken` ^9
- `@types/bcrypt` ^5
- `@types/nodemailer` ^6
- `@types/ejs` ^3
- `@types/sharp` ^0.31
- `@types/node-cache` ^5
- `@types/aws-sdk__client-s3` (already inferred)
- `zod` ^3 — runtime validation
- `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` (dev)

### `web` (added)
- `typescript` ^5.6
- `@types/node` ^22
- `@types/react` ^19
- `@types/react-dom` ^19
- `@types/js-cookie` ^3
- `@types/react-redux` ^7
- `tsx` ^4 (dev only)

### Repo-root (added — optional, deferred)
- `prettier`, `eslint-config-prettier` (already present where applicable)
- `husky`, `lint-staged` — optional v2

---

## 8. Rollout Phases (high-level)

| Phase | Goal | Exit Criteria |
|---|---|---|
| 0. Setup | Tracking files, branch strategy, baseline | `plan.md`, `task.md`, `tsconfig.base.json` |
| 1. API | Backend fully TS, ESM, strict | `tsc --noEmit` clean; `npm run dev` boots; existing curl flows pass |
| 2. Admin Panel | Admin fully TS | `tsc --noEmit` clean; `next dev` boots; build succeeds w/o `ignoreBuildErrors` |
| 3. Web Storefront | Web fully TS | `tsc --noEmit` clean; `next dev` boots; build succeeds |
| 4. Shared Types (optional) | Cross-project domain types extracted | `packages/shared-types` published internally |
| 5. Hardening | Remove `allowJs`, `ignoreBuildErrors`, add pre-commit hooks | All three projects production-ready |

---

## 9. Success Metrics

- **Zero `any` types** in production code (search ripgrep: `: any` returns 0 hits in `src/`).
- **`tsc --noEmit` returns exit code 0** for all three projects.
- **`next build` succeeds** for `admin-panel` and `web` with `typescript.ignoreBuildErrors: false`.
- **`tsc -p tsconfig.build.json` succeeds** for `api`; `node dist/server.js` boots.
- **No regression** in dev server smoke tests: admin login flow, product CRUD, checkout flow, order webhook.
- **`<5%` runtime overhead** measured by request p95 latency (sample endpoint).
- **Bundle size neutral or smaller** (TS-only types are erased).

---

## 10. Open Decisions (require user input before kicking off)

1. **Shared `packages/` monorepo** — introduce now or defer?
2. **Package manager per project** — keep mixed (`pnpm` for admin, `npm` for web & api) or unify?
3. **Validation library** — `zod` (recommended) or `yup`?
4. **ESLint config** — extend `next/core-web-vitals` + `@typescript-eslint/recommended-type-checked` (slower but stronger) or just `recommended`?
5. **Env validation** — strict at boot vs. lazy?
6. **Mongoose typed models**: `InferSchemaType` only vs. hand-written interfaces?

These will be resolved in `task.md` → Phase 0 confirmation step before any code changes.

---

## 11. References (knowledge base)

- TypeScript Handbook — https://www.typescriptlang.org/docs/handbook/
- `tsconfig/bases` — https://github.com/tsconfig/bases
- Next.js TypeScript guide — https://nextjs.org/docs/app/api-reference/config/typescript
- Mongoose + TypeScript — https://mongoosejs.com/docs/typescript.html
- Express + TypeScript — https://expressjs.com/en/resources/frameworks.html
- shadcn/ui TS-first config — https://ui.shadcn.com/docs/typescript

---

*Last updated: 2026-06-25.*