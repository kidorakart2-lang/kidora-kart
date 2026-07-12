# Admin Panel UI/UX Audit — Plan

## Critical (Must Fix)

### C1. Hardcoded Colors That Break Theme System
**Files:** `app/error.tsx:19,49`, `app/dashboard/error.tsx:23,54`

Both error pages use hardcoded `bg-red-100` and `text-red-600` — looks broken in dark/monochrome themes.

```tsx
// CURRENT
<div className="bg-red-100 p-3 rounded-full">
  <AlertCircle className="h-10 w-10 text-red-600" />

// FIX
<div className="bg-destructive/10 p-3 rounded-full">
  <AlertCircle className="h-10 w-10 text-destructive" />
```

### C2. Product Status Badge Hardcoded Colors
**File:** `app/dashboard/products/ProductPage.tsx:876-880`

```tsx
// CURRENT
active: "bg-green-50 text-green-700 border-green-200",
inactive: "bg-red-50 text-red-700 border-red-200",

// FIX
active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
inactive: "bg-destructive/10 text-destructive border-destructive/20",
```

### C3. Sidebar Doesn't Close on Mobile After Navigation
**File:** `components/sidebar.tsx:146-163`

No `onClick` handler to close the sheet after tapping a link on mobile.

```tsx
// FIX — add onClick to close
const linkContent = (
  <Link
    key={item.href}
    href={item.href}
    onClick={() => {
      if (isMobile) setMobileSheetOpen(false);
    }}
    className={...}
  >
```

### C4. Duplicated Nav Definitions with Mismatched Names
**Files:** `components/sidebar.tsx:75` vs `components/header.tsx:55`

Sidebar says "AI Responses", header says "AI Helpers". Two independent `menuItems` arrays.

**Fix:** Extract a single shared `NAV_ITEMS` constant and import in both files.

### C5. Dead/Misleading Revenue Chart Component
**File:** `components/revenue-chart.tsx:24-31`

Contains hardcoded mock data. If imported anywhere, it misleads users. `dashboard-charts.tsx` is the real one.

**Fix:** Delete `revenue-chart.tsx` if unused, or accept `data` as a prop.

---

## Important (Should Fix)

### I1. Orders Page Uses useState/useEffect Instead of React Query
**File:** `app/dashboard/orders/Orders.tsx:79-113`

Unlike products and dashboard, orders manually manages loading state — no caching, no background refetch.

**Fix:** Migrate to `useQuery` like products page.

### I2. FAQ/Users/Banners Pages Also Use Manual State
**Files:** `faqs/page.tsx`, `users/page.tsx`, `banners/page.tsx`

Same pattern as I1. No caching, inconsistent error handling.

### I3. Product Form Drawer — No Mobile Adaptation
**File:** `app/dashboard/products/ProductPage.tsx:1025`

Fixed `!w-[60vw]`. All 7 sections open by default on mobile = overwhelming.

**Fix:** Default sections to collapsed on mobile. Use `useIsMobile()` for width.

### I4. Missing aria-labels on Interactive Elements
**Files:** `header.tsx:194`, `data-table.tsx:376`, `drawer.tsx:38`

Notification bell, edit/delete buttons, and drawer close button have no accessible labels.

### I5. Product Status Toggle — No Confirmation, Shared Loading State
**File:** `app/dashboard/products/ProductPage.tsx:876-898`

Accidental click changes visibility. "Changing.." shows on ALL rows when ANY mutation is pending.

**Fix:** Add confirmation dialog. Track which product is being updated per-row.

### I6. Inconsistent Loading Patterns
Three different patterns across the app: Skeleton components, raw `animate-pulse` divs, and nothing.

**Fix:** Standardize on `<Skeleton>` for all loading states.

### I7. confirmCancelOrder Uses Uncontrolled Form Access
**File:** `app/dashboard/orders/Orders.tsx:256-257`

```tsx
// CURRENT
const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement)?.value;

// FIX — use controlled state
const [cancelReason, setCancelReason] = useState("");
```

### I8. Notification Bell Always Shows Fake Pulse
**File:** `components/header.tsx:198-201`

Always shows a pulsing dot even with no notifications. Misleading.

**Fix:** Only show when actual unread notifications exist.

### I9. Dashboard Stat Cards Always Show change={0}
**File:** `app/dashboard/dashboard/page.tsx:157-204`

All StatCard components pass `change={0}` — dead UI.

**Fix:** Compute real change percentage or remove the indicator.

### I10. No Unsaved-Changes Protection in Product Form
**File:** `app/dashboard/products/ProductPage.tsx`

1700+ line form. Closing drawer loses all unsaved work.

**Fix:** Add "Discard changes?" confirmation on close.

---

## Nice-to-Have (Could Fix)

### N1. Sidebar Has 17 Flat Items — Consider Grouping
Group into: Commerce, Content, Users, Marketing, Catalog, AI, Assets.

### N2. Search Lacks Keyboard Navigation
No arrow keys, Enter to select, Escape to close.

### N3. Banners Page Uses Raw `<img>` Instead of Next.js `<Image>`
No lazy loading, no size optimization, no CDN optimization.

### N4. Users Page Duplicate Toast Messages
Same message in both `title` and `description` — redundant.

### N5. Print Orders Button Has No Loading State

### N6. Settings Page Has No Loading Skeleton

### N7. Dead CSS Rules for Non-Existent Tailwind v3 Classes
`globals.css:232-234` references `.bg-gray-50`, `.bg-blue-50` which don't exist in Tailwind v4.

### N8. No Keyboard Shortcut Support (Ctrl+K for search, Esc to close drawers)

### N9. Missing loading.tsx for Sub-Routes
Only `app/dashboard/loading.tsx` exists. Other routes have no loading skeletons.
