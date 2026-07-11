# Web Development Guidelines — Kidora Kart

## Project Structure

```
web/src/
├── app/
│   ├── (pages)/          # Route pages (category, product-details, faq, etc.)
│   │   └── [...slug]/
│   ├── (sections)/        # Homepage section components
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── comman/            # Shared layout components (Header, Footer, etc.)
│   ├── product/           # Product-specific components
│   └── ui/                # shadcn/ui primitives + custom UI components
├── docs/                  # Project documentation
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, API helpers, site config
├── redux/                 # Redux store, slices
└── types/                 # TypeScript type definitions
```

---

## Design System

All brand colors are defined as CSS custom properties in `globals.css`.

### To re-skin the entire site:
Change only the `:root` and `.dark` CSS variable blocks in `globals.css`. Do **not** touch individual components.

### Available utility classes:

| Class | Purpose |
|---|---|
| `.section-container` | Max-w, mx-auto, responsive section padding |
| `.section-heading` | Standard section title style |
| `.section-subheading` | Section subtitle style |
| `.bg-section` / `.bg-section-subtle` | Alternating section backgrounds |
| `.hover-lift` | Subtle card hover lift effect |
| `.hover-glow` | Glow effect on hover |
| `.bg-gradient-brand` | Brand gradient background |
| `.text-gradient-brand` | Brand gradient text |

See `web/src/docs/design.md` for the full token reference.

---

## How to Create a Section Component

### 1. File location
Place homepage sections in `web/src/app/(sections)/`. Route pages go in `web/src/app/(pages)/`.

### 2. Use CSS variables, not hardcoded colors
```tsx
// ❌ Bad
<div className="bg-amber-600 text-white" />

// ✅ Good
<div className="bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]" />

// ✅ Best — use utility classes
<section className="bg-section">
  <h2 className="section-heading">Title</h2>
</section>
```

### 3. Use shadcn/ui primitives
```tsx
// ❌ Bad
<div className="rounded-2xl shadow-md p-6">...</div>

// ✅ Good
import { Card, CardContent } from "@/components/ui/card"
<Card>
  <CardContent>...</CardContent>
</Card>
```

### 4. Hover effects
```tsx
// Subtle lift
<div className="hover-lift">...</div>

// Glow effect
<Button className="hover-glow">CTA</Button>

// Combined for featured items
<div className="hover-lift hover-glow">...</div>
```

### 5. Typography
```tsx
// Section heading — uses --font-heading (varies per theme)
<h2 className="section-heading">Collection Name</h2>

// Or use fw-heading directly
<h2 className="text-3xl fw-heading text-foreground">Title</h2>

// Subheading — uses --font-body
<p className="section-subheading">Description</p>

// Card title
<h3 className="text-lg fw-heading">Card Title</h3>

// CTA / Button — uses --font-cta
<button className="btn-gradient fw-cta">Shop Now</button>
```

**Font weight utility classes:**

| Class | CSS Variable | Purpose |
|---|---|---|
| `.fw-heading` | `--font-heading` | Headings, titles, section names |
| `.fw-body` | `--font-body` | Body text, descriptions, subtitles |
| `.fw-cta` | `--font-cta` | Buttons, CTAs, action labels |

**Never use hardcoded `font-light`, `font-semibold`, or `font-bold`** — always use `.fw-heading`, `.fw-body`, or `.fw-cta` so weights change with the active theme.

### 6. Container pattern
```tsx
<section className="bg-section">
  <div className="section-container">
    {/* content */}
  </div>
</section>
```

---

## How Sections Work

Homepage sections are rendered dynamically by `DynamicSections.tsx`, which reads configuration from the admin panel API. Each section component receives props matching its admin-panel configuration.

### Adding a new section type:
1. Create the component in `web/src/app/(sections)/`
2. Register it in `DynamicSections.tsx` by adding it to the section type map
3. Create the admin UI in `admin-panel/app/dashboard/home-page/`
4. Add the section type to the API controller in `api/src/controller/admin/homePage.controller.ts`

---

## State Management

- **Redux Toolkit** for global state (cart, wishlist, auth, UI)
- **Redux Persist** for localStorage persistence
- Do **not** use Redux for server state — use direct API calls or TanStack Query

---

## API Calls

- All API requests go through the backend proxy at `web/src/proxy.ts`
- The proxy handles auth cookie forwarding, CSRF tokens, and error normalization
- Never call the backend URL directly — use relative `/api/...` paths

---

## Styling Rules

1. **No hardcoded brand colors** — always use CSS variables or utility classes
2. **No inline styles** for colors, backgrounds, or gradients
3. **No `amber-*`, `rose-*`, `orange-*`, `yellow-*`** in component files — use `var(--brand-*)` instead
4. **No `gray-*`, `blue-*`, `slate-*`, `indigo-*`, `cyan-*`, `teal-*`** in component files — use shadcn semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-card`, etc.)
5. **No hardcoded font weights** — never use `font-light`, `font-semibold`, `font-bold` directly. Use `.fw-heading`, `.fw-body`, or `.fw-cta` so weights switch with the active theme
6. **Use Tailwind v4 arbitrary values** sparingly — prefer utility classes
7. **Dark mode** — test both themes; use `dark:` variants or CSS variable fallbacks
8. **Verify with build** — always run `npm run build` after color changes; the build will catch any issues

## Color mapping reference

| Tailwind color | CSS variable / token |
|---|---|
| `amber-*` | `--brand-*` |
| `rose-*` / `pink-*` | `--brand-accent-*` |
| `orange-*` / `yellow-*` | `--brand-*` |
| `gray-*` / `slate-*` | shadcn semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-card`, `bg-background`) |
| `blue-*` | `--brand-*` (use brand-50–950) |
| `purple-*` | `--brand-accent-*` |
| `red-*` for destructive | shadcn `--destructive` / `text-destructive` |
| `green-*` for success | `text-emerald-*` / `bg-emerald-*` / `border-emerald-*` |
