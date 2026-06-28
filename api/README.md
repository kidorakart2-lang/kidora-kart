# API — Express Backend

Express 5 + MongoDB REST API for the Jewellery Walla e-commerce platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript (tsx for dev, tsc for build) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (15min) + refresh tokens (7-day, httpOnly cookies) with bcrypt |
| Payments | Razorpay SDK (orders, payments, refunds, webhooks) |
| Storage | Cloudflare R2 (S3-compatible) via @aws-sdk/client-s3 |
| Email | Nodemailer (Gmail SMTP) + EJS templates |
| Cache | node-cache (in-memory, per-instance) |
| Rate Limiting | express-rate-limit |
| Validation | Zod (env & body), Mongoose (schema) |
| File Upload | multer (5MB per file, 10 files max) |
| Logging | console (replace with pino recommended) |
| Testing | Playwright (configured) |

## Project Structure

```
api/src/
├── server.ts            # Entry point — Express app factory
├── config/              # Env validation (Zod), Cloudflare config
├── controller/
│   ├── web/             # Customer-facing controllers (auth, orders, products, cart, wishlist, reviews)
│   └── admin/           # Admin controllers (products, orders, users, banners, CMS)
├── lib/                 # Utilities (jwt, bcrypt, cache, cloudflare, slug, nodemailer, tokens)
├── middleware/           # authMiddleware (JWT verify + role check), rateLimit, uploadMiddleware
├── models/              # Mongoose schemas (18 models: user, product, order, cart, category, etc.)
├── routes/              # Express routers (web/ and admin/ namespaces)
│   ├── web/             # Public/authenticated customer routes
│   └── admin/           # Admin-only routes (require admin role)
├── types/               # Shared TypeScript types
├── utils/               # asyncHandler, responses (success/fail helpers)
└── views/               # EJS email templates
```

## API Namespaces

| Prefix | Auth Required | Purpose |
|--------|---------------|---------|
| `/api/website/*` | Varies | Customer-facing endpoints |
| `/api/admin/*` | Admin role | Admin dashboard endpoints |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | TypeScript compile to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm typecheck` | TypeScript check without emitting |
| `pnpm lint` | ESLint on src/ |

## Environment Variables

Key vars in `api/.env` (gitignored):

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=jewellry-wala  # ⚠️ CHANGE TO crypto.randomBytes(64).toString('hex')
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_ENDPOINT=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GMAIL_USER=jewellerywalla@gmail.com
GMAIL_PASS=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

## Agent Skills

The following `.agents/skills/` are relevant to this project:

| Skill | Why |
|-------|-----|
| `express-production` | Express middleware order, error handling, security hardening, testing |
| `razorpay` | Razorpay payment integration (orders, refunds, webhooks) |
| `security-review` | OWASP vulnerability scanning for API auth, IDOR, injection |
| `ponytail` | Minimal-solution mode for backend refactoring |

## Architecture Notes

- **Auth flow**: JWT in httpOnly cookie + refresh token rotation. Middleware verifies JWT on every request.
- **Role enforcement**: `adminOnly` middleware (`requireRole('admin')`) on all admin routes. Role re-read from DB per request.
- **Error handling**: Global 4-arg error handler. `fail()` helper returns `_status`, `_message`, and `_error` in development only.
- **NoSQL injection**: Custom sanitize middleware strips `$` and `.` from body/query keys.
- **Post-payment work**: `setImmediate` for stock decrement, cart clear, emails — no queue (BullMQ recommended for production).
- **Caching**: node-cache per-instance. Cache invalidation on admin writes. Redis needed for multi-instance.
