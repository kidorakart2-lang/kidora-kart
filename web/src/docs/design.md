# Design System — Kidora Kart

> **Theme-swap target**: Change only the CSS variable values in `globals.css` `:root` / `.dark` blocks to re-skin the entire site.

---

## 1. Brand Palette → CSS Variables

These are the **only** values that need to change for a full re-skin.

### Light Mode (`:root`)

| Token | Current Value | Role |
|---|---|---|
| `--brand-primary` | `#d97706` (amber-600) | Primary CTAs, headings |
| `--brand-primary-foreground` | `#ffffff` | Text on primary bg |
| `--brand-primary-dark` | `#b45309` (amber-700) | Hover states |
| `--brand-secondary` | `#e11d48` (rose-600) | Secondary CTAs |
| `--brand-secondary-foreground` | `#ffffff` | Text on secondary bg |
| `--brand-accent` | `#ec4899` (pink-500) | Accent highlights |
| `--brand-accent-foreground` | `#ffffff` | Text on accent bg |
| `--brand-gradient-from` | `#d97706` (amber-600) | Gradient start |
| `--brand-gradient-to` | `#b45309` (amber-700) | Gradient end |
| `--brand-section-bg` | `#f8f8f8` | Alternating section bg |
| `--brand-section-bg-subtle` | `#f8f8f850` | Subtle section tint |

### Card Accent Palette (multi-card sections)

| Token | Current Value |
|---|---|
| `--brand-card-1-bg` | `oklch(0.98 0.04 85)` ~amber-50 |
| `--brand-card-1-icon` | `oklch(0.55 0.15 45)` ~amber-700 |
| `--brand-card-1-ring` | `oklch(0.88 0.08 85)` ~amber-200 |
| `--brand-card-2-bg` | `oklch(0.98 0.04 10)` ~rose-50 |
| `--brand-card-2-icon` | `oklch(0.55 0.18 25)` ~rose-600 |
| `--brand-card-2-ring` | `oklch(0.88 0.08 10)` ~rose-200 |
| `--brand-card-3-bg` | `oklch(0.98 0.04 160)` ~emerald-50 |
| `--brand-card-3-icon` | `oklch(0.55 0.15 160)` ~emerald-600 |
| `--brand-card-3-ring` | `oklch(0.88 0.08 160)` ~emerald-200 |
| `--brand-card-4-bg` | `oklch(0.98 0.04 300)` ~purple-50 |
| `--brand-card-4-icon` | `oklch(0.55 0.15 300)` ~purple-600 |
| `--brand-card-4-ring` | `oklch(0.88 0.08 300)` ~purple-200 |

### Price Card Gradients (ShopByPrice)

| Token | Current Value |
|---|---|
| `--brand-price-1-from` | `#fbbf24` (amber-400) |
| `--brand-price-1-via` | `#eab308` (yellow-500) |
| `--brand-price-1-to` | `#d97706` (amber-600) |
| `--brand-price-2-from` | `#c084fc` (purple-400) |
| `--brand-price-2-via` | `#d946ef` (fuchsia-500) |
| `--brand-price-2-to` | `#9333ea` (purple-600) |
| `--brand-price-3-from` | `#fb7185` (rose-400) |
| `--brand-price-3-via` | `#ec4899` (pink-500) |
| `--brand-price-3-to` | `#e11d48` (rose-600) |
| `--brand-price-4-from` | `#34d399` (emerald-400) |
| `--brand-price-4-via` | `#14b8a6` (teal-500) |
| `--brand-price-4-to` | `#059669` (emerald-600) |

---

## 2. Component Color Roles

| Role | Applies To | Uses |
|---|---|---|
| **Primary CTA** | Buttons, links, active states | `--brand-primary` |
| **Section Heading** | All section titles | `--brand-primary` via `.section-heading` |
| **Section Bg** | Alternating section bg | `--brand-section-bg` via `.bg-section` |
| **Card Accents** | WhyChooseUs icons, rings | `--brand-card-*` vars |
| **Price Cards** | ShopByPrice gradients | `--brand-price-*` vars |
| **Testimonial CTA** | Carousel action buttons | `--brand-gradient-*` |
| **Banner CTA** | Hero buttons | `--brand-secondary` |

