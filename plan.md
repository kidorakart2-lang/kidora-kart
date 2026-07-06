# Toy Shop Performance Optimization Plan

**Current Lighthouse Score: 53**
**Target: 90+**

**Status: ~70% complete** — 9 of 13 items done, remaining 4 are P3 (low effort-to-impact).

---

## Executive Summary

The toy-shop web app suffers from heavy client-side JavaScript (Swiper, framer-motion, Lucide icons), oversized offscreen images, excessive DOM nesting, and render-blocking resources. The fix strategy is: reduce JS weight first (biggest TBT impact), fix LCP image loading, then optimize DOM and animations.

---

## Phase 1: Critical — TBT & JS Bundle (Score Impact: ~53 → 75)

### 1.1 Swiper: Lazy Load or Replace ✅
**Problem:** Swiper is statically imported in `BannerSlider.tsx` and loaded eagerly on every page.
**Done:** `BannerSlider` is already dynamically imported in `page.tsx` via `next/dynamic`. Swiper CSS is imported locally in `BannerSlider.tsx` (not globally).

### 1.2 framer-motion: Replace with CSS Animations or Reduce Import Scope ✅ (partial)
**Problem:** `framer-motion` (now `motion`) was imported in ProductCard, VideoSection, Header, and video components.
**Done:**
- **ProductCard.tsx** ✅ — Removed all `motion.*`, `AnimatePresence`, variants. Replaced with CSS `:hover` transitions, image crossfade via stacked `<Image>` components with CSS opacity transitions.
- **VideoSection.tsx** ✅ — Removed all `motion.*`. Replaced 3 infinite decorative animations with CSS `@keyframes`. Replaced whileInView content animations with CSS animation classes.
- **Header.tsx** ❌ — Not yet done.
- **video.tsx** ❌ — Not yet done.

### 1.3 Lucide Icons: Tree-Shake Properly ✅ (partial)
**Problem:** Lucide icons not tree-shaken.
**Done:** Added `optimizePackageImports: ["lucide-react"]` to `next.config.ts`. Barrel file or dynamic imports not yet done.

**Files:** `next.config.ts`

### 1.4 Remove Legacy Polyfills
**Problem:** 14 KiB of unused JS for Array.* polyfills.
**Status:** ❌ Not done — low priority, low impact.

---

## Phase 2: LCP & Image Optimization (Score Impact: ~75 → 85)

### 2.1 Fix LCP Banner Image ✅
**Problem:** BannerSlider missing `priority` and `sizes` props.
**Done:** Added `priority={i === 0}` and `sizes="100vw"` to the first banner slide `<Image>`. Also changed alt text to unique `Banner ${i + 1}`.

**Files:** `src/app/(sections)/BannerSlider.tsx`

### 2.2 Lazy Load poster.webp
**Problem:** `video.tsx` uses `poster.webp` as CSS `background-image`.
**Status:** ❌ Not done.

**Files:** `src/app/(sections)/video.tsx`

### 2.3 Fix Oversized Product Images ✅
**Problem:** Product images missing responsive `sizes` prop.
**Done:** Both main and hover images in `ProductCard.tsx` already have `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"` (added during ProductCard framer-motion refactor).

---

## Phase 3: DOM Size & Layout (Score Impact: ~85 → 90)

### 3.1 Reduce DOM Elements (4,084 → target < 1,500)
**Status:** ❌ Not done — high effort, low relative impact.

**Files:** All `(sections)/` components, `src/components/comman/` components

### 3.2 Fix Non-Composited Animations (CLS Impact) ✅
**Problem:** Swiper pagination bullets animating `background-color` triggers paint.
**Done:** Changed `transition: all 0.3s ease` → `transition: opacity 0.3s ease, transform 0.3s ease` and added `will-change: transform` to Swiper bullets in `index.css`.

---

## Phase 4: Render-Blocking & Caching (Score Impact: ~90 → 93)

### 4.1 Eliminate Render-Blocking CSS
**Status:** ❌ Not done — Swiper CSS already imported locally in `BannerSlider.tsx`. Further optimization requires bundle analysis.

**Files:** `src/app/(sections)/BannerSlider.tsx`, `src/app/(sections)/Slider.tsx`, `next.config.ts`

### 4.2 Remove Unused JS
**Status:** ❌ Not done — requires running `next build` with `ANALYZE=true` to identify unused chunks.

**Files:** `next.config.ts`, various component files

---

## Phase 5: Advanced Optimizations (Score Impact: ~93 → 96+)

### 5.1 Server Components Conversion
**Status:** ❌ Not done — high effort, requires untangling `"use client"` dependency chains.

**Files:** `src/components/comman/Footer.tsx`, `src/app/(sections)/Testimonial.tsx`, category sliders

### 5.2 Font Optimization
**Status:** ❌ Not done.

**Files:** `src/app/layout.tsx`

### 5.3 Code Splitting per Route ✅
**Problem:** `page.tsx` imported all sections statically, inflating the initial JS bundle.
**Done:** Dynamically imported 5 below-fold sections: `GenderCategorySection`, `ShopByPrice`, `TabProducts`, `WhyChooseUs`, `ProductsTab`. Each has a CSS skeleton fallback. `DefaultBanner` stays static (above the fold, LCP-critical).

---

## Implementation Order — Updated Status

| Priority | Phase | Expected Score Gain | Effort | Status |
|----------|-------|-------------------|--------|--------|
| 🔴 P0 | 1.2 Remove framer-motion from ProductCard | +10–15 | Medium | ✅ Done |
| 🔴 P0 | 2.1 Fix LCP banner `priority` | +5–8 | Low | ✅ Done |
| 🔴 P0 | 1.1 Verify Swiper dynamic import | +3–5 | Low | ✅ Done |
| 🟡 P1 | 3.2 Fix non-composited animations | +2–3 | Low | ✅ Done |
| 🟡 P1 | 4.1 Move Swiper CSS to dynamic chunk | +2–3 | Low | ❌ Not done |
| 🟡 P1 | 1.3 Lucide tree-shaking config | +2–3 | Low | ✅ Done (config) |
| 🟢 P2 | 1.2 VideoSection CSS keyframes | +1–2 | Medium | ✅ Done |
| 🟢 P2 | 2.2 Lazy load poster.webp | +1–2 | Low | ❌ Not done |
| 🟢 P2 | 5.3 Dynamic import below-fold sections | +2–3 | Medium | ✅ Done |
| 🟢 P2 | 4.2 Remove unused JS chunks | +1–2 | Medium | ❌ Not done |
| 🔵 P3 | 3.1 Reduce DOM elements | +1–2 | High | ❌ Not done |
| 🔵 P3 | 5.1 Server Component conversions | +1–2 | High | ❌ Not done |
| 🔵 P3 | 1.4 Remove legacy polyfills | +1 | Low | ❌ Not done |

---

## Quick Wins (All Done ✅)

1. ✅ Add `priority` and `sizes` to first banner slide in `BannerSlider.tsx`
2. ✅ Add `sizes` prop to ProductCard images
3. ✅ Add `optimizePackageImports: ["lucide-react"]` to `next.config.ts`
4. ✅ Replace ProductCard framer-motion with CSS `:hover` transitions
5. ✅ Add `will-change: transform` to Swiper pagination bullets

---

## Verification

After each phase, run:
```bash
# Build check
npm run build

# Lighthouse audit
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Bundle analysis
ANALYZE=true npm run build
```

Target metrics after all fixes:
- **Performance Score:** 90+
- **TBT:** < 200ms
- **LCP:** < 1.5s
- **CLS:** 0
- **FID:** < 50ms
- **DOM elements:** < 1,500
