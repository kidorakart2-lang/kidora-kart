# UI Design Review — Jewel Box

Source: `D:\side-projects\websites\jewelbox\ui\` (12 files: PNG + PDF exports of the same screens).

Status: reviewed in full. Implementation plan in §6.

---

## 1. What is in the set

The files are **two design concepts** from two template families:

| Family | Files | Aesthetic |
|---|---|---|
| **"Royal Jewellers"** (Indian gold / bridal) | `Homepage v2`, `shop by category` | Deep plum + gold, paisley ornament, Indian bridal editorial |
| **"PearlGem"** (Western diamond retail) | `07 Product Listing`, `09 Product Details`, `12 My Cart`, `13 Select Address`, `16 Review Order`, `Footer` | Rose/mauve accent on cream, clean Shopify-style IA with filters, steppers, bulk cart actions |

`Brand Colors.png` — the palette we're adopting — belongs to the **Royal Jewellers** family and is consistent across both.
`e-commers-1/2/3` are earlier homepage explorations (black/gold "Lumière", blush/rose "Aurelia", burgundy "Élanora") — reference only, not the target.

**Direction:** adopt the Royal Jewellers aesthetic + Brand Colors palette as the Jewel Box design system (it fits the Jodhpur Indian-jewellery positioning far better than the rose PearlGem look), but borrow PearlGem's **information architecture** — filters, stepper, bulk cart actions — since it is the more complete retail UX.

---

## 2. Brand palette (extracted from `Brand Colors.png`)

Sampled at swatch centers of `Brand Colors.png` via pixel sampling:

| Token | Hex | Role |
|---|---|---|
| Deep plum | `#3E2739` | Primary dark — dark sections, headings, footer |
| Gold / champagne | `#C6A875` | Primary accent — CTAs, dividers, eyebrow labels, icons |
| Cream | `#FAF7F3` | Page background |
| Mauve rose | `#B995A5` | Secondary accent / sale prices |
| Dusty rose | `#D9C8CE` | Tinted surfaces, washes |
| Black | `#000000` | Body text |
| Lavender-grey | `#E8E3E4` | Borders, muted image tiles |

This replaces the previous wine (`#8b1e3f`) / blush palette in `web/src/app/globals.css`.

---

## 3. Shared design language

- **Playfair-style high-contrast serif** for wordmark + headings, always with **one italic accent word set in gold** — "A Touch of *Royalty*.", "A Collection for *Every Occasion*", "Loved by *Our Customers*", "Worth *Treasuring*."
- **Eyebrow labels** — small-caps, wide letter-spacing, gold, prefixed with a `✦` sparkle glyph.
- **Paisley / mandala ornamental bands** across the top of dark sections — the strongest Indian signature in the set.
- **Arched and circle-masked imagery** (temple arches, medallion crops).
- **Frosted-glass stacked cards** for category promos over dark grounds.
- **Every section is a carousel** — hero, categories, bestsellers, reviews, similar products — with circular prev/next arrows.
- **Trust strip** with line icons: Free Shipping · 15 Days Returns · Customer Support · Flexible Payment.
- **Footer**: gold *italic* column heads, icon-led contact column, payment badge row, copyright bar.

---

## 4. Screen notes

### Homepage (Royal Jewellers)
Topbar phone/offer + EN/USD → cream header with serif wordmark + circular icon buttons → plum-gradient hero with italic headline split over two lines, gold pill CTA + outline secondary, dots/arrows → cream marquee strip → editorial split ("Not Just Jewellery. ✦ / A *Feeling That Lasts.*") → story collage → "Why Choose" 4 outlined cards → dark bestsellers with plum product cards (gold serif name, struck MRP, `View Product` pill) → "Jewellery in Motion" video grid + Instagram phone mockup → reviews cards on a paisley banner → black closing CTA band with paisley border → footer with giant "ROYAL" watermark with a gem glyph.

### Shop by category
Plum ground, gold paisley top border, frosted stacked cards (necklaces / rings) — the occasion-collection pattern.

