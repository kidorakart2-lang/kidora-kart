# Admin Panel — Next.js Dashboard

Next.js 16 admin dashboard with shadcn/ui components for managing the Jewellery Walla e-commerce platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS v4 |
| Icons | lucide-react |
| Animation | motion (Framer Motion successor) |
| HTTP | axios + fetch (mixed; centralized `api` client available in `lib/api.ts`) |
| State | React Query (@tanstack/react-query) |
| Auth | httpOnly cookie (`adminToken`) verified via proxy.ts middleware |
| Forms | react-hook-form + @hookform/resolvers |
| Tables | Custom DataTable with sort, search, date range, status filter |
| Charts | recharts |
| CMS | Drag-and-drop (dnd-kit) for home page sections |

## Project Structure

```
admin-panel/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Login page (email + password → httpOnly cookie)
│   ├── layout.tsx          # Root layout with metadata (noindex, follow)
│   ├── error.tsx           # Root error boundary
│   ├── not-found.tsx       # 404 page
│   └── dashboard/          # Dashboard routes (orders, products, users, etc.)
│       ├── layout.tsx      # Dashboard layout with sidebar + header
│       ├── loading.tsx     # Skeleton loading state
│       ├── error.tsx       # Dashboard error boundary (with retry + home link)
│       ├── page.tsx        # Dashboard home (stats, recent orders, revenue chart)
│       ├── orders/         # Order management (list, detail, mark shipped/cancelled)
│       ├── products/       # Product CRUD with image uploads
│       ├── users/          # User management with role change
│       ├── categories/     # Category/SubCategory/SubSubCategory CRUD
│       ├── banners/        # Banner management with link builder
│       ├── home-page/      # CMS drag-and-drop section builder
│       ├── product-faqs/   # FAQ management with multi-product bulk create
│       ├── ai-helpers/     # AI-assisted content generation
│       └── ...             # Logos, testimonials, sizes, materials, coupons, etc.
├── components/             # Shared UI components
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, select, etc.)
│   ├── sidebar.tsx         # Responsive sidebar (desktop: collapsible, mobile: Sheet)
│   ├── header.tsx          # Top header with search, theme toggle, profile
│   ├── data-table.tsx      # Reusable table with search, filter, pagination, export
│   ├── export-buttons.tsx  # JSON/CSV export
│   ├── drawer.tsx          # Slide-over drawer for forms
│   ├── alert-dialog.tsx    # Confirmation dialog
│   ├── order-receipt.tsx   # Print-friendly order receipt
│   └── ...                 # StatCard, RecentOrders, RevenueChart, etc.
├── hooks/                  # use-mobile, use-debounce, use-file-upload
├── lib/                    # api.ts (centralized fetch client), utils, animations, types
├── proxy.ts                # Next.js 16 middleware (auth gate via cookie existence check)
└── next.config.ts          # Build config, image optimization, security headers
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on **port 3000** with Turbopack (`next dev -p 3000 --turbopack`) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | Next.js lint |

## Auth Flow

1. Login POST to `/api/admin/user/login` (proxied through Next.js rewrites to backend)
2. Backend sets `adminToken` httpOnly cookie on the frontend domain
3. `proxy.ts` middleware checks for cookie existence on `/dashboard/*` routes
4. API backend cryptographically verifies every JWT on each request

> The middleware only gates UI routing — real auth enforcement is on the API side.

## Environment Variables

Environment variables live in the **gitignored `admin-panel/.env`** file (there is no committed example for the admin panel):

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_REVALIDATE_SECRET=your-random-secret-here
NEXT_PUBLIC_SUPPORT_EMAIL=support@jewellerywalla.com
NEXT_PUBLIC_CDN_HOST=cdn.jewellerywalla.com
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL for all CRUD requests |
| `NEXT_PUBLIC_FRONTEND_URL` | **Web storefront URL (`:3001`)** — where the cache revalidation POSTs go. Must point at the storefront, not this admin panel. |
| `NEXT_PUBLIC_REVALIDATE_SECRET` | Shared secret with the web storefront — sent as `Authorization: Bearer` to `/api/revalidate`. Must match the web app's `REVALIDATE_SECRET`. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support email displayed in order receipts |
| `NEXT_PUBLIC_CDN_HOST` | CDN hostname for image URL validation |

## Cache Invalidation

After every successful CRUD operation the admin panel calls `invalidateCache([...tags])` (`lib/invalidate-cache.ts`), which POSTs to `{NEXT_PUBLIC_FRONTEND_URL}/api/revalidate` with `Authorization: Bearer <NEXT_PUBLIC_REVALIDATE_SECRET>`. `next.config.ts` also rewrites `/api/revalidate` to the storefront so it isn't proxied to the API backend. See the root `readme.md` → *Cache Invalidation* for the full diagram.
| `AI_PROVIDER` | **Backend-only.** AI provider: `"gemini"` (default) or `"openrouter"`. See `api/.env.example` |
| `OPENROUTER_API_KEY` | **Backend-only.** OpenRouter API key (required when `AI_PROVIDER=openrouter`). See `api/.env.example` |
| `OPENROUTER_MODEL` | **Backend-only.** OpenRouter model ID, e.g. `"openrouter/free"` (default). See `api/.env.example` |

## Agent Skills

The following `.agents/skills/` are relevant to this project:

| Skill | Why |
|-------|-----|
| `vercel-react-best-practices` | React/Next.js perf optimization — waterfalls, bundle size, server/client components |
| `ui-ux-pro-max` | Design system, color palette, typography, UX patterns for admin UI |
| `web-design-guidelines` | Vercel Web Interface Guidelines compliance check |
| `security-review` | OWASP scanning for admin auth, role escalation, CSRF |
| `ponytail` | Minimal-solution mode for frontend refactoring |
| `vercel-optimize` | Vercel cost and performance optimization for the admin deployment |

## Known Remaining Issues (from admin-panel-review.md)

| Issue | Severity | Description |
|-------|----------|-------------|
| S4 | 🔴 | Role change lacks audit log + self-demotion guard |
| S7 | 🟠 | Role change re-authentication needed |
| S8 | 🟠 | No CSRF protection on state-changing endpoints |
| S9 | 🟠 | Avatar `\|\| ""` broken image fallback |
| S16 | 🟡 | `setTimeout` in export buttons instead of loading state |
| P3 | 🟠 | 13 files still use axios directly — centralized `api` client not adopted |
| P11 | 🟡 | OrderReceipt injects `<style jsx global>` per render |
| B18 | 🟢 | `optimizePackageImports` not configured in next.config.ts |

## Status

- ✅ 0 `.js`/`.jsx` files (fully TypeScript)
- ✅ `tsc --noEmit` passes
- ✅ `next build` succeeds
- ✅ Mobile hamburger menu (Sheet overlay)
- ✅ Centralized API client (`lib/api.ts`) — not yet adopted by pages
- ✅ Brand identity env-ified (support email, CDN host, metadata)
