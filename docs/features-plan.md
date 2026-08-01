# Feature Plan — Geolocation Checkout Fill + Product Variants

Two independent features. No shared schema, but both touch checkout pricing, so they
should be implemented in the order below and verified together at the end.

- **Feature 1 (F1): Geolocation** — auto-detect guest location on checkout entry,
  reverse-geocode via LocationIQ, pre-fill the shipping address form.
- **Feature 2 (F2): Product variants** — two kinds, both sellable from the product
  detail page via a Buy-Now-with-variant flow:
  - **Quantity tier** ("Buy 5 at ₹100", "Buy 10 at only ₹190") — variant has a
    `quantity` (units in pack) and a pack `price`.
  - **Option variant** ("with stand" / "without stand") — variant has `quantity: 1`
    and its own `price`.

---

## Feature 1 — Geolocation Auto-Fill on Checkout

### Behavior
1. Guest (no `userToken` cookie) mounts `/checkout`.
2. Browser `navigator.geolocation.getCurrentPosition()` fires automatically
   (permission prompt shown by browser).
3. On success, `{ lat, lon }` is POSTed to a new backend endpoint that calls the
   **LocationIQ reverse-geocode** API (key stays server-side).
4. Response is mapped to form fields and written into the shipping address form
   (only empty fields are overwritten; every field stays user-editable).
5. If permission is denied / API fails / location is outside India → silent no-op;
   a manual **"Detect Location"** button in the form allows retry at any time
   (button also usable by logged-in users).

### Backend (`api/`)
| Step | File | Change |
|------|------|--------|
| 1 | `api/src/config/env.ts` | Add `LOCATIONIQ_API_KEY: z.string().min(1).optional()` + export. |
| 2 | `api/.env.example` + `api/.env` | Add `LOCATIONIQ_API_KEY` (free key from locationiq.com, "Standard" tier is fine). |
| 3 | `api/src/routes/web/location.routes.ts` (new) | `POST /reverse-geocode` — public, rate-limited (reuse existing rate-limit middleware used by `shiprocket.routes.ts:230`), body `{ lat, lng }`. |
| 4 | `api/src/controller/web/location.controller.ts` (new) | Validate `lat` ∈ [-90,90], `lng` ∈ [-180,180] (numbers). Call `https://us1.locationiq.com/v1/reverse?key=<KEY>&lat=..&lon=..&format=json&accept-language=en` with short timeout (axios/node-fetch, whichever the API already uses). Return mapped fields: `{ city, state, pincode, area, street, country, displayName }` or 422 on non-India / missing postcode. Cache successful results in-memory (node-cache, same as existing usage) keyed by `lat,lng` rounded to 4 decimals. |
| 5 | `api/src/server.ts` | Mount `app.use("/api/website/location", locationRoutes)` next to existing route mounts (~line 162–168). |

Mapping (LocationIQ reverse `address` object → order fields):
- `postcode` → `pincode` (strip non-digits, max 6 — India pincodes)
- `city` \|\| `town` \|\| `village` → `city`
- `state` → `state` (must match one of `INDIAN_STATES`; if unmatched, try removing common suffixes like " State"; if still unmatched → return empty so UI leaves it blank)
- `road` → `street` (fallback `suburb` → `area`)
- `country` must be `India` (or `IN` / contains "India") else return 422 with `_message: "Location outside India"`.