### Product listing (PearlGem)
Left filter rail (Categories, "Ring by Diamond" gem shapes, price-range dual slider, size checkboxes — each with counts), grid/list toggle, filter button, sort dropdown, pagination `PREV ↗ 01 02 03 NEXT ↗`.
Product card: flat light-grey image tile, serif name, sale price in accent + struck original, colour dots, hover reveals ADD TO CART.

### Product detail (PearlGem)
Breadcrumb `HOME > SHOP > NAME`; gallery + thumbnail rail on model / on-hand shots; serif title; stars + review count; viewer count + low-stock urgency bar in red; "Selected Center Stone Shape" swatch row; **Ring Size dropdown**; qty stepper + ADD TO CART (solid) / BUY NOW (outline); SKU + Categories meta row; 3-icon trust row; compare / contact / shipping / share row; accordion descriptions; Reviews; Similar Products carousel.

### Cart (mobile)
Select-all checkbox + "2/2 Items Selected"; bulk delete / **Move to Wishlist**; per-item cards with colour, qty dropdown, "15 Days return available", "Delivered by Feb 25, 2025"; sticky summary (discount code field, taxes, FREE delivery, grand total, CHECKOUT); bottom tab nav.

### Select Address
3-step icon stepper (Address → Payment Method → Review); Default Address radio card with `HOME` type badge + phone; Other Address list; kebab menu; `+ ADD NEW ADDRESS`; inline grand-total summary.

### Review Order
Same stepper; items with QTY; Shipping Address + Payment Method rows each with a **pencil edit icon**; summary panel with graded totals; wide `PLACE ORDER`.

### Footer (PearlGem)
Mauve trust strip → "Let's Get In Touch!" newsletter → 4-column links + wordmark → copyright + payment badges.

---

## 5. Gap analysis against our codebase

Already covered: `Header` / `Footer`, hero, `ProductCard` / `VerticalProductCard`, category listing, PDP with image slider / zoom / variant / reviews / related / FAQ, cart page, checkout with address / payment / gift forms, `Bento*` layouts, `images-slider`, `BottomTabNavigation`, `AnnouncementBar`, `BrandLogo`.

Gaps that need new work:

1. **Palette swap** — wine `#8b1e3f` → plum `#3E2739` / gold `#C6A875` / cream `#FAF7F3` / mauve `#B995A5` / dusty rose `#D9C8CE`. Highest leverage: one token pass in `globals.css` updates the whole site.
2. **Paisley ornamental border asset** + arched-mask utility.
3. **New homepage sections** — marquee, editorial split, story collage, Why-Choose cards, dark bestsellers, video / Instagram grid, reviews carousel, closing CTA band.
4. **Listing filter rail** — gem-shape facet, price dual slider, size-with-counts, grid/list toggle, numbered pagination.
5. **Cart bulk actions** — select-all + move-to-wishlist.
6. **Address radio cards** with type badge / phone / kebab; **pencil-edit rows** on review order.
7. PDP additions — stone-shape swatches, ring-size select, SKU/categories meta, trust 3-up, compare/share row.

---

## 6. Implementation plan

| Phase | Scope | Key files |
|---|---|---|
| **1. Theme** | Swap `:root` / `.dark` tokens to plum-gold-cream; update `design.md`; add paisley + arch utilities | `web/src/app/globals.css`, `web/src/docs/design.md` |
| **2. Homepage** | Rebuild `page.tsx` into Royal Jewellers sections with real API data | `web/src/app/page.tsx`, `web/src/components/home/*` |
| **3. Listing** | Filter rail + facets + grid/list toggle + numbered pagination | `web/src/app/(pages)/category/[...slug]/page.tsx` |
| **4. PDP** | Stone-shape swatches, ring-size select, SKU/categories meta, trust row, compare/share | `web/src/app/(pages)/product-details/[slug]/page.tsx` |
| **5. Cart** | Select-all + move-to-wishlist bulk actions | `web/src/components/cart/CartItemRow.tsx`, cart page |
| **6. Checkout** | Address radio cards w/ badges; pencil-edit rows on review | `web/src/components/checkout/*`, `web/src/app/(pages)/checkout/page.tsx` |
| **7. Verify** | Typecheck all packages; dev-server visual pass per screen | — |