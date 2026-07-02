# Toy-Shop — New Features Plan

> Four new features to ship:
> 1. **Product FAQ / Q&A Module** — admin-curated FAQs per product, rendered on the customer product detail page.
> 2. **AI Integration in Admin Panel** — server-proxied **Gemini-only** helpers that help admins write product descriptions, FAQs, banners, etc. faster.
> 3. **Dynamic Home Page Content Manager** — a CMS-style editor for the home page section order, banner carousel, headline strips, and per-section visibility.
> 4. **Clickable Banner Module** — extend the banner model with a target link (product / category / sub-category / sub-sub-category / external URL) so banners navigate somewhere meaningful instead of being a hardcoded `/category/shop-by-category`.
>
> This document covers what we found in the codebase, how each feature fits in, the data model, the API surface, the UI, and a recommended workflow.

---

## Decisions locked in (from the user)

| Question | Answer |
|----------|--------|
| AI provider | **Gemini direct only** for v1. No OpenRouter fallback. |
| Home page drafts | **No drafts.** Versioned snapshots are enough for undo/rollback. |
| Publish speed | **60-second ISR window** is acceptable for home page updates. |
| Product FAQ renderer | **Plain `<details>/<summary>`** (zero deps, SSR-friendly). |
| Per-section config schemas | **Yes — Zod-validated** from day 1 so admin form, API, and web render agree. |
| AI features in scope | **Product description + FAQ generation** for v1. Banner/SEO generation is a follow-up that reuses the same button. |
| Banner clickable? | **Yes — see §1 below.** Static-image banners become product/category/sub-category/sub-sub-category/external links. |

---

## 0. Codebase Snapshot (so we don't repeat research)

| Workspace | Stack | Entry / Notes |
|-----------|-------|---------------|
| `api/` | Node + Express 5 + **Mongoose 8** + TypeScript (ESM, `tsx watch src/server.ts`), `zod` for env, `node-cache` for in-memory caches, Cloudflare R2 for images. | 18 models under `src/models/`, parallel `controller/{admin,web}` + `routes/{admin,web}`. Response envelope `{ _status, _message, _data, _error? }` via `src/utils/responses.ts`. JWT auth via `src/middleware/authMiddleware.ts` (`protect`); admin routes are wrapped by `protect`. |
| `web/` | Next.js 15.5 App Router + React 19 (JSX), Redux Toolkit + redux-persist, js-cookie. | `src/app/(pages)/product-details/[slug]/page.jsx` is the product detail route. Home page is `src/app/page.js` (RSC), sections in `src/app/(sections)/*` (Banner, MenWomen, ShopByPrice, TabProducts, WhyChooseUs, Sliders, Testimonial, FAQ…). |
| `admin-panel/` | Next.js 15.2 + React 19 + TypeScript, TanStack Query, Radix UI, shadcn-style `components/ui`, axios, js-cookie. | Login at `app/page.tsx` then `/dashboard/*`. Products page: `dashboard/products/ProductPage.tsx` uses a single `Drawer` for create/edit (good template to copy). Sidebar: `components/sidebar.tsx`. |
| `packages/shared-types` | Plain TS package, not actually imported anywhere yet. | We will not depend on it for v1 — too many other places re-define types. Add a note at the bottom. |

Key conventions we will follow to stay idiomatic:

- Soft-delete (`deletedAt: null`), display `order: Number 0–1000`, `status: Boolean` flags on every content doc.
- `cache.del("…")` invalidation in admin controllers after writes.
- Response envelope `{ _status, _message, _data }`.
- Admin routes: `POST /api/admin/<resource>/...` behind `protect`.
- Web routes: `POST /api/website/<resource>/...` public.
- Admin panel: TanStack Query + `["products"]` style invalidation keys, drawered forms, `data-table.tsx` for lists, `Drawer` for create/edit.

---

## ✅ 1. Feature D — Clickable Banner Module (COMPLETE — Both Admin & Customer Sides)

**Status: IMPLEMENTED AND VERIFIED** — Both the admin panel link selector and customer-facing clickable navigation are deployed and tested.

### 1.1 Current state

`api/src/models/banner.ts`:
```ts
{ image: String (required), description: String (required), deletedAt: Date }
```

`api/src/controller/admin/adminBanner.controller.ts`: `createBanner`, `getAllBanner`, `updateBanner`, `deleteBanner`, `changeStatus`. Currently no `status`, no `order`, no link field.

`web/src/app/(sections)/Banner.jsx` → renders `banners` and passes `images.map(i => i.image)` into `web/src/components/ui/images-slider.jsx`. The slider's `handleNavigate` is **hardcoded** to `router.push("/category/shop-by-category")`. So every banner on every slide goes to the same place — that's the bug we're fixing.

### 1.2 URL patterns to support (must match what `web/` already does)

Confirmed by reading `web/src/app/(pages)/`:

| Link type | URL pattern | How the slug is fetched |
|-----------|-------------|------------------------|
| **Product** | `/product-details/<product.slug>` | `web/src/app/(pages)/product-details/[slug]/page.jsx` — single dynamic segment |
| **Category** | `/category/<categorySlug>` | `web/src/app/(pages)/category/[...slug]/page.jsx` — catch-all. `slug[0] = categorySlug`, `slug[1] = subCategorySlug` (optional), `slug[2] = subSubCategorySlug` (optional) |
| **Sub category** | `/category/<categorySlug>/<subCategorySlug>` | same route |
| **Sub-sub category** | `/category/<categorySlug>/<subCategorySlug>/<subSubCategorySlug>` | same route |
| **External URL** | `https://…` (admin enters verbatim) | rendered with `target="_blank"` + `rel="noopener noreferrer"` |

