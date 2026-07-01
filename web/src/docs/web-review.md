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

## Remaining Items

1. Define alternate theme CSS var block in `globals.css` for toy-shop re-skin.
2. Update `layout.tsx` meta theme-color (currently hardcoded hex `#F58E00` in `<head>`).
3. Test dark mode across all sections.
4. Run Lighthouse baseline (`pnpm lighthouserc`) against production build.
5. Accessibility audit with axe-core.
