# Toy Shop — Monorepo

A full-stack toy e-commerce platform built with pnpm workspaces.

## Projects

| Package | Stack | Description | Port |
|---------|-------|-------------|------|
| `api/` | Express 5 + MongoDB (Mongoose) + TypeScript | REST API backend with JWT auth, Razorpay payments, Cloudflare R2 storage | `:5000` |
| `web/` | Next.js 16 + TypeScript | Customer-facing storefront with cart, checkout, auth, wishlist | `:3000` |
| `admin-panel/` | Next.js 16 + shadcn/ui + TypeScript | Admin dashboard for orders, products, users, CMS management | `:3000` (proxied) |

## Getting Started

```bash
pnpm install
pnpm --filter api run dev          # Start API (port 5000)
pnpm --filter web run dev          # Start storefront (port 3000)
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
- **Rate Limiting**: express-rate-limit (auth, OTP, API)
- **Validation**: Zod (runtime) + Mongoose schemas (DB)

## Agent Skills

This repo includes `.agents/skills/` — reusable skills for Codebuff AI. Key skills:

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
| `skill-creator` | Create & optimize agent skills | All projects |

## Environment

Each project has its own `.env` (gitignored). Key variables:

- **`api/.env`** — `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_*`, `CLOUDFLARE_*`, `GOOGLE_CLIENT_*`, `GMAIL_*`
- **`web/.env`** — `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BUSINESS_*`
- **`admin-panel/.env`** — `NEXT_PUBLIC_BACKEND_URL`

> API calls from web and admin panel go through Next.js rewrites (relative `/api/` paths),
> so httpOnly cookies work cross-origin. Backend URL only used server-side for direct fetches.

## Status

- ✅ Fully migrated to TypeScript (0 `.js`/`.jsx` files across all packages)
- ✅ `tsc --noEmit` passes cleanly on all packages
- ✅ All config files properly typed (`.ts` or JSDoc-checked `.js`)