### Frontend (`web/`)
| Step | File | Change |
|------|------|--------|
| 1 | `web/next.config.ts:68` | **Required**: remove `geolocation=()` from the `Permissions-Policy` header (keep `camera=(), microphone=()`). Without this the browser API is hard-blocked. |
| 2 | `web/src/lib/geolocation.ts` (new) | `detectLocation()`: wraps `navigator.geolocation.getCurrentPosition` (10s timeout, `maximumAge: 600000`) in a Promise; then POSTs `/api/website/location/reverse-geocode` and returns the mapped address `{ pincode?, city?, state?, area?, street? }`. Handles all errors with typed results `{ ok: true, address } \| { ok: false, reason: "denied" \| "unsupported" \| "api" \| "outside-india" }`. |
| 3 | `web/src/app/(sections)/Checkout.tsx` | On mount, if `!isLoggedIn && !orderData.shippingAddress.pincode` (and not already attempted, tracked in a ref) → call `detectLocation()`; merge result into `orderData.shippingAddress` via existing `setOrderData` (only set fields that are currently empty). Guard so a running login-modal flow or user typing doesn't get clobbered. |
| 4 | `web/src/components/checkout/ShippingAddressForm.tsx` | Add a **"Detect Location"** button (MapPin icon, matches the existing "Check" pincode button styling, ~line 70–77) with loading state; renders a subtle success toast / inline hint when fields are filled; disabled while already filling. Pass handler + state via props from `Checkout.tsx`. |
| 5 | `web/src/app/(pages)/checkout/page.tsx` | No change (thin wrapper). |

### Edge cases
- Browser without geolocation support / HTTP non-localhost origin → button hidden, auto-detect skipped.
- Permission denied → no prompt spam: auto-detect runs **once per session** (sessionStorage flag), manual button always available.
- Logged-in users: no auto-detect on entry (profile address is auto-filled instead), but manual button works.
- Address prompt ("Saved address found") and geolocation fill must not fight — geolocation fill only applies when the form has no address yet; profile-address flow takes precedence.
- Shiprocket estimate recalculates automatically once pincode changes (existing `useShippingEstimate` keyed off pincode).

### Acceptance criteria (F1)
- [ ] Guest on fresh browser opens `/checkout` → permission prompt → fields auto-filled (pincode/city/state/area).
- [ ] Deny permission → nothing fills, no error spam, "Detect Location" button still present.
- [ ] Logged-in user → no auto-prompt; button still works.
- [ ] All auto-filled fields editable before payment.
- [ ] `LOCATIONIQ_API_KEY` never exposed to the client (grep build output for "locationiq").

---

## Feature 2 — Product Variants (quantity tiers + option variants)

### Data model — `api/src/models/product.ts`
Add after `discount_price` (~line 136):

```ts
variants: [
  {
    name: { type: String, required: true, trim: true },          // "Buy 5 at ₹100", "With Stand"
    type: { type: String, enum: ["option", "quantity"], required: true },
    quantity: { type: Number, default: 1, min: 1 },              // pack size; 1 for option variants
    price: { type: Number, required: true, min: 0 },             // TOTAL price for the pack (quantity type) or unit price (option type)
    discount_price: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: null, min: 0 },              // optional per-variant stock; null → use product.stock
  },
],
default: [],
```