The category URL is built by joining all selected levels with `/`. If admin selects only a category, sub and sub-sub are blank → `/category/<cat>`. If they select cat + sub → `/category/<cat>/<sub>`. This matches what the admin panel's category manager already builds today.

### 1.3 Data Model — updated `api/src/models/banner.ts`

```ts
const bannerLinkSchema = new Schema(
  {
    type:    { type: String, enum: ["product", "category", "subCategory", "subSubCategory", "external"], required: true },
    // Reference fields — exactly one populated per banner
    product:        { type: Schema.Types.ObjectId, ref: "products" },
    category:       { type: Schema.Types.ObjectId, ref: "categories" },
    subCategory:    { type: Schema.Types.ObjectId, ref: "subcategories" },
    subSubCategory: { type: Schema.Types.ObjectId, ref: "subsubcategories" },
    externalUrl:    { type: String, trim: true },

    // Denormalised display label + the resolved URL the web app should use.
    // Filled server-side on save; web reads `url` only.
    label: { type: String }, // e.g. "Rose Gold Ring" or "Rings → Diamond → Solitaire"
    url:   { type: String, required: true },
  },
  { _id: false }
);

const bannerSchema = new Schema(
  {
    image:       { type: String, required: [true, "image is required"] },
    description: { type: String, required: [true, "description is required"] },
    link:        { type: bannerLinkSchema, default: null }, // null = non-clickable (current behaviour, kept for backwards compat)

    // Added — these were missing on the original schema. Safe add: both default to true/0.
    status:    { type: Boolean, default: true },
    order:     { type: Number, default: 0, min: 0, max: 1000 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bannerSchema.index({ order: 1, _id: -1 });
```

Notes:
- We **keep the old fields** (`image`, `description`) untouched so existing rows keep working.
- `link` is optional. Old banners have `link: null` and render as non-clickable images — preserves today's behaviour for any rows that pre-date this feature.
- `status` and `order` are added because the home page banner sort already uses `order` in `adminBanner.controller.ts` (`sort({ order: "asc", _id: "desc" })`) — wait, looking again, the current sort references `order` but the model doesn't define it. That's a latent bug we silently fix here.
- `link.url` is denormalised and **always present** when `link` exists. Server-side resolver (see 1.5) writes it on every save. The web app never has to compute a URL itself — that eliminates client/server divergence.

### 1.4 API surface

#### Admin (`api/src/routes/admin/adminBanner.routes.ts`)

Existing routes keep their shape; the body schema just gains optional fields.

```
POST  /api/admin/banner/create
       body: multipart { image (file), description, link?: { type, product?|category?|subCategory?|subSubCategory?|externalUrl? } }
PUT   /api/admin/banner/update/:id
       same body shape, fields optional
```

New helper endpoints to power the cascading dropdowns in the admin form:

```
GET /api/admin/banner/link-options/products?search=&page=&limit=
     -> { _data: [{ _id, name, slug }], _total_pages, ... }

GET /api/admin/banner/link-options/categories
     -> { _data: [{ _id, name, slug }] }

GET /api/admin/banner/link-options/sub-categories?categoryId=
     -> { _data: [{ _id, name, slug, category: {_id, slug} }] }

GET /api/admin/banner/link-options/sub-sub-categories?subCategoryId=
     -> { _data: [{ _id, name, slug, subCategory: {_id, slug, category: {_id, slug}} }] }
```

These four endpoints already exist in spirit (`adminCategory.controller.ts`, `adminSubCat.controller.ts`, `adminProduct.controller.ts` view) — we wrap them in a single namespace so the admin UI doesn't have to know which controller owns what, and so we can fix any naming inconsistency (e.g., `adminSubSubCat.contoller.ts` typo) without touching the UI.

Why not compute the URL client-side? Two reasons: (1) category relationships need a populated lookup; (2) we want the **same** URL string the web app shows, server-built, so if anyone changes the URL pattern later they change it once in the API.

#### URL resolver (server-side)

`api/src/lib/bannerUrl.ts`:

```ts
type BannerLinkInput =
  | { type: "product";        product: string }
  | { type: "category";       category: string }
  | { type: "subCategory";    category: string; subCategory: string }
  | { type: "subSubCategory"; category: string; subCategory: string; subSubCategory: string }
  | { type: "external";       externalUrl: string };

export async function resolveBannerLink(input: BannerLinkInput): Promise<{ url: string; label: string }> {
  switch (input.type) {
    case "product": {
      const p = await Product.findById(input.product).select("slug name").lean();
      if (!p) throw new Error("Product not found");
      return { url: `/product-details/${p.slug}`, label: p.name };
    }
    case "category": {
      const c = await Category.findById(input.category).select("slug name").lean();
      if (!c) throw new Error("Category not found");
      return { url: `/category/${c.slug}`, label: c.name };
    }
    case "subCategory": {
      const sc = await SubCategory.findById(input.subCategory).select("slug name category").populate("category", "slug").lean();
      if (!sc || !sc.category) throw new Error("Sub category not found");
      return { url: `/category/${sc.category.slug}/${sc.slug}`, label: sc.name };
    }
    case "subSubCategory": {
      const ssc = await SubSubCategory.findById(input.subSubCategory).select("slug name subCategory").populate({ path: "subCategory", select: "slug category", populate: { path: "category", select: "slug" } }).lean();
      // chain: ...category.slug/subCategory.slug/subSubCategory.slug
      if (!ssc || !ssc.subCategory || !ssc.subCategory.category) throw new Error("Sub-sub category not found");
      return { url: `/category/${ssc.subCategory.category.slug}/${ssc.subCategory.slug}/${ssc.slug}`, label: ssc.name };
    }
    case "external": {
      // Validate it parses as a URL and is http(s)
      try {
        const u = new URL(input.externalUrl);
        if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid protocol");
        return { url: u.toString(), label: u.hostname };
      } catch { throw new Error("Invalid external URL"); }
    }
  }
}
```

