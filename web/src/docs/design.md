# Design System — Jewel Box

> **Theme-swap target**: Change only the CSS variable values in `globals.css` `:root` / `.dark` blocks to re-skin the entire site.

**Brand mood**: cream (`#faf7f3`) surfaces, deep plum (`#3e2739`) CTAs and headings, champagne gold (`#c6a875`) accents, mauve/dusty-rose secondary tones, paisley ornament + Playfair Display serif. Palette sourced from the `ui/Brand Colors.png` mockup — see `docs/ui-design-review.md`.

---

## 1. Brand Palette → CSS Variables

These are the **only** values that need to change for a full re-skin.

### Light Mode (`:root`)

| Token | Current Value | Role |
|---|---|---|
| `--brand-primary` | `#3e2739` (deep plum) | Primary CTAs, headings |
| `--brand-primary-foreground` | `#faf7f3` (cream) | Text on primary bg |
| `--brand-primary-dark` | `#2e1b29` | Hover states |
| `--brand-secondary` | `#c6a875` (gold) | Secondary CTAs, accents |
| `--brand-secondary-foreground` | `#2a1e27` | Text on secondary bg |
| `--brand-gradient-from` | `#3e2739` | Gradient start |
| `--brand-gradient-to` | `#6b4a62` | Gradient end |
| `--brand-section-bg` | `#f2e9ed` | Alternating section bg |
| `--brand-section-bg-subtle` | `#f2e9ed80` | Subtle section tint |

### Core palette tokens (Brand Colors.png)

| Token | Value | Role |
|---|---|---|
| `--brand-plum` | `#3e2739` | Primary dark, headings |
| `--brand-cream` | `#faf7f3` | Page background |
| `--brand-gold` | `#c6a875` | Accent, eyebrow labels, ornament |
| `--brand-gold-dark` | `#a8874f` | Gold text on light bg (contrast) |
| `--brand-mauve` | `#b995a5` | Secondary accent, sale prices |
| `--brand-rose` | `#d9c8ce` | Tinted surfaces |
| `--brand-surface` | `#e8e3e4` | Borders, muted tiles |
| `--brand-ink` | `#2a1e27` | Body text |

### Card Accent Palette (multi-card sections)

| Token | Current Value |
|---|---|
| `--brand-card-1-bg` | `#f7f0e3` ~gold |
| `--brand-card-1-icon` | `#a8874f` |
| `--brand-card-1-ring` | `#e5d5b0` |
| `--brand-card-2-bg` | `#f1e9ee` ~plum |
| `--brand-card-2-icon` | `#3e2739` |
| `--brand-card-2-ring` | `#d9c8ce` |
| `--brand-card-3-bg` | `#f5edef` ~mauve |
| `--brand-card-3-icon` | `#8a6b7c` |
| `--brand-card-3-ring` | `#d9c8ce` |
| `--brand-card-4-bg` | `#faf1f3` ~dusty rose |
| `--brand-card-4-icon` | `#b995a5` |
| `--brand-card-4-ring` | `#edd9df` |
| `--brand-card-5-bg` | `#ede7e9` ~ink |
| `--brand-card-5-icon` | `#2a1e27` |
| `--brand-card-5-ring` | `#c9bcc2` |

### Price Card Gradients (ShopByPrice)

| Token | Current Value |
|---|---|
| `--brand-price-1-from` | `#6b4a62` (plum) |
| `--brand-price-1-via` | `#4e3349` |
| `--brand-price-1-to` | `#3e2739` |
| `--brand-price-2-from` | `#e5c88a` (gold) |
| `--brand-price-2-via` | `#d5b57e` |
| `--brand-price-2-to` | `#c6a875` |
| `--brand-price-3-from` | `#d9c8ce` (dusty rose) |
| `--brand-price-3-via` | `#c8acba` |
| `--brand-price-3-to` | `#b995a5` |
| `--brand-price-4-from` | `#4a3a46` (ink) |
| `--brand-price-4-via` | `#362731` |
| `--brand-price-4-to` | `#241621` |

### Design-language utilities (globals.css)

| Class | Purpose |
|---|---|
| `.eyebrow` | Uppercase, wide-tracked gold label with `✦` prefix |
| `.display-heading` | Playfair serif heading in plum |
| `.accent-italic` | Gold Playfair italic accent word inside a heading |
| `.gold-rule` | Small gold divider line |
| `.paisley-band` | Ornamental SVG band (`/images/paisley-band.svg`) for dark sections |
| `.paisley-field` | Low-opacity paisley line-art field (`/images/paisley-pattern.svg`) |
| `.arch-top` | Temple-arch mask (semicircle top) for portrait imagery |
| `.frosted-card` | Frosted-glass promo card for dark grounds |
| `.marquee-track` | Infinite horizontal scroll strip |

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
