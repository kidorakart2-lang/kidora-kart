# Admin Panel Transformation Plan

## Overview
The admin panel has a solid shadcn/ui foundation (59 components) but needs: (1) a swappable theme system, (2) raw HTML → shadcn migrations, (3) better form UX, and (4) cleanup of inconsistencies.

---

## Phase 1: Theme System
**Goal:** Make the admin panel themeable with swappable color schemes, matching the website's pattern.

| # | Task | Files |
|---|------|-------|
| 1.1 | Create `app/themes/minimal.css` — clean white + blue accents (light) | NEW |
| 1.2 | Create `app/themes/brown.css` — warm caramel tones (light) | NEW |
| 1.3 | Create `app/themes/monochrome.css` — pure black & white | NEW |
| 1.4 | Create `app/themes/dark.css` — current dark theme extracted | NEW |
| 1.5 | Update `globals.css` — remove hardcoded light/dark vars, import theme files, add `body.theme-name` selector pattern | EDIT |
| 1.6 | Create `components/theme-switcher.tsx` — dropdown to swap themes (persisted to localStorage) | NEW |
| 1.7 | Update `app/layout.tsx` — load theme class from localStorage on mount | EDIT |
| 1.8 | Update `app/dashboard/layout.tsx` — add ThemeSwitcher to header | EDIT |

---

## Phase 2: Raw HTML → shadcn Migrations
**Goal:** Eliminate hardcoded color classes and raw HTML elements where shadcn equivalents exist.

| # | Task | Files |
|---|------|-------|
| 2.1 | **Replace `NewMultiSelect.tsx`** — rewrite using shadcn Popover + Command (searchable multi-select with checkboxes). Currently 100% raw HTML with `bg-white`, `border-gray-300`, `text-blue-600` | REWRITE |
| 2.2 | **Replace `RefundedOrdersAdmin.tsx`** — convert raw tabs, badges, cards, buttons to shadcn Tabs, Badge, Card, Button. Currently all raw HTML with hardcoded colors | REWRITE |
| 2.3 | **Fix `header.tsx` search dropdown** — replace raw `<ul>/<li>` with hardcoded `bg-white`/`hover:bg-gray-100` → shadcn Command or Popover | EDIT |
| 2.4 | **Fix `SettingsSection.tsx`** — replace raw `<button>` with hardcoded `bg-amber-100`/`text-amber-600` → shadcn Button | EDIT |
| 2.5 | **Fix `ResetPassword.tsx`** — replace raw `<label>` with hardcoded `text-gray-700` → shadcn Label | EDIT |
| 2.6 | **Fix Product form checkboxes** — replace 8 raw `<input type="checkbox">` → shadcn Switch or Checkbox | EDIT |
| 2.7 | **Fix Product form textarea** — replace raw `<textarea>` → shadcn Textarea | EDIT |
| 2.8 | **Fix audit-log table** — replace raw `<table>` → shadcn Table | EDIT |
| 2.9 | **Fix users/[id] table** — replace raw `<table>` → shadcn Table | EDIT |
| 2.10 | **Unify toast system** — standardize on Sonner (remove shadcn toast usage, or vice versa). Currently mixed: most pages use `useToast()`, password flows use `sonner` | EDIT multiple |

---

## Phase 3: Form UX Improvements
**Goal:** Better visual hierarchy, logical grouping, and cleaner layouts in create/edit drawers.

| # | Task | Files |
|---|------|-------|
| 3.1 | **Product form redesign** — group 38+ fields into 7 collapsible sections: Basic Info, Description, Categories+Tags, Dimensions, Age, Status Toggles, Images | DONE |
| 3.2 | **DataTable loading state** — add `loading` prop with skeleton rows, themed Table header skeleton in Suspense fallback | DONE |
| 3.3 | **Reusable ErrorState component** — `components/ui/error-state.tsx` with icon, title, message, retry button | DONE |
| 3.4 | **DataTable empty state** — uses `Empty` component system from `components/ui/empty.tsx`, customizable via `emptyTitle`/`emptyDescription`/`emptyAction` props | DONE |
| 3.5 | **Page-level error states** — ProductPage, CategoryClient, SubCategoryClient, Orders all use consistent ErrorState + loading skeletons | DONE |
| 3.6 | **Empty states for Categories/SubCategories** — replaced ad-hoc Card+icon with `Empty` component system | DONE |

---

## Phase 4: Cleanup & Polish
**Goal:** Remove dead code, fix inconsistencies, ensure production quality.

| # | Task | Files |
|---|------|-------|
| 4.1 | Delete unused `styles/globals.css` | DELETE |
| 4.2 | Audit all hardcoded color classes (`bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`) across admin components → replace with theme tokens | EDIT multiple |
| 4.3 | Ensure all interactive elements have proper focus rings and hover states | EDIT |
| 4.4 | Verify dark mode works correctly across all themes | TEST |
| 4.5 | Run `pnpm tsc --noEmit` and fix any type errors | FIX |

---

## Execution Order
1. **Phase 1** first (theme system is the foundation everything else depends on)
2. **Phase 2** next (shadcn migrations clean up the raw HTML)
3. **Phase 3** after (form UX improvements) — **DONE**
4. **Phase 4** last (cleanup and verification) — next
