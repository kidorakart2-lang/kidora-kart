# Jewellery Walla — Monorepo

A full-stack jewellery e-commerce platform built with pnpm workspaces.

## Admin Email - 
bluehawk1711@gmail.com
## Admin Password - 
1234567890

## Repository & Branch Workflow

The production code lives in a dedicated GitHub repository, separate from the original toy-store repo (which is kept as `origin` for history only).

| Remote | URL | Purpose |
|--------|-----|---------|
| `production` | `https://github.com/jewellerywalaonline-oss/jewellery-walla-monorepo.git` | **Canonical production repo** for the jewellery store |
| `origin` | `https://github.com/kidorakart2-lang/kidora-kart` | Legacy toy-store repo (kept for history, not used) |

### Branch Workflow

| Branch | Base | Purpose |
|--------|------|---------|
| `main` | `production/main` | **Stable production code** — deploy-ready, always green |
| `test` | `production/test` | **Testing branch** — try out new code before it goes to production |
| `jewellery-walla-prod` | local dev branch | Active development branch (currently used for local work) |

**Typical flow:**

1. Develop on `jewellery-walla-prod` (local) and push to `production/test` when you want it tested.
2. After testing on `test`, fast-forward/merge into `production/main` for release.
3. `main` is always the code that is (or will be) deployed.

```bash
# Push development branch to the test branch for testing
git push production jewellery-walla-prod:test

# After testing, promote to main
git push production test:main
```

> Both `main` and `test` on `production` currently point to the same production build commit
> (`fa59d39`) — the branch split exists so future test-only changes can live on `test` without
> touching `main`.

## Projects

| Package | Stack | Description | Port |
|---------|-------|-------------|------|
| `api/` | Express 5 + MongoDB (Mongoose) + TypeScript | REST API backend with JWT auth, Razorpay payments, Cloudflare R2 storage | `:5000` |
| `web/` | Next.js 16 + TypeScript | Customer-facing storefront with cart, checkout, auth, wishlist | `:3001` |
| `admin-panel/` | Next.js 16 + shadcn/ui + TypeScript | Admin dashboard for orders, products, users, CMS management | `:3000` |

## Local Ports

| Service | Port | Notes |
|---------|------|-------|
| API backend | `5000` | Express API (`/api/website/*`, `/api/admin/*`) |
| Admin panel | `3000` | `next dev -p 3000 --turbopack` |
| Web storefront | `3001` | `next dev -p 3001` |

> The **admin panel runs on `:3000` and the web storefront on `:3001`** — these two must never be swapped: the admin panel's `NEXT_PUBLIC_FRONTEND_URL` must point at the storefront (`http://localhost:3001`) so its `/api/revalidate` calls reach the web app.

## Getting Started