---

## 3. Utility Classes (in `globals.css`)

| Class | Purpose |
|---|---|
| `.section-container` | Max-w, mx-auto, responsive padding |
| `.section-heading` | Title: serif, brand color, consistent size |
| `.section-subheading` | Subtitle: muted, smaller |
| `.hover-lift` | `translateY(-2px)` + shadow bump |
| `.hover-glow` | `box-shadow` color pulse on hover |
| `.hover-underline` | Animated underline from center |
| `.bg-section` | Background using `--brand-section-bg` |
| `.bg-section-subtle` | Background using `--brand-section-bg-subtle` |

---

## 4. Typography

### Font Family

| Level | Font | Size | Weight Variable | Tailwind Class |
|---|---|---|---|---|
| Section heading | `--font-sans` (Lato) | `text-3xl` md:`text-4xl` | `--font-heading` | `.fw-heading` |
| Card title | `--font-sans` | `text-lg` | `--font-heading` | `.fw-heading` |
| Body | `--font-sans` | `text-base` | `--font-body` | `.fw-body` |
| Small/meta | `--font-sans` | `text-sm` | `--font-body` | `.fw-body` |
| CTA / Button | `--font-sans` | `text-sm` | `--font-cta` | `.fw-cta` |

### Font Weight Tokens per Theme

| Token | minimal | brown | monochrome |
|---|---|---|---|
| `--font-heading` | 300 (light) | 400 (normal) | 600 (semibold) |
| `--font-body` | 300 (light) | 400 (normal) | 400 (normal) |
| `--font-cta` | 400 (normal) | 500 (medium) | 600 (semibold) |

### Typography Personality per Theme

| Theme | Style | Description |
|---|---|---|
| **minimal** | Airy, elegant | Light weights throughout, spacious feel |
| **brown** | Warm, readable | Normal weights, inviting and approachable |
| **monochrome** | Bold, editorial | Semibold headings, high-contrast impact |

---

## 5. Hover Effect Levels

| Level | Class | Transform | Shadow | Best For |
|---|---|---|---|---|
| Subtle | `hover-lift` | `-translateY(2px)` | `shadow-md` → `shadow-lg` | Cards, grid items |
| Medium | `hover-glow` | none | coloured shadow pulse | CTAs, price cards |
| Strong | `hover-lift` + `hover-glow` | `-translateY(4px)` | coloured glow + shadow | Featured items |

---

## 6. shadcn/ui Component Usage

Prefer shadcn/ui primitives over raw elements wherever possible:

| shadcn Component | Replaces | Usage Notes |
|---|---|---|
| `Card`, `CardHeader`, `CardContent` | Raw `.rounded-2xl` divs | All card-based sections (WhyChooseUs, ShopByPrice, etc.) |
| `Button` | Raw `<button>` | Use `variant="default"` (brand primary) or `variant="outline"` for CTAs |
| `Badge` | Styled `<span>` | Product badges, price labels |
| `Avatar`, `AvatarImage`, `AvatarFallback` | Raw `<img>` | Testimonial avatars, category icons |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tab logic | ProductsTab, TabProducts |
| `Separator` | Raw `<hr>` / border divs | Section dividers |
| `Skeleton` | Loading placeholder divs | Loading states |
| `Sheet` | Drawer/panel | Cart sidebar, mobile nav |

**Theme-swap**: shadcn primitives automatically inherit CSS variables from `globals.css` — no extra styling needed.

---

## 7. Section Layout Tokens

| Token | Value |
|---|---|
| Section max-width | `max-w-7xl` |
| Section x-padding | `px-4` |
| Section y-padding | `py-6` md:`py-10` |
| Card border radius | `rounded-2xl` |
| Container class | `max-w-7xl mx-auto px-4` |
