# Design System — Jewel Box

> **Theme-swap target**: Change only the CSS variable values in `globals.css` `:root` / `.dark` blocks to re-skin the entire site.

**Brand mood**: soft blush & cream surfaces, deep wine (`#8b1e3f`) CTAs, gold / emerald / rose gem accents, Playfair Display serif for the wordmark and display type.

---

## 1. Brand Palette → CSS Variables

These are the **only** values that need to change for a full re-skin.

### Light Mode (`:root`)

| Token | Current Value | Role |
|---|---|---|
| `--brand-primary` | `#8b1e3f` (wine) | Primary CTAs, headings |
| `--brand-primary-foreground` | `#ffffff` | Text on primary bg |
| `--brand-primary-dark` | `#6e1531` | Hover states |
| `--brand-secondary` | `#c24a68` (rose) | Secondary CTAs |
| `--brand-secondary-foreground` | `#ffffff` | Text on secondary bg |
| `--brand-accent` | `#f9e7e3` (blush) | Accent highlights |
| `--brand-accent-foreground` | `#6e1531` | Text on accent bg |
| `--brand-gradient-from` | `#8b1e3f` | Gradient start |
| `--brand-gradient-to` | `#b8446a` | Gradient end |
| `--brand-section-bg` | `#fbece7` | Alternating section bg |
| `--brand-section-bg-subtle` | `#fbece780` | Subtle section tint |

### Card Accent Palette (multi-card sections)

| Token | Current Value |
|---|---|
| `--brand-card-1-bg` | `#fdf6e7` ~gold |
| `--brand-card-1-icon` | `#b98a2e` |
| `--brand-card-1-ring` | `#ecd9a6` |
| `--brand-card-2-bg` | `#fce9ee` ~wine |
| `--brand-card-2-icon` | `#a32a4b` |
| `--brand-card-2-ring` | `#f3c6d1` |
| `--brand-card-3-bg` | `#eef8f3` ~emerald |
| `--brand-card-3-icon` | `#2f7d5f` |
| `--brand-card-3-ring` | `#c3e3d5` |
| `--brand-card-4-bg` | `#f7f0f8` ~mauve |
| `--brand-card-4-icon` | `#8f5f8e` |
| `--brand-card-4-ring` | `#e3cfe3` |
| `--brand-card-5-bg` | `#fdeff1` ~rose |
| `--brand-card-5-icon` | `#cf325c` |
| `--brand-card-5-ring` | `#f8cdd6` |

### Price Card Gradients (ShopByPrice)

| Token | Current Value |
|---|---|
| `--brand-price-1-from` | `#f4adbd` (blush) |
| `--brand-price-1-via` | `#ec7f99` |
| `--brand-price-1-to` | `#c24a68` |
| `--brand-price-2-from` | `#f5d78e` (gold) |
| `--brand-price-2-via` | `#e6b450` |
| `--brand-price-2-to` | `#b98a2e` |
| `--brand-price-3-from` | `#c24a68` (wine) |
| `--brand-price-3-via` | `#a32a4b` |
| `--brand-price-3-to` | `#8b1e3f` |
| `--brand-price-4-from` | `#7fc7a5` (emerald) |
| `--brand-price-4-via` | `#45a37d` |
| `--brand-price-4-to` | `#2f7d5f` |

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