```bash
pnpm install
pnpm --filter api run dev          # Start API (port 5000)
pnpm --filter web run dev          # Start storefront (port 3001)
pnpm --filter admin-panel run dev  # Start admin panel (port 3000)
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all projects |
| `pnpm typecheck` | TypeScript check all projects |
| `pnpm lint` | Lint all projects |

## Key Tech Stack

- **Auth**: JWT (15min) + refresh tokens (7-day revocable, httpOnly cookies)
- **Payments**: Razorpay — orders, payments, refunds, webhooks
- **Storage**: Cloudflare R2 (S3-compatible product images)
- **Email**: Nodemailer (Gmail SMTP) + EJS templates
- **Cache**: node-cache (in-memory, per-instance)
- **Job Queue**: MongoDB-backed (DB persistence, retry up to 3x, startup recovery)
- **Rate Limiting**: express-rate-limit (auth, OTP, API) + account-level lockout (exponential backoff)
- **Validation**: Zod (runtime) + Mongoose schemas (DB)

## Environment

Each project has its own `.env` (gitignored). Copy `.env.example` in each package:

| File | Key Vars |
|------|----------|
| `api/.env` | `NEW_DB_URL`, `JWT_SECRET`, `RAZORPAY_KEY_*`, `CLOUDFLARE_*`, `GOOGLE_CLIENT_*`, `GMAIL_*`, `SUPPORT_EMAIL`, `CDN_HOST`, `STORE_PICKUP_PINCODE`, `FRONTEND_URL` |
| `web/.env` | `NEXT_PUBLIC_API_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_CDN_HOST` |
| `admin-panel/.env` | `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `NEXT_PUBLIC_REVALIDATE_SECRET`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_CDN_HOST` |

> All `.env` files are **gitignored** (only `api/.env.example` is committed as a reference).
>
> `web/.env` and `admin-panel/.env` must share the **same** `REVALIDATE_SECRET` value (see [Cache Invalidation](#cache-invalidation) below).

> API calls from web and admin panel go through Next.js rewrites (relative `/api/` paths),
> so httpOnly cookies work cross-origin. Backend URL only used server-side for direct fetches.

## Brand Configuration

Brand identity is env-ified via shared variables:

| Variable | Default | Used By |
|----------|---------|---------|
| `APP_NAME` | `Jewellery Walla` | API (email templates, order ID prefix, email subjects) |
| `SUPPORT_EMAIL` | `support@jewellerywalla.com` | API (email templates), admin-panel (order receipt) |
| `CDN_HOST` | `cdn.jewellerywalla.com` | API (image URLs), admin-panel (image validation), web (CSP/image sources) |
| `EMAIL_FROM_NAME` | `Jewellery Walla` | API (email sender display name) |
| `STORE_PICKUP_PINCODE` | `342005` | API (origin pincode for in-house shipping & delivery) |

## Cache Invalidation

The admin panel invalidates the storefront's Next.js Data Cache through a shared `/api/revalidate` endpoint on the **web app** (`:3001`).

```
Admin panel (:3000)                          Web storefront (:3001)
      │                                          │
      ├─ POST /api/revalidate ─────────────────►  ├─ verifies Authorization: Bearer <REVALIDATE_SECRET>
      │   (rewritten to http://localhost:3001)    ├─ revalidateTag(tag) for each tag
      │   Authorization: Bearer <secret>          └─ bumps in-memory version stamp
      │
      └─ (browser-side fetch, same origin →       GET /api/revalidate (public) — storefront's
         proxied by admin next.config.ts)           CacheInvalidationProvider polls every 30s and
                                                   invalidates React Query caches when the version
                                                   stamp changes
```

- **Secret**: `REVALIDATE_SECRET` on the web server and `NEXT_PUBLIC_REVALIDATE_SECRET` in the admin panel's env — both must be **identical**. Sent as `Authorization: Bearer <secret>`, never in the body.
- **Ports**: the admin panel must know the storefront URL — `NEXT_PUBLIC_FRONTEND_URL` (`admin-panel/.env`, default `http://localhost:3001`). A rewrite in `admin-panel/next.config.ts` routes `/api/revalidate` to the storefront so it isn't proxied to the API backend.
- **CORS**: the web app returns `Access-Control-Allow-Origin: *` + `POST, OPTIONS` for `/api/revalidate` so the admin panel's browser-side fetch works cross-origin.
- **GET is public** — it only returns the version stamp for the storefront's React Query cache watcher.
- `web/src/app/api/revalidate/route.ts` maps tags to `cacheLife()` profiles (`products`, `homepage`, `categories`, …) defined in `web/src/lib/cache-config.ts`.

## Deploying the API Server

```bash
# 1. Build TypeScript
pnpm --filter api run build

# 2. Set production env vars (NODE_ENV=production, FRONTEND_URL, etc.)
#    Copy api/.env.example → api/.env and update values

# 3. Start server
NODE_ENV=production pnpm --filter api run start
```

The API has no Dockerfile or Procfile — deploy as a Node.js process. For production:
- Use a process manager (pm2, systemd) to keep it alive
- Set `NODE_ENV=production`
- Ensure `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_*` are configured
- Set `FRONTEND_URL` to your production frontend URL (impacts CORS and Google OAuth callback)

## Google OAuth Configuration

Google OAuth uses a redirect-based authorization code flow. You must register authorized redirect URIs and JavaScript origins in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### Redirect URIs (Authorized Redirect URIs)

Add for each environment:

| Environment | Redirect URI |
|-------------|-------------|
| Development | `http://localhost:3001/auth/google/callback` |
| Production | `https://<YOUR_FRONTEND_DOMAIN>/auth/google/callback` |

### Authorized JavaScript Origins

| Environment | Origin |
|-------------|--------|
| Development | `http://localhost:3001` |
| Production | `https://<YOUR_FRONTEND_DOMAIN>` |

### OAuth Flow Summary

```
Frontend                              Backend                             Google
   │                                    │                                   │
   ├── POST /api/website/user/google-auth-init ──►                          │
   │◄───── { _url: google_auth_url } ───────────────────────────────────────│
   │                                    │                                   │
   ├── redirect to google_auth_url ─────────────────────────────────────►   │
   │◄──── redirect to /auth/google/callback?code=...&state=... ────────────│
   │                                    │                                   │
   ├── POST /api/website/user/google-callback { code, state } ──►          │
   │                                    ├── exchange code for tokens ──►    │
   │◄───── { user, token } ─────────────◄── verify id_token ──────────────│
   │                                    │                                   │
   └── store token, redirect to /profile                                    │
```

### Endpoints Involved

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/website/user/google-auth-init` | POST | Generate Google OAuth URL with state token |
| `/api/website/user/google-login` | POST | Verify Google ID token (One Tap / credential flow) |
| `/api/website/user/google-callback` | POST | Exchange auth code for tokens and create/login user |

### Required Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `GOOGLE_CLIENT_ID` | `api/.env` | Backend OAuth client identification |
| `GOOGLE_CLIENT_SECRET` | `api/.env` | Backend OAuth client secret |
| `FRONTEND_URL` | `api/.env` | Base URL for the redirect URI, email links, CORS (e.g., `https://jewellerywalla.com`) — must point at the **web storefront** |

> The `web/.env.local` also needs the same `GOOGLE_CLIENT_ID` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the frontend Google Identity Services library.

## Agent Skills

This repo includes `.agents/skills/` — reusable skills for AI coding tools:

| Skill | Description | Relevant For |
|-------|-------------|-------------|
| `express-production` | Express.js middleware, security, deployment | `api/` |
| `razorpay` | Razorpay payment integration | `api/` |
| `security-review` | OWASP vulnerability scanning | All projects |
| `vercel-react-best-practices` | React/Next.js performance optimization | `web/`, `admin-panel/` |
| `ui-ux-pro-max` | Design systems, colors, typography, UX | `web/`, `admin-panel/` |
| `web-design-guidelines` | Vercel Web Interface Guidelines | `web/`, `admin-panel/` |
| `vercel-optimize` | Vercel cost & performance optimization | `web/` |
| `vercel-react-view-transitions` | React View Transition API animations | `web/` |
| `deploy-to-vercel` | Vercel deployment (preview + production) | Root |
| `ponytail` | Minimal/simplest-solution coding mode | All projects |
| `e2e-test-writing` | Playwright E2E test patterns | All projects |

## Status

- ✅ Fully migrated to TypeScript (0 `.js`/`.jsx` files across all packages)
- ✅ `tsc --noEmit` passes cleanly on all packages
- ✅ All config files properly typed (`.ts` or JSDoc-checked `.js`)
- ✅ Brand identity env-ified across all packages (no hardcoded brand strings in source)