**Pricing semantics (decision):**
- `price`/`discount_price` on a **quantity** variant = total pack price (e.g. "Buy 5 at ₹100" → `quantity: 5, price: 100`).
- Derived unit price used in cart/order line items: `unitPrice = round2(price / quantity)`, `subtotal = round2(unitPrice × quantity) = price`. Float-safe via `Math.round(x * 100) / 100` at every step (check existing rounding helpers in `cartValidation.service.ts:159-160` / `order.controller.ts` — they currently don't round; add a shared `round2` util).
- **Option** variants: `quantity: 1`, price = price of that option.
- Variant without `discount_price` → show `price` (same pattern as product level).
- **Security**: server always recomputes price from DB variant; client-sent price is never trusted.

### API (`api/`)
| Step | File | Change |
|------|------|--------|
| 1 | `api/src/models/product.ts` | Add `variants` sub-schema above (indexing: none needed; array is small). |
| 2 | `api/src/controller/admin/adminProduct.controller.ts` | **create** (~line 44) & **update** (~line 346): normalize `req.body.variants` (JSON string from FormData → parse; arrays pass through), validate each: name non-empty, type ∈ {option, quantity}, quantity ≥ 1 (integer), price > 0, discount_price ≤ price, stock ≥ 0 or null. Reject if any invalid (`throw new Error("Invalid variant ...")` — matches existing style). |
| 3 | `api/src/routes/web/product.routes.ts` + `api/src/controller/web/product.controller.ts:12` | Add `variants` to the public field select list so the detail endpoint returns them. |
| 4 | `api/src/controller/web/cart.controller.ts` (`addToCart` ~line 72–159) | Accept optional `variantId`; verify variant exists on product & `type` matches usage; stock check: variant.stock ?? product.stock vs requested quantity; dedupe key becomes `productId + colorId + variantId` (update existing dedupe ~lines 113–128). |
| 5 | `api/src/services/cartValidation.service.ts` (`validateAndPriceCart` ~line 50–182) | When item has `variantId`: load product variants, use variant pricing (`priceAtPurchase = unitPrice`, `subtotal = pack price`), set `quantity` from item (buyer chooses pack → quantity = variant.quantity when it comes from Buy-Now; for cart items, quantity = variant.quantity fixed). |
| 6 | `api/src/models/order.ts` (items ~lines 20–60) | Add to item sub-schema: `variantId: { type: mongoose.Schema.Types.ObjectId, ref: "products", default: null }`, `variantName: { type: String, default: "" }`. |
| 7 | `api/src/controller/web/order.controller.ts` (`createOrder` ~line 39–388) | Pass `variantId`/`variantName` through to order items; weight calc (~line 173–186) already multiplies by `vi.quantity` so pack weight is correct automatically. |
| 8 | `api/src/routes/web/cart.routes.ts` | No new routes needed (payload only). |

### Web storefront (`web/`)
| Step | File | Change |
|------|------|--------|
| 1 | `web/src/types/product.ts` | Add `Variant { _id: string; name: string; type: "option" \| "quantity"; quantity: number; price: number; discount_price?: number | null; stock?: number | null }`; add `variants?: Variant[]` to `ProductData` (~line 23–59). |
| 2 | `web/src/redux/features/cart.ts` | `CartSliceItem` (~line 4–10): add `variantId: string | null`. `addToCart` dedupe (lines 48–55): key on `productId + colorId + variantId`. `setBuyNowItem` (lines 118–123): whitelist `variantId` in the kept fields (it currently strips unknown payload fields). |
| 3 | `web/src/app/(pages)/product-details/[slug]/ProductDetail.tsx` | New **"Choose Option"** variant selector under the price block (~lines 300–334): render each variant as a selectable pill/card — name, price (`₹{discount_price ?? price}`), strike-through MRP if `discount_price`, per-unit hint for quantity type (`₹{round2(price/quantity)}/unit`). Default = first variant NOT auto-selected (user picks; Buy Now disabled until chosen — same UX as color selection). Variant stock (variant.stock ?? product.stock) gates the button/quantity stepper. `handleBuyNow` (~line 138–149) and `cartObj`/`handleAddToCart` (~line 173–216): attach `variantId` when selected; for quantity variants set `quantity = variant.quantity` (override user stepper). |
| 4 | `web/src/app/(sections)/Checkout.tsx` | Direct-purchase path (~lines 90–131): when item has `variantId`, resolve variant from fetched product; set `quantity = variant.quantity`; **price = variant.discount_price ?? variant.price** (lines 149–152 totalAmount must use variant price, not product price). Display variant name in item line. Cart path: same via `productMap`. |
| 5 | `web/src/app/(sections)/Cart.tsx` | Show variant name under item title; remove/update calls unchanged (id-based). |
| 6 | `web/src/app/(sections)/MyOrder.tsx` (+ `OrderSuccess.tsx` if it lists items) | Render `variantName` next to item name. |
| 7 | `web/src/lib/orderService.ts` | No change — payload passes through (verify `DirectPurchaseItem` type in `web/src/types/product.ts:101-111` gets `variantId`). |

### Admin panel (`admin-panel/`)
| Step | File | Change |
|------|------|--------|
| 1 | `admin-panel/lib/types/index.ts` | `Product` (~line 78–119): add `variants?: Variant[]` (mirror web type). `ProductFormData` (~line 272–308): add `variants: VariantDraft[]` where draft = `{ name, type, quantity, price, discount_price, stock }` (strings for form inputs). |
| 2 | `admin-panel/components/product/ProductForm.tsx` | New collapsible section **"Variants / Bulk Pricing"** after Discount Price (~line 119): dynamic list with rows — Type select (Quantity Pack / Option), Name, Quantity (shown for Quantity Pack), Price, Discount Price (optional), Stock (optional), Remove-row button, "Add Variant" button. Reuse existing section header pattern of this form. |
| 3 | `admin-panel/app/dashboard/products/ProductPage.tsx` | `handleEdit` prefill (lines 124–186): map `product.variants` → form drafts. `handleSubmit` validation (lines 191–231): name required, price > 0, discount ≤ price, quantity ≥ 2 for quantity packs (or ≥ 1), max 10 variants. |
| 4 | `admin-panel/lib/products-api.ts` | `buildProductFormData` (line 75–126): `fd.append("variants", JSON.stringify(formData.variants))` when non-empty. `buildUpdateFormData` (line 148–213): compare `JSON.stringify(variants)` to initial snapshot; include when changed. |
| 5 | `api` create/update controllers | Parse `variants` JSON string (step 2 of API table above). |
| 6 | Admin order views (`admin-panel` order tables/detail) | Show `variantName` on line items (cosmetic, low priority). |

### Edge cases
- **Stock**: per-variant `stock` overrides product stock when set; quantity-tier checkout consumes `variant.quantity` units — validate `variant.stock >= variant.quantity` (and product stock fallback).
- **Old carts / buy-now items without `variantId`** → behave exactly as today (variant fields null/undefined throughout).
- **Idempotency** (`order.controller.ts` lines 232–289): hash already covers items incl. quantity; variant items produce distinct hash — no change needed, verify with a test.
- **Guest cart merge on login** (`cart.controller.ts` server-side merge): dedupe key must include `variantId`, else merge collapses distinct variants.
- **Variant deleted while in cart** → server rejects with clear message ("Variant no longer available"), cart UI shows toast (existing error path).
- **Rounding**: single shared `round2` helper used in unit-price derivation, subtotals, and discount computation to avoid ₹99/5-style float drift.

### Acceptance criteria (F2)
- [ ] Admin creates product with a quantity tier ("Buy 5 at ₹100") and an option variant ("With Stand" ₹50).
- [ ] Product detail page shows both variants with correct prices; selecting one and clicking Buy Now lands on checkout with the variant name, quantity (5 for the pack), and pack price.
- [ ] Add-to-cart with variant works for guest + logged-in; two different variants of the same product coexist in the cart.
- [ ] Order confirmation and My Orders show variant name and correct totals.
- [ ] Server rejects tampered price payloads (price recomputed server-side).
- [ ] Existing products without variants render and buy exactly as before.

---

## Implementation order

1. **F1 backend** (env, location route/controller, mount) → **F1 frontend** (Permissions-Policy fix, geolocation lib, checkout integration, form button).
2. **F2 data model + API** (schema, admin controller validation, public select, cart, order items).
3. **F2 web** (types, redux, product detail UI, checkout/cart display).
4. **F2 admin** (types, form editor, form-data builders, prefill).
5. **Verification** — `pnpm typecheck`, `pnpm lint`, build all three packages (`pnpm build`); manual flows:
   - Guest checkout geolocation fill → order.
   - Variant buy-now, variant cart, variant order → confirm totals/stock.
   - Regression: plain product buy-now, color selection, guest merge on login.

## Open decisions (confirmed assumptions — flag if different)
- LocationIQ call is proxied through the API server (key never client-side). Alternative: direct browser call with `NEXT_PUBLIC_LOCATIONIQ_API_KEY` (simpler, exposes key — not recommended).
- Quantity-tier variant `price` = total pack price; unit price derived server-side (float-safe rounding).
- Auto-detect runs once per session on checkout entry for guests only, with a manual button for everyone.
