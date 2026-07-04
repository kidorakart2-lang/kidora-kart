# Toy Shop — Monorepo

A full-stack toy e-commerce platform built with pnpm workspaces.

## Projects

| Package | Stack | Description | Port |
|---------|-------|-------------|------|
| `api/` | Express 5 + MongoDB (Mongoose) + TypeScript | REST API backend with JWT auth, Razorpay payments, Cloudflare R2 storage | `:5000` |
| `web/` | Next.js 16 + TypeScript | Customer-facing storefront with cart, checkout, auth, wishlist | `:3000` |
| `admin-panel/` | Next.js 16 + shadcn/ui + TypeScript | Admin dashboard for orders, products, users, CMS management | `:3001` |

## Getting Started

```bash
pnpm install
pnpm --filter api run dev          # Start API (port 5000)
pnpm --filter web run dev          # Start storefront (port 3000)
pnpm --filter admin-panel run dev  # Start admin panel (port 3001)
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
- **Rate Limiting**: express-rate-limit (auth, OTP, API)
- **Validation**: Zod (runtime) + Mongoose schemas (DB)

## Environment

Each project has its own `.env` (gitignored). Copy `.env.example` in each package:

| File | Key Vars |
|------|----------|
| `api/.env` | `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_*`, `CLOUDFLARE_*`, `GOOGLE_CLIENT_*`, `GMAIL_*`, `SUPPORT_EMAIL`, `CDN_HOST` |
| `web/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_CDN_HOST` |
| `admin-panel/.env.local` | `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_CDN_HOST` |

> API calls from web and admin panel go through Next.js rewrites (relative `/api/` paths),
> so httpOnly cookies work cross-origin. Backend URL only used server-side for direct fetches.

## Brand Configuration

Brand identity is env-ified via shared variables:

| Variable | Default | Used By |
|----------|---------|---------|
| `APP_NAME` | `Toy Shop` | API (email templates, order ID prefix, email subjects) |
| `SUPPORT_EMAIL` | `support@toyshop.com` | API (email templates), admin-panel (order receipt) |
| `CDN_HOST` | `cdn.toyshop.com` | API (image URLs), admin-panel (image validation), web (CSP/image sources) |
| `EMAIL_FROM_NAME` | `Toy Shop` | API (email sender display name) |

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
| Development | `http://localhost:3000/auth/google/callback` |
| Production | `https://<YOUR_FRONTEND_DOMAIN>/auth/google/callback` |

### Authorized JavaScript Origins

| Environment | Origin |
|-------------|--------|
| Development | `http://localhost:3000` |
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
| `FRONTEND_URL` | `api/.env` | Base URL for the redirect URI (e.g., `https://toyshop.com`) |

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
