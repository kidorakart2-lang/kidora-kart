# Admin Panel Review — `admin-panel/` (Jewellery Walla)

**Scope:** `D:\side-projects\websites\toy-shop\admin-panel\` — Next.js 15 App Router admin dashboard.
**Review date:** 2026-06-25
**Categories:** Performance, SEO, UI/UX, Security, Build & Code Quality.
**Overall health:** 🔴 **Not production-ready.** The "passkey" check is theatre, the middleware is bypassable, the file layout has both `.js` and `.ts` duplicates that will conflict at build, and several admin endpoints are wired to the wrong (website) routes.

---

## Severity Legend

- 🔴 **Critical** — Production-blocking, must fix before any deployment
- 🟠 **High** — Materially hurts security, reliability, or UX
- 🟡 **Medium** — Worth fixing soon
- 🟢 **Low** — Polish / nice-to-have

---

## Executive Summary

The admin panel works only because Next.js is forgiving. The auth flow is a textbook "looks like 2FA, actually no auth at all" pattern: any visitor who knows the static passkey can become an admin. The middleware only checks for cookie presence. There is no role-based access control in the front end (and per `security-issues.md`, the backend never checks role either).

The directory contains **two parallel copies of nearly every file** — one `.js`/`.jsx`, one `.ts`/`.tsx`. Only one will compile, but both are tracked and the `.js` versions often have bugs that the `.ts` versions fix (and vice versa). This is technical debt that will silently regress.

Several endpoints are wired to the wrong namespace (admin panel calls `api/website/orders/all` instead of `api/admin/orders/all`), there is a duplicated `admin/admin` URL prefix bug, and the Razorpay refund admin tool uses `window.confirm` for financial confirmations — no audit trail, no undo.

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total |
|---|---|---|---|---|---|
| Security | 6 | 7 | 5 | 2 | **20** |
| Performance | 3 | 5 | 5 | 4 | **17** |
| UI/UX | 1 | 5 | 7 | 4 | **17** |
| SEO | 0 | 0 | 1 | 2 | **3** |
| Build & Code Quality | 4 | 6 | 5 | 3 | **18** |
| **Total** | **14** | **23** | **23** | **15** | **75** |

---

# 1. Security

## 🔴 S1. "Passkey" check is theatre — passkey is in the client bundle

**File:** `admin-panel/app/page.tsx:48-65`

```ts
const handlePasskeyVerification = (passkey: string) => {
  setIsVerifyingPasskey(true);
  if (passkey === process.env.NEXT_PUBLIC_PASSKEY) {
    toast({ title: "Passkey verified", ... });
    handlePasskeySuccess();
  }
};
```

**Problem:**
- `NEXT_PUBLIC_*` env vars are **inlined into the client JavaScript at build time**.
- The passkey is identical for every user in every session.
- Anyone can `view-source` or open DevTools → Sources → search for the passkey literal.
- A single shared secret that everyone knows is, by definition, not a secret.

**Impact:** Anyone with the passkey string becomes a permanent admin. No way to revoke.

**Fix:**
- Delete the passkey flow entirely. Make the backend issue a JWT after `email + password`.
- If you want a second factor, do TOTP (RFC 6238) with per-admin seeds stored server-side, OR WebAuthn (passkeys), OR SMS OTP to a phone on file.
- Move `NEXT_PUBLIC_PASSKEY` out of `.env`. If it ever leaks in git history, rotate it.

---

## 🔴 S2. `adminToken` cookie stored without `httpOnly`, `secure`, or `sameSite`

**File:** `admin-panel/app/page.tsx:40-44`

```ts
Cookies.set("adminToken", authToken, {
  expires: 7,
  path: "/",
});
```

**Problem:**
- `js-cookie` cannot set `httpOnly` (browser API limitation), but the absence here is the security failure: any XSS reads the admin JWT.
- No `secure` flag → cookie can be sent over HTTP.
- No `sameSite` → cookie sent on cross-site POSTs (CSRF risk).

**Fix:**
- Have the Express backend `Set-Cookie: adminToken=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...` in the login response.
- Stop using `js-cookie` for tokens. Use it for non-sensitive UI prefs only.

---

## 🔴 S3. Middleware only checks cookie presence, not signature or role

**File:** `admin-panel/middleware.js:4-40`

```js
const adminToken = cookies().get("adminToken")?.value;
if (!isDeliveryPath) {
  if (isPublicPath && adminToken) return NextResponse.redirect("/dashboard");
  if (!isPublicPath && !adminToken) return NextResponse.redirect("/");
}
```

**Problems:**
- No JWT verification (no `jwt.verify`).
- No expiry check.
- No role check (`admin` vs `delivery` vs `user`).
- An attacker who forges a cookie named `adminToken=anything` is treated as logged in.
- The matcher array `["/", "/dashboard/:path*", "/login", "/delievery", "/delievery/orders/:path*"]` does **not** match subroutes like `/dashboard/settings`, `/dashboard/products`, `/dashboard/users`, etc. — so they get *no* middleware protection at all and rely entirely on a non-existent client-side check.

**Fix:**
```js
import { jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
export async function middleware(request) {
  const path = request.nextUrl.pathname;
  if (path === "/" || path === "/login") return NextResponse.next();
  const token = request.cookies.get("adminToken")?.value;
  if (!token) return NextResponse.redirect(new URL("/", request.url));
  try {
    const { payload } = await jwtVerify(token, secret);
    if (path.startsWith("/delievery") && payload.role !== "delivery" && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!path.startsWith("/delievery") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard/:path*", "/delievery/:path*"],
};
```

Also see `security-issues.md` C2 — the backend's `authMiddleware.js` has the same flaw.

---

## 🔴 S4. Privilege escalation via "change-role" endpoint reachable from admin UI

**File:** `admin-panel/app/dashboard/users/page.jsx:106-145`

The Users page allows an admin to change a user's role to `admin` or `delivery`. There is:
- No audit log entry.
- No "you cannot demote yourself" check.
- No re-authentication.
- The backend endpoint (`api/admin/user/:id/change-role`) — verify it requires `role === "admin"` in the JWT. Per `security-issues.md` it likely does NOT.

**Fix:** Verify the backend enforces role; add audit log; prevent self-demotion; require fresh JWT (< 5 min) for role changes.

---

## 🔴 S5. Admin orders page calls website API namespace

**File:** `admin-panel/app/dashboard/orders/page.jsx:39-49`

```js
const data = await fetch(
  process.env.NEXT_PUBLIC_BACKEND_URL + "api/website/orders/all",
  { method: "POST", ... }
);
```

**Problem:** Admin tooling hits `api/website/orders/all`, which:
- May apply different rate limits than admin endpoints.
- May return data filtered for the website user.
- Confuses monitoring (admin traffic appears in website metrics).
- **If** `api/admin/*` enforces `role === "admin"` and `api/website/*` doesn't (per `security-issues.md`), this is a happy accident that works. Otherwise the admin endpoint may 403.

**Fix:** Use `api/admin/orders/all` consistently. Same in `app/delievery/orders/page.jsx:40`.

---

## 🔴 S6. RefundedOrdersAdmin URL path has duplicated "admin" segment

**File:** `admin-panel/components/RefundedOrdersAdmin.jsx:20,31,71,102,168`

```js
const BASE_URL = `${BACKEND_URL}api/admin/orders`;     // "api/admin/orders"
const response = await fetch(`${BASE_URL}/admin/refund/sync`, ...);  // → "api/admin/orders/admin/refund/sync"
```

**Problem:** Concatenation produces `api/admin/orders/admin/refund/sync` (note the doubled `admin`). The endpoint likely 404s, but the bug is silent in the UI because the catch block alerts a generic "Error".

**Fix:** Either drop `/admin` from `BASE_URL` (`api/orders`) or from the path (`${BASE_URL}/refund/sync`).

---

## 🟠 S7. Role change UI without confirming the user

The "Add User" / "Edit User" drawer allows promoting a user to `admin` without re-prompting for the admin's own password (a real second-factor check).

---

## 🟠 S8. No CSRF protection on admin state-changing endpoints

Every mutating endpoint (`confirmDelete`, `handleSubmit`, `confirmCancelOrder`, `fixOrder`, `verifyAndUpdateRefundStatus`) uses `Authorization: Bearer` from a cookie-less `fetch`. If the backend reads the JWT from a cookie, a CSRF attack can replay the admin's session.

**Fix:** Ensure the backend reads JWT from `Authorization` header (not cookie) OR add CSRF tokens to all state-changing admin endpoints.

---

## 🟠 S9. Avatar `src={item.avatar || ""}` — empty string breaks Avatar component

**File:** `admin-panel/app/dashboard/users/page.jsx:157`

If `item.avatar` is empty/missing, `<AvatarImage src="" />` triggers a broken-image network call. Verify what `<AvatarFallback>` renders when `<AvatarImage>` is broken — usually just initials.

**Security note:** Avatars are user-uploaded; if the backend doesn't validate MIME type or size, this is an XSS upload vector. Verify the API.

---

## 🟠 S10. `item.name[0]` crashes if name is undefined

**File:** `admin-panel/app/dashboard/users/page.jsx:159`

```jsx
<AvatarFallback>{item.name[0]}</AvatarFallback>
```

If `name` is missing, throws. Should be `item.name?.[0] ?? "?"`.

---

## 🟠 S11. `console.log(order)` and similar in production render paths

**Files:**
- `components/order-receipt.jsx:44` — logs full order (PII, addresses, prices)
- `components/RefundedOrdersAdmin.jsx` — no log but multiple `alert()` blocks
- `app/dashboard/users/page.jsx:54,74,81` — multiple `console.log`
- `app/dashboard/page.tsx:78` — none
- `app/dashboard/orders/page.jsx:50` — `console.log(response)`
- `app/delievery/orders/page.jsx:50` — `console.log(response)`

**Impact:** Production logs leak data into browser DevTools and Vercel build output (if `next build` logs them).

**Fix:** Strip `console.*` from client bundles in `next.config.mjs` via `compiler.removeConsole`:
```js
compiler: { removeConsole: { exclude: ["error"] } }
```

---

## 🟠 S12. `window.confirm` used for financial refund confirmations

**File:** `admin-panel/components/RefundedOrdersAdmin.jsx:113,147`

```js
const isConfirmed = window.confirm(confirmMessage);
```

**Problems:**
- `window.confirm` is not styled, blocks the JS thread, breaks keyboard nav.
- Cannot be styled for accessibility (no focus trap).
- Different browsers show different text — no i18n.
- No audit trail: clicking OK triggers an irreversible Razorpay refund mutation with no entry in an admin-action log.

**Fix:** Build a proper modal (Radix `AlertDialog` is already a dep). Log the action with admin ID, timestamp, before/after state to an `admin_audit_log` collection.

---

## 🟠 S13. `useEffect` with `[currentPage, searchTerm]` triggers API call per keystroke

**File:** `admin-panel/app/delievery/orders/page.jsx:30-32`

```js
useEffect(() => {
  fetchOrders();
}, [currentPage, searchTerm]);
```

**Problem:** Every keystroke in the search box hits `api/website/orders/all`. With React StrictMode in dev, that doubles. With multiple admins online, the backend gets hammered.

**Fix:** Debounce 300 ms, or only fire on form submit (the existing `<form onSubmit>` already exists but isn't preventing the per-keystroke effect).

---

## 🟡 S14. `axios.post(... {}, { headers: ... })` — empty body on user delete

**File:** `admin-panel/app/dashboard/users/page.jsx:76-80`

```js
const res = await axios.post(
  `${API_BASE}api/admin/user/delete/${userToDelete}`,
  {},
  { headers: getAuthHeaders() }
);
```

**Problem:** `POST /user/delete/:id` with no body — RESTful API should be `DELETE /user/:id`. As written, this could be retried by a browser prefetcher or duplicated by React StrictMode.

**Fix:** `axios.delete(...)`.

---

## 🟡 S15. `confirmDelete` always calls `loadUsers()` even when delete failed

**File:** `admin-panel/app/dashboard/users/page.jsx:101`

```js
} catch (error) { toast(...); }
loadUsers();
```

Silently masks the failure. Move `loadUsers()` inside the success branch.

---

## 🟡 S16. `setTimeout` in export buttons blocks UI

**File:** `admin-panel/components/export-buttons.jsx:13,21`

```js
setTimeout(() => {
  exportToJSON(data, ...);
  setExporting(false);
}, 300);
```

Why is there a delay? If it's to show a spinner, use proper state, not `setTimeout`. As written, the button can be clicked again before the timeout fires.

---

## 🟡 S17. `confirmCancelOrder` reads `e.target.reason.value` — won't work for synthetic events

**File:** `admin-panel/app/dashboard/orders/page.jsx:177`

```js
const confirmCancelOrder = async (e) => {
  ...
  if (e.target.reason.value === "") { ... }
};
```

In React, `e.target` may not have `.reason` if the user clicks a button instead of submitting the textarea. Use `new FormData(e.currentTarget)` like the `.tsx` version does. The `.js` version has `formData = new FormData(e)` (a separate bug — should be `e.currentTarget`).

---

## 🟡 S18. `refundError` displayed raw to admin

**File:** `admin-panel/components/RefundedOrdersAdmin.jsx:268`

```jsx
<strong>Error:</strong> {order.cancellation.refundError}
```

This is fine for admins, but verify the string is HTML-escaped (React handles it by default). No additional risk unless the error string is reflected elsewhere.

---

## 🟢 S19. `theme-toggle.jsx` and `theme-provider.tsx` may collide

Both files exist. Verify which one is imported and used. Same file-pattern problem as everywhere else.

---

## 🟢 S20. `notification` button in `header.tsx` is non-functional

**File:** `admin-panel/components/header.tsx:107-113`

```jsx
<Button variant="ghost" size="icon">
  <Bell className="h-5 w-5" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
</Button>
```

No `onClick`. The pulsing dot is misleading — implies unread notifications that don't exist.

---

# 2. Performance

## 🔴 P1. `images.unoptimized: true` in `next.config.mjs`

**File:** `admin-panel/next.config.mjs:10-12`

Same issue as `web/`. Disables Next.js Image Optimization. Product/order images ship at full resolution.

**Fix:** Remove `unoptimized: true`. Add `remotePatterns` for Cloudflare R2 (R2 URL from `web/next.config.mjs`).

---

## 🔴 P2. `framer-motion` + `motion` + `motion/react` all imported

**Files:**
- `package.json` has both `motion: ^12.23.24` and (transitively) `framer-motion`.
- `app/dashboard/orders/Orders.jsx` — no motion, but `app/delievery/layout.tsx:3` imports `motion/react`.
- The login page imports `framer-motion` via Tailwind `animate-in` classes (Tailwind plugin), but the delivery layout imports the actual library.

**Impact:** ~50–60 KB gz extra. Pick one library.

**Fix:** Standardize on `motion` (the modern package); uninstall `framer-motion`. Or vice versa.

---

## 🔴 P3. `axios` + `fetch` used inconsistently across every page

- `Orders.jsx` — `fetch`
- `PendingPaymentFix.jsx` — `axios`
- `RefundedOrdersAdmin.jsx` — `fetch`
- `users/page.jsx` — `fetch` + `axios`
- `page.tsx` (login) — `axios`

This means multiple `Authorization: Bearer` header constructions, multiple error handling patterns, and inconsistent `Credentials` / CORS behavior.

**Fix:** Wrap all API calls in one helper (`lib/api.ts` is half-done but unused).

---

## 🟠 P4. Duplicate `.js`/`.ts` files inflate bundle and confuse Next.js

**Pattern (across the project):**

| `.js` / `.jsx` (active) | `.ts` / `.tsx` (shadow) | Files |
|---|---|---|
| `app/page.jsx` | `app/page.tsx` | 2 |
| `app/dashboard/page.jsx` | `app/dashboard/page.tsx` | 2 |
| `app/dashboard/orders/page.jsx` + `Orders.jsx` | (no `.tsx` for orders) | — |
| `app/delievery/layout.jsx` | `app/delievery/layout.tsx` | 2 |
| `components/data-table.jsx` | `components/data-table.tsx` | 2 |
| `components/header.jsx` | `components/header.tsx` | 2 |
| `components/sidebar.jsx` | `components/sidebar.tsx` | 2 |
| ... | ... | ~40 files |

**Impact:**
- Next.js picks one per directory; the other is dead code.
- TypeScript `ignoreBuildErrors: false` (`next.config.mjs:8`) means TS errors break the build — but if the `.js` version is the active one, you skip TS checking entirely.
- Bundle includes any code reachable from the active file. If both are reachable (one imports the other), both ship.

**Fix:** Pick `.tsx` as the source of truth, delete every `.js` / `.jsx` duplicate after confirming no behavioral difference. Use `git mv` to keep history.

---

## 🟠 P5. No code splitting — every dashboard page imports the same huge `DataTable`

**File:** `components/data-table.tsx` (and `.jsx`) — uses `date-fns`, `react-day-picker` calendar, etc.

Every page that uses `<DataTable>` (Products, Users, Orders, FAQs, etc.) pulls the calendar library into its bundle, even pages that don't use `dateOption={true}`.

**Fix:** Split `DataTable` so the calendar is lazy-loaded:
```js
const DateFilter = dynamic(() => import("./DateFilter"), { ssr: false });
```

---

## 🟠 P6. `useEffect` animation in `StatCard` uses `setInterval`

**File:** `admin-panel/components/stat-card.tsx:19-36`

```js
useEffect(() => {
  let start = 0;
  const end = value;
  const increment = end / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= end) { ... clearInterval(timer); }
    else setDisplayValue(Math.floor(start));
  }, 16);
  return () => clearInterval(timer);
}, [value]);
```

**Problems:**
- ~60 fps timer on the main thread when the page is idle (battery drain on laptops).
- `setDisplayValue(Math.floor(start))` causes 60 React re-renders per stat card per second.
- Floating-point drift: `start += increment` may never exactly equal `end`, so the last increment goes one tick too far before being clamped.

**Fix:** Use Framer Motion's `useMotionValue` + `animate` or `motion/react`'s `<motion.span animate={{ value }} />`.

---

## 🟠 P7. `refundAmount = order.cancellation?.refundAmount || order.pricing?.total || 0` — no memoization

**File:** `components/RefundedOrdersAdmin.jsx:243`

Recomputed per render. For dashboards with thousands of orders, this is fine (the list is paginated). For other heavy computations, wrap in `useMemo`.

---

## 🟠 P8. `motion.main` in delivery layout animates every render

**File:** `admin-panel/app/delievery/layout.tsx:40-47`

```jsx
<motion.main
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  ...
>
```

Wrapping in motion forces the layout to be a Client Component, defeating Server Component rendering. Move the animation to a leaf element.

---

## 🟡 P9. `Tabs` use client-side rendering despite static data

**File:** `components/RefundedOrdersAdmin.jsx:319-400`

The tabs and counts are static — could be SSR'd. The whole component is `"use client"` because it uses `useState` for tabs, but you can extract a server-side `<TabBar>` and pass children.

---

## 🟡 P10. `Header` search dropdown recomputes on every keystroke

**File:** `admin-panel/components/header.tsx:52-68`

```js
const filtered = menuItems
  .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  .slice(0, 5);
```

Acceptable for ~14 items, but if `menuItems` grows, wrap in `useMemo`.

---

## 🟡 P11. `OrderReceipt` mounts `<style jsx global>` on every render

**File:** `admin-panel/components/order-receipt.jsx:325-389`

Even when `isOpen === false` and the function returns `null` at line 52, the JSX is not evaluated (early return saves this). But when `isOpen === true`, the global `<style>` injects into the document. If the receipt is opened, printed, closed, re-opened → another `<style>` block, accumulating. Move to `globals.css` with `@media print`.

---

## 🟡 P12. `useToast` from `ui/use-toast` and from `hooks/use-toast` — two sources

**Files:**
- `app/delievery/orders/page.jsx:15` — `import { useToast } from "@/components/ui/use-toast";`
- `app/dashboard/page.tsx:22` — `import { useToast } from "@/hooks/use-toast";`

Both exist. They may or may not export the same hook. Consolidate.

---

## 🟡 P13. `Sidebar` `useEffect` with missing dependency

**File:** `admin-panel/components/sidebar.tsx:73-77`

```js
useEffect(() => {
  if (onCollapsedChange) onCollapsedChange(collapsed);
}, [collapsed, onCollapsedChange]);
```

`onCollapsedChange` is a function reference that may change every render in the parent. Wrap the parent's callback in `useCallback` or omit the dep.

---

## 🟢 P14. Date formatting in render

`new Date(item.createdAt).toLocaleDateString()` runs on every render of every row. For a 10-row page, negligible; for 1000 rows, memoize.

---

## 🟢 P15. `Image` component in `Orders.jsx:512-519` with `console.log(selectedOrder)` onClick

**File:** `app/dashboard/orders/Orders.jsx:513`

```jsx
<Image onClick={() => console.log(selectedOrder)} ... />
```

Logs the full order (PII) on every click. Remove.

---

## 🟢 P16. `support@admin.com` hardcoded in receipt footer

**File:** `components/order-receipt.jsx:313`

`support@admin.com` is not a real email. Receipts sent to customers will look broken.

---

## 🟢 P17. `fetch` with `console.log(response)` in dashboard page

**File:** `app/dashboard/page.tsx` (none — OK) but `app/delievery/orders/page.jsx:50` — strip in production.

---

# 3. UI/UX

## 🔴 U1. Login + "passkey" flow looks like 2FA but is not

**File:** `app/page.tsx`

To the user, "Enter credentials → verify with passkey" feels like a security upgrade. It is actually a downgrade: any attacker who reads the bundled passkey can complete the flow with no further challenge. Users may adopt weaker passwords because they trust the second factor.

**Fix:** Replace with real 2FA (TOTP) or remove the dialog.

---

## 🟠 U2. `not-found.jsx` shows "Go to Dashboard" even when logged out

**File:** `admin-panel/app/not-found.jsx:20-25`

```jsx
<Button asChild>
  <Link href="/dashboard" className="flex items-center gap-2">
    <Home className="h-4 w-4" />
    Go to Dashboard
  </Link>
</Button>
```

If a logged-out user hits an admin-only URL, the middleware redirects them to `/`. But if they hit a non-middleware-protected URL like `/dashboard/products` (per S3, the matcher doesn't include this), they get the 404 page with "Go to Dashboard" that they can't reach.

**Fix:** Detect auth state and show appropriate CTA.

---

## 🟠 U3. Modal `<Drawer>` used for cancellation — not focus-trapped

**File:** `app/dashboard/orders/Orders.jsx:357-405`

`<Drawer>` (Radix-based) — verify the underlying Radix component applies `aria-modal` and traps focus. If it's a custom div (not Radix), it's an a11y failure.

---

## 🟠 U4. Bell icon with pulsing red dot but no notifications

**File:** `components/header.tsx:111-113`

Misleading UX — looks like unread notifications exist.

**Fix:** Either implement a notifications dropdown or remove the dot.

---

## 🟠 U5. `avatar` from R2 may fail to load — no error UI

**File:** `app/dashboard/users/page.jsx:157`

`<AvatarImage src={item.avatar || ""} />` — if the URL 404s, the user sees a broken icon. Verify `<AvatarImage>` has an `onError` to swap to fallback. Radix's default does NOT swap on error.

**Fix:** Use `onLoadingStatusChange` or wrap in a `<picture>` with a fallback URL.

---

## 🟠 U6. `useEffect` for `loadUsers` with no abort controller

**File:** `app/dashboard/users/page.jsx:38-40`

If the user navigates away mid-fetch, the late-arriving `setUsers` runs on an unmounted component. Add `AbortController` or use React Query (already installed: `@tanstack/react-query`).

---

## 🟠 U7. Search input has no debouncing or minimum length

**File:** `app/delievery/orders/page.jsx:117-128`

The form `<input>` triggers a refetch on every change to `searchTerm` via the `useEffect` dependency. With 50 items per page, network noise is high.

---

## 🟡 U8. `window.confirm` and `alert()` for refund operations

Already covered under S12. Same UX issue: blocks thread, ugly, no i18n.

---

## 🟡 U9. `RefundedOrdersAdmin` mixes tabbed UI with grid layout

Hard to scan 50+ refund cards. Consider a sortable table view instead.

---

## 🟡 U10. Print receipt uses `print:` Tailwind variants — but global `<style jsx>` overrides visibility

**File:** `components/order-receipt.jsx:325-389`

The `<style jsx global>` makes everything `visibility: hidden`, then unhides the receipt. This works but is a fragile hack — any new modal added to the page will be hidden too. Use a `<div id="print-root">` and `@media print { body * { visibility: hidden } #print-root * { visibility: visible } }` in `globals.css`.

---

## 🟡 U11. `theme-toggle` exists but theme is uncontrolled

**File:** `components/theme-toggle.tsx`

Verify it persists to `localStorage` (default for `next-themes`) and doesn't cause FOUC on dashboard load. If the user has dark mode set and a new admin logs in, they see a flash of light theme.

---

## 🟡 U12. Sidebar collapses on mobile but no off-canvas behavior

**File:** `components/sidebar.tsx:79-83`

```js
useEffect(() => {
  if (isMobile) setCollapsed(true);
}, [isMobile]);
```

Mobile users get a 64px sidebar with just icons — content gets pushed off-screen with no hamburger menu. This is broken UX on phones.

**Fix:** On mobile, hide the sidebar entirely; show a hamburger button that toggles an overlay drawer.

---

## 🟡 U13. Table rows have `onClick` that conflicts with `<Button onClick>` inside

**File:** `app/delievery/orders/page.jsx:151-211`

The `<TableRow>` has an `onClick` that navigates to the detail page; the inner `<Button>` uses `e.stopPropagation()`. On mobile (touch), `e.stopPropagation()` may not fire as expected, leading to accidental double navigation. Verify on real devices.

---

## 🟡 U14. `Toast` shown without `aria-live`

**File:** `hooks/use-toast.ts` / `components/ui/toaster.tsx` — verify Radix `Toast` has `aria-live` set (it does by default), but check your override.

---

## 🟢 U15. Dashboard widgets use `delay` for staggered animation

`delay={index * 50}` style animations pile up — first paint is delayed by `last_index * 50ms`. On dashboards with many cards, this is 500ms+ of perceived lag.

---

## 🟢 U16. `<Button>` with `asChild` wraps `<Link>` but visual styling applies to anchor

**File:** `components/header.tsx:132-138`

```jsx
<Link href="/dashboard/profile">
  <DropdownMenuItem>Profile</DropdownMenuItem>
</Link>
```

DropdownMenuItem is a `<div>` inside an anchor — invalid HTML. Radix's DropdownMenuItem is meant to be the link itself in some patterns. Verify a11y.

---

## 🟢 U17. Settings page has no UI

**File:** `app/dashboard/settings/page.jsx`

Just renders `<SettingsSection>` with prefetched user data. Verify `SettingsSection` has edit forms. From the file name, likely yes.

---

# 4. SEO

## 🟡 SEO1. Admin panel should not be indexed

**File:** `admin-panel/app/layout.tsx`

No robots meta in metadata. Default Next.js behavior is `index: true`.

**Fix:**
```ts
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};
```

Plus add `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />` to layout.

---

## 🟢 SEO2. Title is generic

`metadata.title = "Jewellery walla admin dashboard"` — should match the brand convention used in `web/` and include a clear "Admin" marker for browser tab identification.

---

## 🟢 SEO3. No `robots.txt` for admin panel

If `admin-panel` is on a separate subdomain (e.g., `admin.example.com`), add a `robots.txt` denying all.

---

# 5. Build & Code Quality

## 🔴 B1. `typescript: { ignoreBuildErrors: false }` will break the build

**File:** `admin-panel/next.config.mjs:7-9`

`false` means TS errors block the build. With ~40 duplicate `.js`/`.ts` files (B4), the active `.tsx` files may have type errors that the `.jsx` shadow files hide. The build will fail until you either fix the types or delete the duplicates.

---

## 🔴 B2. Both `page.jsx` and `page.tsx` in the same App Router folder → build error

**Files:**
- `app/page.jsx` and `app/page.tsx` both exist.
- `app/dashboard/page.jsx` and `app/dashboard/page.tsx` both exist.
- `app/dashboard/orders/page.jsx` and `app/delievery/orders/page.jsx` and `page.tsx` both exist.

Next.js App Router allows **one** `page.{js,jsx,ts,tsx}` per folder. With duplicates, the build will fail with:
```
Error: You cannot have two parallel pages that resolve to the same path.
```

Unless one is hidden by `not-found.jsx` semantics — but no, both are `page.{ext}`.

**Fix:** Delete the `.jsx` versions (or vice versa) after merging any behavioral differences.

---

## 🔴 B3. `app/dashboard/products/page.jsx` imports `./ProductPage` which is also `.jsx`

**File:** `app/dashboard/products/page.jsx:2`

```js
import ProductsPage from "./ProductPage";
```

Same directory has `ProductPage.jsx` (not `.tsx`). Verify it exists; if it doesn't, this page fails to compile.

---

## 🔴 B4. Library file `lib/api.js` and `lib/api.ts` both exist

**File:** `lib/api.ts` (read at session start) and `lib/api.js` (just read) — both contain a `mock-data` import. The `.ts` version is type-annotated; the `.js` version is plain. Only one is active; the other is dead code that confuses readers.

**Fix:** Pick the `.ts` version (matches the `tsconfig.json` setup) and delete `.js`.

---

## 🟠 B5. `OrderReceipt.jsx` is a `.jsx` file but uses TypeScript-flavored syntax

**File:** `components/order-receipt.jsx:1-31`

`formatDate` and `formatDateTime` are untyped (OK for `.jsx`), but the surrounding app uses `.ts`/`.tsx` everywhere. Inconsistent.

---

## 🟠 B6. Mixed `fetch` + `axios` + `async/await` error handling

No consistent error normalization. One page shows `response.message`, another shows `error.response?.data?.message`, another shows `response._message`. Customers will see different error messages depending on which page failed.

**Fix:** Centralize in `lib/api.ts`:
```ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!data._status) throw new Error(data._message ?? "Request failed");
  return data._data as T;
}
```

---

## 🟠 B7. No `loading.tsx` files (Suspense fallbacks)

The dashboard's `<RecentOrders>` and `<RecentActivity>` show `<span className="text-red-500">Something went wrong 😬</span>` on error — no retry, no fallback UI, no skeleton.

**Fix:** Add `loading.tsx` in `app/dashboard/` and per-route.

---

## 🟠 B8. No `error.tsx` boundary inside `app/dashboard/`

**File:** `app/error.tsx` exists at the root but there's no dashboard-scoped `error.tsx`. An error in one admin page takes down the entire dashboard.

---

## 🟠 B9. `app/error.jsx` and `app/error.tsx` both exist

Same file-pattern problem as everywhere else. Pick one.

---

## 🟠 B10. CSS-in-JS (`<style jsx>`) used in `OrderReceipt`

Adds runtime style injection, blocks SSR for that section. Move to `globals.css`.

---

## 🟡 B11. `console.log` scattered through components

Stripped by `compiler.removeConsole` in `next.config.mjs`. See S11.

---

## 🟡 B12. `tsconfig.json` not verified

Verify `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`. These catch the bugs found in `users/page.jsx` (e.g., `item.name[0]`).

---

## 🟡 B13. `pnpm-lock.yaml` AND `package-lock.json` both present

The repo is being installed with both `pnpm` and `npm`. Pick one. Mixing lockfiles creates non-reproducible installs.

---

## 🟡 B14. `next.config.mjs` comment about `eslint.ignoreDuringBuilds` says it's removed

**File:** `admin-panel/next.config.mjs:5`

> Note: Next 16 no longer supports `eslint.ignoreDuringBuilds` in this config.

This implies the repo has bumped Next to 16 somewhere. Verify `package.json` says `"next": "15.2.6"` — that's Next 15. The comment is misleading; either the upgrade is in progress or the comment is leftover from an unfinished migration.

---

## 🟡 B15. `useEffect` with `[]` dependency + non-idempotent body

**File:** `app/dashboard/users/page.jsx:38-40`, `Orders.jsx:32-34`, `RefundedOrdersAdmin.jsx:61-63`

With `reactStrictMode: true` (Next.js default), effects run twice in dev. `loadUsers()` and `loadOrders()` make duplicate API calls in dev mode. Wrap in `useEffect(() => { ... }, [])` with a ref guard, or convert to React Query.

---

## 🟢 B16. `useState` initialized to `null` but typed as non-null in handler

**File:** `components/header.tsx:139-141`

`onClick={() => setOpen(true)}` — fine. But `setOpen(false)` may be called on click-outside without a state setter. Verify Radix `AlertDialog` handles it.

---

## 🟢 B17. `<Drawer>` is a custom component, not Radix

**File:** `components/drawer.tsx` (and `.jsx`) — verify it implements:
- `role="dialog"`
- `aria-modal="true"`
- Focus trap
- Escape key handler
- Scroll lock

If it doesn't, it's a WCAG violation.

---

## 🟢 B18. `next.config.mjs` does not set `experimental.optimizePackageImports`

Libraries like `lucide-react`, `@radix-ui/react-*` ship many small modules. Without `optimizePackageImports`, every icon import becomes a separate JS module in dev. Add:
```js
experimental: { optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-icons"] }
```

---

# 6. Cross-Cutting Concerns

## C1. Two parallel fetch/axios clients with inconsistent error handling

See B6.

## C2. No centralized API base URL

```js
process.env.NEXT_PUBLIC_BACKEND_URL + "api/website/orders/all"
```

Spread across 30+ files. If the backend URL changes, you grep-and-replace. Create `lib/api-config.ts`:
```ts
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
export const ADMIN_PATHS = {
  dashboardStats: () => `${API_BASE}api/admin/dashboard/get-dashboard-stats`,
  orders: () => `${API_BASE}api/admin/orders/all`,
  // ...
};
```

## C3. No environment validation

`process.env.NEXT_PUBLIC_BACKEND_URL` may be `undefined` in production if `.env` wasn't loaded. Use `@t3-oss/env-nextjs` or hand-roll a startup check.

## C4. `NEXT_PUBLIC_PASSKEY` should not exist

Even if you fix S1, having `NEXT_PUBLIC_PASSKEY` in env is a smell. Delete it entirely.

## C5. The dashboard "Refunded Orders Admin" feature implies a refund system that may not exist in the backend

Verify `api/admin/orders/admin/refund/*` endpoints exist (per S6 they 404 due to URL bug, but also potentially due to non-existence).

---

# 7. Performance Benchmarks to Establish

- **Lighthouse CI** on `/`, `/dashboard`, `/dashboard/orders`, `/dashboard/products`.
- **Real User Monitoring** via `@vercel/analytics` (already installed).
- **Bundle analysis**: `npx next-bundle-analyzer` to find the heavy modules.

Targets:
- LCP < 2.5 s
- TBT < 200 ms
- JS shipped to `/dashboard` < 500 KB gz

---

# 8. Prioritized Fix Roadmap

## Sprint 1 (1–2 days, blocking before any deploy)

1. **S1** — Delete the passkey flow.
2. **S2** — Set `adminToken` cookie via backend with `httpOnly; Secure; SameSite=Lax`.
3. **S3** — Middleware: verify JWT signature, check role, expand matcher.
4. **S4** — Backend enforcement + audit log + self-demotion guard.
5. **S5** — Fix admin orders page to use `api/admin/orders/all`.
6. **S6** — Fix `BASE_URL/admin/refund/...` double-prefix.
7. **B1, B2, B4** — Delete duplicate `.js`/`.jsx` files; keep `.ts`/`.tsx`.

## Sprint 2 (3–5 days)

8. **P1** — Enable Image Optimization.
9. **P2** — Pick one motion library; uninstall the other.
10. **P4** — Confirm and finish the duplicate-file cleanup.
11. **S8** — Backend CSRF tokens or move JWT to header.
12. **S12** — Replace `window.confirm`/`alert` with Radix modals + audit log.
13. **U1** — Same as S1 (the user-visible part).

## Sprint 3 (1 week)

14. **B6** — Centralize API client.
15. **B7, B8** — Add `loading.tsx` and `error.tsx` boundaries.
16. **P6** — Replace `setInterval` animations with motion.
17. **U12** — Mobile hamburger menu.
18. **S13** — Debounce search inputs.

## Sprint 4 (polish)

19. All 🟡 items.
20. Lighthouse baseline capture.
21. Accessibility audit with axe-core.
22. Bundle analysis + tree-shake audit.

---

# 9. References

- `D:\side-projects\websites\toy-shop\security-issues.md` — Server-side & shared issues.
- `D:\side-projects\websites\toy-shop\web-review.md` — Storefront review.
- `D:\side-projects\websites\toy-shop\admin-panel\next.config.mjs` — Build config.
- `D:\side-projects\websites\toy-shop\admin-panel\proxy.ts` — Auth gate (Next.js 16 renamed `middleware.ts` → `proxy.ts`).
- `D:\side-projects\websites\toy-shop\admin-panel\app\page.tsx` — Login + passkey theatre.
- `D:\side-projects\websites\toy-shop\admin-panel\components\RefundedOrdersAdmin.jsx` — URL prefix bug.
- `D:\side-projects\websites\toy-shop\admin-panel\app\dashboard\orders\Orders.jsx` — Wrong namespace bug.
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security
- OWASP Admin Portals: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/