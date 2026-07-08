# Web Design Review — Summary

**Status**: Migration Complete — All Hardcoded Brand Colors Migrated to CSS variables.

---

## Problem Statement

The `web/` directory is a **Next.js jewellery shop** with **App Router, Tailwind CSS v4, and shadcn/ui** already installed. Despite having shadcn/ui and CSS variable infrastructure in `globals.css`, the actual components and sections **universally bypassed them** in favour of hardcoded Tailwind values. This made theme-swapping impossible without touching every single file.

## What Was Done

### Foundation
- `globals.css` expanded with full `--brand-*` and `--brand-accent-*` spectrums (50–950) in both `:root` and `.dark`
- Utility classes created: `.section-container`, `.section-heading`, `.section-subheading`, `.hover-lift`, `.hover-glow`, `.hover-underline`, `.bg-section`, `.bg-section-subtle`, `.bg-gradient-brand`, `.text-gradient-brand`, `.bg-price-1`–`4`, `.bg-card-accent-1`–`4`
- `design.md` created as full design token reference
- Brand CSS variables for primary, secondary, accent, gradients, section backgrounds, card accents, price cards

### Sections Migrated
All section components migrated to CSS variables, including `Header` (~65 refs), `Footer`, `WhyChooseUs`, `ShopByPrice`, `Testimonial`, `TabProducts`, `ProductsTab`, `Slider`, `RoundCategorySlider`, `MenWomen`, `DynamicSections`.

### Full Color Audit
All remaining files with hardcoded brand colors migrated — 14 low-effort files (1–3 refs) and 14 medium-effort files (4–10 refs). Only intentional exception: `ToolBar.tsx` uses social platform brand colors (Instagram, WhatsApp) since it represents external brands.

### UI Enhancement
- `OrderSuccess.tsx` — Complete redesign with celebration confetti, order timeline, item thumbnails, delivery address, payment info, gift message display.

## Completed

- Full `src/` non-theme color purge — zero `text-gray-*`, `bg-gray-*`, `border-gray-*`, `text-blue-*`, `bg-blue-*`, `text-slate-*`, `bg-slate-*` classes remain (~33 files, ~100+ refs eliminated).

### Phase 7: Final Hardcoded Color Sweep (July 2026)

Additional hardcoded colors found and fixed across 14 files:

**Slate/Gray→Theme tokens (6 files):**
- `TabProducts.tsx` — Silver tab active state `from-slate-700 to-slate-900` → `from-[var(--brand-700)] to-[var(--brand-900)]`
- `About.tsx` — Background `from-gray-50 via-white to-gray-100` → `from-muted/30 via-background to-muted/30`; divider `from-gray-600 to-gray-400` → `from-muted-foreground to-muted`
- `Story.tsx` — Same bg gradient fix as About
- `Wishlist.tsx`, `GuestWishlist.tsx`, `Cart.tsx` — Image bg `to-slate-50` → `to-muted`

**Orange/Red→Theme (3 files):**
- `MyOrder.tsx` — Retry Payment `from-orange-500` → `btn-gradient`; Cancel dialog already uses `bg-destructive`
- `Track.tsx` — Payment-failed header `from-orange-500` → `from-[var(--brand-500)]`
- `Wishlist.tsx` — Out of Stock badge `to-red-600` → `to-destructive`

**Hardcoded hex values (3 files):**
- `OrderSuccess.tsx` — Framer Motion boxShadow `rgba(217, 119, 6, ...)` → runtime-resolved via `getComputedStyle(--brand-primary)` → hex-to-rgb → `rgba(${brandRgb}, ...)`
- `Track.tsx` / `Checkout.tsx` — Razorpay theme `"#dfbf0eff"` → computed from `--brand-primary` CSS var at runtime

**White→Theme (3 files):**
- `image-slider.tsx` — Navigation arrows `bg-white/80 hover:bg-white` → `bg-background/80 hover:bg-background`
- `RoundCategorySlider.tsx` / `GenderCategorySection.tsx` — Overlay text `text-white` → `text-background`

## Remaining Items

1. Define alternate theme CSS var block in `globals.css` for toy-shop re-skin.
2. Update `layout.tsx` meta theme-color — `siteConfig.themeColor` is already `#F58E00` with SSR fallback comment. Consider adding a `ClientThemeColor` component that reads `--brand-primary` at runtime.
3. Test dark mode across all sections.
4. Run Lighthouse baseline (`pnpm lighthouserc`) against production build.
5. Accessibility audit with axe-core.