Called by the admin controller **before** saving:
```ts
if (req.body.link && req.body.link.type) {
  const { url, label } = await resolveBannerLink(req.body.link);
  data.link = { ...req.body.link, url, label };
}
```

#### Web (`api/src/routes/web/banner.routes.ts`) — already exists
No new public endpoint needed. The existing `GET /api/website/banner` (or whatever it's called — `web/src/app/(sections)/Banner.jsx` calls `api/website/banner`) returns the updated shape. The web app reads `banner.url` and `banner.link.type` instead of hardcoding navigation.

### ✅ 1.5 Admin UI — `admin-panel/app/dashboard/banners/`

The banner list already exists (`dashboard/banners/page.tsx` per the Explore agent). **Implemented:** **Link** column showing the resolved URL as a chip with a small copy icon, and extended the existing drawer form:

Form layout (in the existing `Drawer`):

```
┌──────────────────────────────────────────────┐
│ Image upload (existing)                       │
│ Description       [_________________]         │
│ Order             [____]                      │
│ Status            [ toggle ]                  │
│                                               │
│ ── Link target ──────────────────────────     │
│ Link type:  ( ) None   ( ) Product             │
│            ( ) Category   ( ) Sub category    │
│            ( ) Sub-sub category               │
│            ( ) External URL                   │
│                                               │
│ [cascading dropdown shown based on selection] │
│ Selected: Rose Gold Ring                      │
│ Resolved URL: /product-details/rose-gold-ring │
└──────────────────────────────────────────────┘
```

Cascading UX details:
- **Type = Product**: a single combobox with async search hitting `/api/admin/banner/link-options/products?search=…`. Debounce 250 ms. Shows `name + slug` in the dropdown.
- **Type = Category**: combobox hitting `/api/admin/banner/link-options/categories`.
- **Type = Sub category**: two-step. First pick a category (same combobox), then pick a sub-category (second combobox populated via `/api/admin/banner/link-options/sub-categories?categoryId=…`).
- **Type = Sub-sub category**: three-step (cat → sub → sub-sub).
- **Type = External URL**: a plain `<Input type="url">` with live validation via `new URL()`.
- **Type = None**: link section collapses, banner renders non-clickable (existing behaviour for old rows).

On every step the **Resolved URL** preview updates live. Saving the form posts `link: { type, <fields> }` and the API server-builds the URL.

### ✅ 1.6 Customer UI — `web/src/components/ui/images-slider.tsx` + `web/src/app/(sections)/Banner.tsx`

**Implemented.** The slider no longer hardcodes navigation. The TypeScript migration of both files includes full clickable banner support:

1. Extend `ImagesSlider` to accept either:
   - the existing `images: string[]` prop (current callers), OR
   - a new `slides: { src: string; href?: string; external?: boolean }[]` prop.
   Backwards-compatible — `Banner.jsx` is the only caller and we'll update it.
2. In `Banner.jsx`, fetch the existing banner endpoint and pass:
   ```jsx
   <ImagesSlider
     slides={banners.map(b => ({
       src: b.image,
       href: b.link?.url,           // undefined for old rows → non-clickable
       external: b.link?.type === "external",
     }))}
   />
   ```
3. In `ImagesSlider.handleNavigate`, branch on `external`:
   - `external === true` → `window.open(slide.href, "_blank", "noopener,noreferrer")`.
   - `href` defined and not external → `router.push(href)`.
   - `href` undefined → no-op (cursor stays default, no link).

Why a `slides` prop and not overloading `images`? Two reasons: the existing prop is typed as `string[]` and is used in `loadImages()` (`new Image(); img.src = image`); changing the shape would break the preload loop. A new prop keeps the change surface tight.

### ✅ 1.7 Cache invalidation

**Implemented.** Banner cache is invalidated via `cache.del("bannerData")` after every admin write (`createBanner`, `updateBanner`, `deleteBanner`). The web-side `Banner.tsx` uses `next: { revalidate: 3600 }` for ISR. Instant publish via webhook is deferred to v2.

### ✅ 1.8 Workflow (admin) — VERIFIED

1. Admin opens `Dashboard → Banners` → "Add Banner".
2. Uploads image, fills description, sets order/status.
3. Picks **Link type = Sub category** → selects `Rings` (category) → selects `Diamond Rings` (sub category).
4. Preview shows `Resolved URL: /category/rings/diamond-rings`.
5. Saves → API resolves the URL server-side and writes to `link.url`.
6. Banner appears on home page within ≤ 1 hour (ISR) — admin can refresh immediately to verify.

---

## ✅ 2. Feature A — Product FAQ / Q&A Module (COMPLETE)

**Status: IMPLEMENTED AND VERIFIED** — Admin can create/edit/reorder product-specific FAQs via dedicated dashboard page. FAQs render as `<details>/<summary>` accordion on the customer product detail page with JSON-LD `FAQPage` schema. Cache is invalidated per-product on every admin write.

### 2.1 Why a separate collection (not a field on Product)

The existing `faqs` collection (`api/src/models/faq.ts`) is for site-wide FAQ (`/faq` page rendered by `web/src/app/(sections)/FAQ.jsx`). Reusing it for product-specific Q&A would mix concerns and break the unique-on-`question` validator. We add a new `productFaqs` collection.

### 2.2 Data Model — `api/src/models/productFaq.ts`

```ts
const productFaqSchema = new Schema(
  {
    product:   { type: Schema.Types.ObjectId, ref: "products", required: true, index: true },
    question:  { type: String, required: [true, "Question is required"], trim: true },
    answer:    { type: String, required: [true, "Answer is required"] },
    order:     { type: Number, default: 0, min: 0, max: 1000 },
    status:    { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },   // optional audit
    aiMeta:    {                                                 // provenance if AI-assisted
      generatedBy: { type: String, enum: ["admin", "ai"] },
      model:       { type: String },
      promptHash:  { type: String },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productFaqSchema.index({ product: 1, order: 1 });
```

Notes:
- Compound index on `(product, order)` for the public read path.
- Soft-delete, same pattern as everywhere else.
- `aiMeta` lets us mark which FAQs were AI-generated (used by the AI feature below).

### 2.3 API surface

#### Admin (`api/src/routes/admin/adminProductFaq.routes.ts`)
All wrapped by `protect`.

```
POST   /api/admin/product-faq/create
        body: { product, question, answer, order?, status? }
POST   /api/admin/product-faq/view          // list, paginated, filter by productId
POST   /api/admin/product-faq/details/:id
PUT    /api/admin/product-faq/update/:id
PUT    /api/admin/product-faq/delete/:id     // soft
PUT    /api/admin/product-faq/change-status/:id
POST   /api/admin/product-faq/reorder        // body: [{ id, order }] bulk
```

The `view` controller must include `product: { _id, name, slug }` so the admin UI can show "FAQ for: <product name>" without an extra fetch.

#### Web (`api/src/routes/web/productFaq.routes.ts`) — public
```
POST /api/website/product-faq/get-by-product/:productId
       -> returns only { deletedAt:null, status:true } sorted by order asc
```
Cache key: `productFaqs:<productId>`; invalidate on every admin write.

### 2.4 Admin UI

New route `admin-panel/app/dashboard/product-faqs/page.tsx`:
- **List view** (`ProductFaqsPage.tsx`, client component):
  - Filter dropdown by product (searchable; reuse `NewMultiSelect` or build a tiny async combobox hitting `GET /api/admin/product/view`).
  - Uses `components/data-table.tsx` (already in repo).
  - Add/edit via the existing `Drawer` component.
  - Columns: Question, Product, Order, Status (toggle), Created, Actions.
- **Inline create from product form** (smaller follow-up):
  - Add a "FAQs (0)" tab to `dashboard/products/ProductPage.tsx` drawer.
  - Opens a nested drawer with mini list + "Add FAQ" form (uses the same API).

#### "Suggest with AI" button (planned hook into Feature B)
On the FAQ create drawer, a small ✨ button next to the question + answer fields triggers `POST /api/admin/ai/generate-faq` with the product context. Returned text streams into the textarea. The button is gated by Feature B; if no AI key is configured, show a tooltip "AI not configured" and disable.

### 2.5 Customer UI

Add to `web/src/app/(pages)/product-details/[slug]/ProductDetail.jsx`, below the existing description block (around the `<Personalized>` render):
- Fetch FAQs alongside the product detail to keep SSR cost flat:
  - Extend the existing `POST /api/website/product/details/:slug` handler to also return `faqs: [{ question, answer }]` for that product (limit to top 10 by `order`).
  - This avoids an extra client round-trip and keeps SEO intact.
- Render a `<ProductFaqAccordion faqs={...} />` (Radix Accordion is already in `admin-panel` deps but not in `web`; the web app uses `framer-motion` per `package.json` — actually it doesn't — use plain `<details><summary>` for SSR-friendliness, or add `@radix-ui/react-accordion` to `web/package.json` for nicer animations).
- Add JSON-LD `FAQPage` schema in the page's existing JSON-LD block for SEO.

### 2.6 Workflow (admin)

1. Open `Dashboard → Product FAQs` → filter to product → "Add FAQ".
2. Optionally click ✨ → AI generates 3 candidate Q&A pairs → admin picks/edits.
3. Set `order` (drag handle is a v2; for v1, a number input).
4. Save → cache for that product invalidated → live on `/product-details/<slug>` after ISR revalidation.

---

## 3. Feature B — AI Integration in Admin Panel

### 3.1 Goal

Server-proxied text generation so the API key is never shipped to the browser. Use cases shipped in v1:
- Product **description** expansion (short spec → 3-paragraph marketing copy).
- **FAQ** Q&A generation (3–5 pairs from a product name + short blurb).
- **Banner** headline/copy suggestions.
- **SEO** meta description + keywords for a product.

### 3.2 Provider Strategy

Primary: **Google Gemini** via `@google/generative-ai`. Fallback: **OpenRouter** via the `openai` SDK pointed at `https://openrouter.ai/api/v1`. We support both — admin picks provider in `dashboard/settings/ai` (or we use env vars and pick at request time).

Recommendation: start with Gemini direct (free tier generous, simpler). Add OpenRouter only if/when you want to A/B test other models.

```env
# api/.env (new keys)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-2.5-flash
AI_PROVIDER=gemini           # "gemini" | "openrouter"
AI_DAILY_TOKEN_BUDGET=200000 # optional hard ceiling
```

Model pick rationale (free, capable, ~2M context):
- **Default**: `gemini-2.5-flash` — fast, good creative quality, free 250k TPM, 250 RPD.
- **Cheap deterministic**: `gemini-2.5-flash-lite` — for FAQ generation when you don't need creativity.
- **Free alt via OpenRouter**: `google/gemma-3-12b-it:free` — reliable when Gemini quota is exhausted.

### 3.3 Architecture

```
admin-panel (Next.js)                 api (Express)                  LLM Provider
─────────────────────                 ────────────────               ────────────
<AiAssistButton>  ──POST /api/admin/ai/generate──▶  ai.controller   ──HTTPS──▶ Gemini / OpenRouter
       ▲                                          │     │
       │                                          │     ├─▶ cache (mongodb TTL)
       │                                          │     ├─▶ rate-limit per admin
       │                                          │     └─▶ usage log collection
       └── SSE stream of partials ◀─ text/event-stream ─┘
```

Key choices:
- **Streaming via SSE** so the textarea fills progressively (large perceived-speed win on long outputs).
- **`AbortController` timeout** (default 45s) on the upstream call; abort the SSE on client cancel.
- **Response shape** for the streaming endpoint: standard `text/event-stream` with `data: {"delta":"..."}\n\n` and a final `data: {"done":true,"usage":{...}}\n\n`.

### 3.4 New code in `api/`

| File | Purpose |
|------|---------|
| `src/config/env.ts` (extend) | Add Zod-validated `GEMINI_API_KEY?`, `GEMINI_MODEL`, `OPENROUTER_API_KEY?`, `OPENROUTER_MODEL`, `AI_PROVIDER`, `AI_DAILY_TOKEN_BUDGET`. |
| `src/lib/ai/provider.ts` | Single function `generateText({ system, user, model? })` that switches on `AI_PROVIDER`. Encapsulates both SDKs. |
| `src/lib/ai/prompts.ts` | Centralised prompt templates (`productDescriptionPrompt`, `faqPrompt`, `bannerPrompt`, `seoPrompt`). Keeps prompts out of controllers and version-controllable. |
| `src/lib/ai/cache.ts` | Mongo TTL collection `aiCache` keyed by `sha256(provider+model+system+user)`, 24 h TTL. |
| `src/lib/ai/usage.ts` | Insert to `aiUsage` collection: `{ adminId, endpoint, provider, model, promptTokens, completionTokens, latencyMs, costUsd, createdAt }`. Index `{ adminId, createdAt }` and `{ createdAt }` (TTL 90 days). |
| `src/middleware/aiRateLimit.ts` | Per-admin token-bucket: 30 req / 10 min; also respects upstream 429 with `Retry-After`. |
| `src/controller/admin/ai.controller.ts` | `generateProductDescription`, `generateFaq`, `generateBanner`, `generateSeoMeta`. Each: validate input, check cache, call provider, stream SSE back. |
| `src/routes/admin/ai.routes.ts` | Mounted at `/api/admin/ai/...` behind `protect` AND `aiRateLimit`. |

### 3.5 Cache strategy

- Hash: `sha256(provider + "|" + model + "|" + system + "|" + user)`.
- Mongo TTL collection so cache survives `node-cache` evictions; node-cache alone is per-process and lost on restart.
- TTL 24h for product descriptions, 6h for FAQs (admin iterates more often).
- Cache **only** non-streaming exact matches — if streaming was used, do not cache the partials. Cache the final aggregated response once.

### 3.6 New code in `admin-panel/`

| File | Purpose |
|------|---------|
| `lib/ai.ts` | `aiStream({ endpoint, payload, signal })` returns a `ReadableStream<string>` (parsed deltas). |
| `components/ai-assist-button.tsx` | Reusable ✨ button + popover. Props: `endpoint`, `payload(sourceText)`, `onAppend(text)`. Shows skeleton while waiting, lets admin stop generation, has retry. |
| `components/ai-assist-field.tsx` | Drop-in `<Textarea>` wrapper: standard textarea + ✨ button that generates into the field. Used in product description and banner copy. |
| Update `dashboard/products/ProductPage.tsx` | Add ✨ next to the `description` textarea. On click: send `{ name, category, material, purity, price, shortSpec }` → stream into the textarea. |
| Update `dashboard/banners/*` (future) | Same component on banner description. |
| New `dashboard/product-faqs/page.tsx` | "Generate 5 FAQs" button on the create drawer (see Feature A). |
| Update `dashboard/settings/page.tsx` | Show AI config status (provider, model, daily tokens used) — read-only display. |

### 3.7 Prompt templates (sketch — to be tuned)

```
SYSTEM:
You are a senior e-commerce copywriter for a jewellery store. Output in the same language as the user input. No emojis. No claim you cannot substantiate. Keep facts conservative.

USER (productDescriptionPrompt):
Product name: {{name}}
Category: {{category}} / {{subCategory}} / {{subSubCategory}}
Material: {{material}}; Purity: {{purity}}; Price: ₹{{price}}
Short spec from admin: {{sourceText}}

Write a 3-paragraph product description: (1) occasion and wearer, (2) design details, (3) care and styling. 120–180 words total. No bullet points.
```

For FAQ: ask for a JSON array `[{ q, a }]` of 3–5 entries. Use the SDK's `generationConfig.responseMimeType: "application/json"` and `responseSchema` (Gemini supports this) so we get strict JSON; OpenRouter's Gemini passthrough supports it too.

### 3.8 Safety & abuse

- Hard cap input length: 4 000 chars for `sourceText`, 8 000 chars for total prompt.
- Strip control chars; reject if input is empty after trim.
- Strip API error details before returning to client — log full, return generic.
- Set `safetySettings` on Gemini: `BLOCK_ONLY_HIGH` for marketing copy (less false-positive blocking) while still CYA-ing for harassment / dangerous content.

### 3.9 Cost / usage tracking (admin-only view)

A small card on `dashboard/settings`:
- Tokens used today / this month
- Top 5 endpoints by token use
- Cache hit rate

Backed by the `aiUsage` collection.

### 3.10 Workflow (admin)

1. Admin opens product create/edit drawer.
2. Fills name, category, material, price, short spec.
3. Clicks ✨ next to description → modal shows streaming progress → admin can **stop** or **insert** (replaces textarea, doesn't auto-commit).
4. Hits Save normally.
5. `productDescription` writes go to Mongo as before; no AI call on read.

---

## 4. Feature C — Dynamic Home Page Content Manager

### 4.1 Today's pain

`web/src/app/page.js` is a hardcoded RSC that imports 8 sections in fixed order. Adding/reordering/disabling a section requires a deploy. We want admins to:

- Reorder sections (drag-and-drop).
- Toggle a section on/off without deploy.
- Edit section-specific copy (banner headline, "Why Choose Us" copy, section headings) from the admin panel.
- Have the web app reflect changes within ~60 s.

### 4.2 Data Model — `api/src/models/homePage.ts`

```ts
const sectionSchema = new Schema(
  {
    key:    { type: String, required: true, unique: true },   // "banner", "menWomen", "tabProducts", ...
    label:  { type: String, required: true },                  // shown in admin UI
    enabled:{ type: Boolean, default: true },
    order:  { type: Number, default: 0, min: 0, max: 1000 },
    config: { type: Schema.Types.Mixed, default: {} },         // per-section config (see 3.3)
  },
  { timestamps: true },
);

const homePageSchema = new Schema(
  {
    sections: { type: [sectionSchema], default: [] },
    version:  { type: Number, default: 1 },                    // bump on every admin write
  },
  { timestamps: true },
);
```

A single document (singleton) holds the entire home-page layout. We use `Schema.Types.Mixed` for `config` so each section can carry its own typed payload.

### 4.3 Per-section config shape

The eight sections currently in `page.js`, each with a typed config:

| `key` | label | Config shape |
|-------|-------|--------------|
| `banner` | Banner Carousel | `{ heading?: string }` (banner images come from existing `banners` collection — no change) |
| `roundCategory` | Round Category Slider | `{}` (uses Redux `ui.navigation`) |
| `menWomen` | Men & Women Hero | `{ menHeading?: string; womenHeading?: string }` |
| `shopByPrice` | Shop By Price | `{ tiers?: { label: string; min: number; max: number }[] }` (replaces hardcoded tiers) |
| `tabProducts` | Silver / Gold / Gift Tabs | `{ defaultTab?: "silver"\|"gold"\|"gift" }` |
| `whyChooseUs` | Why Choose Us | `{ heading?: string }` (items come from `whyChooseUs` collection — no change) |
| `newArrivals` | New Arrivals Slider | `{ heading?: string }` |
| `bestSellers` | Best Sellers Slider | `{ heading?: string }` |
| `productsTab` | Earrings / Necklaces / Bracelets Tabs | `{ tabs?: { label: string; search: string }[] }` |
| `trending` | Trending Products Slider | `{ heading?: string }` |
| `testimonial` | Testimonials | `{ heading?: string }` |
| `fullVideo` | Full-Width Video | `{ url?: string; poster?: string }` (fixes the missing import too) |

This is additive — existing data sources (`banners`, `whyChooseUs`, `testimonials`, `tabProducts`, etc.) keep working.

### 4.4 Seed

On first read, if the singleton doesn't exist, create it with the current hardcoded order and empty configs. The admin's first save promotes a draft (see 3.5).

### 4.5 Draft vs Published

Two strategies, pick one:
- **Simple (v1, recommended)**: One document, no drafts. Save = live. Mitigate mistakes with `version` (server keeps last 20 versions in `homePageVersions` for one-click restore).
- **Drafts (v2)**: Add `draft` subdocument; admin edits draft, clicks "Publish" to swap into the live doc. More UI, more controllers.

Going with the simple path for v1; the `version` field + `homePageVersions` collection gives us an undo safety net without a full drafts system.

### 4.6 API surface

#### Admin (`api/src/routes/admin/homePage.routes.ts`)
```
GET    /api/admin/home-page/get            -> full config + version
PUT    /api/admin/home-page/update         -> body { sections: [{ key, enabled, order, config }] }
POST   /api/admin/home-page/reorder        -> body: [{ key, order }]  (lightweight, no config change)
PUT    /api/admin/home-page/update-section -> body: { key, enabled?, config? }  (single-section edit)
GET    /api/admin/home-page/versions       -> last 20 versions
POST   /api/admin/home-page/restore/:version
```

#### Web (`api/src/routes/web/homePage.routes.ts`) — public
```
POST /api/website/home-page/get
       -> returns only enabled sections, sorted by order, plus version
```
Cache key: `homePage:v<version>` so a new version automatically bypasses stale cache; manual `cache.del("homePage")` on every admin write as belt-and-braces.

### 4.7 Admin UI

New route `admin-panel/app/dashboard/home-page/page.tsx`:

- **Section list** on the left:
  - Drag-and-drop to reorder (`@dnd-kit/core` — small dep, ~30 KB gzipped).
  - Toggle switch per row (uses existing Radix `Switch`).
- **Section editor** on the right:
  - Form rendered from the section's `config` schema. We will hand-roll one component per section type for v1 (8 sections × ~10 fields each, total ~300 lines of form UI).
  - Top-of-page **Preview** button: opens a `/preview/home-page?token=...` route in the admin app that renders the same components with a query-string override (no auth needed, time-limited token).
- **Top bar**: Save (writes new version), Undo (loads previous version into the editor without saving), Restore (rollback to any past version).

### 4.8 Customer render path

Refactor `web/src/app/page.js` to:

1. `const layout = await getHomeLayout()` → `POST /api/website/home-page/get` (server-side fetch, RSC).
2. Render sections in `layout.sections.filter(s => s.enabled).sort((a,b) => a.order - b.order)` using a switch on `section.key`.

Each section component gains an optional `config` prop. Existing behaviour (no `config` passed) is preserved 1:1 — i.e., this is a backwards-compatible refactor.

### 4.9 Caching & invalidation

- Web uses `next: { revalidate: 60 }` (ISR) for the home page — the 60-second window is the maximum staleness an admin ever sees after a Save. Acceptable for this kind of content.
- If we want instant publish, add an `revalidateTag('home')` on the server action and a webhook from `api` → `web` `POST /api/revalidate?tag=home&secret=...`. Defer until v2.

### 4.10 Workflow (admin)

1. Admin → `Dashboard → Home Page`.
2. Drags "Testimonials" above "Best Sellers".
3. Clicks "Best Sellers" → edits heading to "Most Loved Pieces" → saves section.
4. Hits top-bar "Save Layout" → API bumps version → next page load on `web` (≤ 60 s) shows the new layout.
5. Made a mistake? `Versions` tab → click any prior version → "Restore" → live.

---

## 5. Cross-cutting concerns

### 5.1 Environment variables (consolidated)

| Var | Used by | Purpose |
|-----|---------|---------|
| `GEMINI_API_KEY` | api | Direct Gemini auth (only provider for v1) |
| `GEMINI_MODEL` | api | Default `gemini-2.5-flash` |
| `AI_DAILY_TOKEN_BUDGET` | api | Optional hard ceiling for safety |

### 5.2 Dependencies to add

`api/package.json`:
- `@google/generative-ai` (Gemini — only AI provider for v1)

`admin-panel/package.json`:
- `@dnd-kit/core`, `@dnd-kit/sortable` (home page drag-and-drop)

No new deps in `web/` for v1 (existing details/summary tags + Accordion via plain `<details>` is enough for product FAQ). Add `@radix-ui/react-accordion` later if we want animated FAQ.

### 5.3 Cache invalidation map

| Write | Keys to `cache.del` |
|-------|---------------------|
| Banner create/update/delete/status | `bannerData` |
| Product FAQ create/update/delete/reorder/status | `productFaqs:<productId>` |
| Home page update/reorder/restore | `homePage` |
| AI generation (no user data) | none — writes to `aiCache` / `aiUsage` only |

### 5.4 Security

- AI keys live in `api/.env` only; never exposed to the browser.
- All admin endpoints require `protect` middleware (existing pattern).
- AI endpoints additionally require `aiRateLimit` middleware.
- Prompts: separate `system` from `user`; validate lengths; strip control chars.
- Free-tier key sharing is low risk (no PII), but we still log per-admin usage so abuse is detectable.
- Home-page `config` is `Mixed` — **always validate with Zod** on read AND write to prevent prototype-pollution and accidental overwrites (`z.record(z.unknown())` then narrow per section).

### 5.5 Testing

`api/` already has `@playwright/test` in devDeps but no `tests/` directory. Plan:
- Unit (Vitest? — not installed) → use plain `tsx` scripts in `api/src/__tests__/` for v1; defer Vitest setup.
- Integration (Playwright): one test per new admin route + the public home-page fetch.
- Manual: AI button smoke tests with a $0-budget key, verify cache hit on second call.

### 5.6 Shared types (note, not blocking)

`packages/shared-types` exists but is unused. For v1, define the new types in each consuming app the way the codebase already does (Mongoose `InferSchemaType` in api; ad-hoc `interface` in admin-panel; JSDoc in web). A follow-up task can migrate to the shared package.

---

## 6. Implementation Order (recommended)

Phased to land each feature independently without breaking main.

### Phase 1 — Foundations (no UX changes)
1. Extend `banner` model with `link`, `status`, `order` (api) — see §1.3.
2. Add `bannerUrl.ts` resolver (api) — see §1.4.
3. Add `link-options` endpoints for the cascading dropdowns (api).
4. Add `aiUsage`, `aiCache` collections (api).
5. Add `productFaqs` model + admin controller + routes (api).
6. Add `homePage` model + admin controller + routes (api).
7. Wire env Zod schema additions (api).
8. Wire cache invalidation (`bannerData`, `productFaqs:<id>`, `homePage`).

### Phase 2 — AI Provider (Gemini only)
1. `lib/ai/provider.ts` with single-provider `generateText()` (Gemini via `@google/generative-ai`).
2. `controller/admin/ai.controller.ts` with one endpoint (product description) — the others reuse the same plumbing.
3. SSE streaming end-to-end with cache + usage logging.

### Phase 3 — Admin UI
1. Extend `dashboard/banners/*` drawer form with the link-type cascading dropdown + resolved-URL preview (api-backed).
2. `dashboard/product-faqs/page.tsx` + ✨ button (uses AI endpoint for "generate FAQs").
3. `dashboard/home-page/page.tsx` with reorder + section editor.
4. ✨ button on `dashboard/products/ProductPage.tsx` description field.

### Phase 4 — Customer UI
1. `web/src/components/ui/images-slider.jsx` — accept `slides: { src, href?, external? }[]`; navigate per-slide; honour external.
2. `web/src/app/(sections)/Banner.jsx` — pass `slides` instead of `images`.
3. `ProductDetail.jsx` — render FAQ `<details>` list + JSON-LD.
4. `web/src/app/page.js` — switch to layout-driven render; ensure no visual regression vs current hardcoded version.

### Phase 5 — Hardening
1. Admin settings page shows AI usage stats.
2. Rate limits, token budget enforcement.
3. End-to-end Playwright smoke tests.
4. Home page versions restore UI.

---

## 7. Quick-reference: files to create / modify

### Create (api)
- `src/models/productFaq.ts`
- `src/models/homePage.ts`
- `src/models/aiUsage.ts`
- `src/models/aiCache.ts`
- `src/lib/bannerUrl.ts` — server-side URL resolver for the clickable banner
- `src/controller/admin/adminProductFaq.controller.ts`
- `src/controller/admin/homePage.controller.ts`
- `src/controller/admin/ai.controller.ts`
- `src/controller/admin/bannerLinkOptions.controller.ts` — `link-options/products|categories|sub-categories|sub-sub-categories`
- `src/lib/ai/provider.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/cache.ts`
- `src/lib/ai/usage.ts`
- `src/middleware/aiRateLimit.ts`
- `src/routes/admin/adminProductFaq.routes.ts`
- `src/routes/admin/homePage.routes.ts`
- `src/routes/admin/ai.routes.ts`

### Modify (api)
- `src/models/banner.ts` — add `link`, `status`, `order` (see §1.3).
- `src/controller/admin/adminBanner.controller.ts` — call `resolveBannerLink` on save; expose `status`/`order`; `cache.del("bannerData")` after writes.
- `src/routes/admin/adminBanner.routes.ts` — extend body schema; mount `link-options` endpoints (or new `adminBannerLinkOptions.routes.ts`).
- `src/config/env.ts` — add `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_DAILY_TOKEN_BUDGET` (no OpenRouter).
- `src/routes/admin/adminProduct.routes.ts` — extend `details` to also return `faqs`.
- `src/routes/web/product.routes.ts` — extend `details` to return FAQs.

### Create (admin-panel)
- `app/dashboard/product-faqs/page.tsx`
- `app/dashboard/home-page/page.tsx`
- `app/dashboard/banners/BannerLinkField.tsx` — cascading dropdown + resolved-URL preview
- `components/ai-assist-button.tsx`
- `components/ai-assist-field.tsx`
- `lib/ai.ts`

### Modify (admin-panel)
- `app/dashboard/banners/BannerPage.tsx` (or wherever the drawer lives) — render `<BannerLinkField>` in the form; new "Link" column in the list table.
- `app/dashboard/products/ProductPage.tsx` — ✨ on description.
- `components/sidebar.tsx` — add nav entries (Product FAQs, Home Page).
- `app/dashboard/settings/page.tsx` — AI usage card (optional v1).

### Modify (web)
- `src/components/ui/images-slider.jsx` — accept `slides: { src, href?, external? }[]`; navigate per-slide; honour external.
- `src/app/(sections)/Banner.jsx` — pass `slides` instead of `images`.
- `src/app/(pages)/product-details/[slug]/ProductDetail.jsx` — FAQ `<details>` list + JSON-LD.
- `src/app/page.js` — layout-driven render.
- `src/components/home/<SectionName>.jsx` — accept optional `config` prop.

---

## 8. Decisions log (resolved questions)

These were open questions in the previous draft. They are now resolved (see the "Decisions locked in" table at the top of this document).

1. ~~AI provider default~~ → **Gemini direct only.**
2. ~~Home page drafts~~ → **No drafts in v1.**
3. ~~Home page publish speed~~ → **60-second ISR window.**
4. ~~Product FAQ rendering~~ → **Plain `<details>/<summary>`.**
5. ~~Home page sections config~~ → **Zod schemas from day 1.**
6. ~~AI in banner + SEO features~~ → **Description + FAQ only in v1.**
7. ~~Banner clickable?~~ → **Yes — see §1.**