# 📖 API Server — Swagger Documentation Plan

## Goal
Add OpenAPI 3.0 Swagger documentation to the Express API server so that all API routes are self-documented and testable from the browser via Swagger UI.

## Phases

### ✅ Phase 1 — Web Routes (current)
Document all **public / customer-facing** API routes under `/api/website/*`.

| Route | Description | Status |
|---|---|---|
| Banner | `GET /api/website/banner` | ✅ Done |
| Cart | `GET /api/website/cart/view`, `POST /add`, `PUT /items/update/:itemId`, `PUT /items/remove/:itemId`, `PUT /destroy` | ✅ Done |
| Category (nav) | `GET /api/website/nav` | ✅ Done |
| Color | `GET /api/website/color` | ✅ Done |
| Contact | `POST /api/website/contact` | ✅ Done |
| Coupon | `GET /api/website/coupen/single/:id`, `GET /find` | ✅ Done |
| FAQ | `GET /api/website/faq` | ✅ Done |
| Home Page | `GET /api/website/home-page` | ✅ Done |
| Logo | `POST /api/website/logo` | ✅ Done |
| Material | `GET /api/website/material` | ✅ Done |
| Orders | `POST /create`, `POST /create-razorpay-order`, `POST /verify-payment`, `GET /my-orders`, `GET /:orderId`, `POST /delivery/:orderId`, `PUT /:orderId/cancel`, `POST /webhooks/razorpay`, `POST /verify-delivery-otp`, `POST /mark-to-shipped`, `POST /send-delivery-otp`, `POST /buy-with-cod`, `POST /cancel-by-admin`, `POST /all` | ✅ Done |
| Product | `GET /details/:slug`, `POST /get-by-category/:catSlug/:subCatSlug/:subSubCatSlug`, `GET /get-by-filter`, `GET /get-by-search`, `GET /get-related-products`, `GET /tab-products`, `GET /new-arrivals`, `GET /trending-products`, `GET /best-sellers`, `GET /featured-for-footer`, `GET /all` | ✅ Done |
| Product FAQ | `GET /api/website/product-faq` | ✅ Done |
| Review | `POST /create`, `GET /get/:productId` | ✅ Done |
| Suggestion | `GET /api/website/result/suggestion` | ✅ Done |
| Testimonial | `GET /api/website/testimonial` | ✅ Done |
| User | `POST /register`, `POST /login`, `GET /profile`, `PUT /update-profile`, `POST /change-password`, `POST /forgot-password`, `POST /verify-otp`, `POST /reset-password`, `POST /verify-user`, `POST /complete-verify`, `POST /google-auth-init`, `POST /google-login`, `POST /google-callback`, `POST /re-login`, `POST /refresh`, `POST /logout` | ✅ Done |
| Why Choose Us | `GET /api/website/whyChooseUs` | ✅ Done |
| Wishlist | `GET /wishlist/view`, `POST /add`, `PUT /remove/:productId`, `POST /check/:productId` | ✅ Done |

### 🔜 Phase 2 — Admin Routes (planned)
Document all **admin** routes under `/api/admin/*`. This phase will add JSDoc annotations and schemas for admin endpoints including:
- Product CRUD
- Category / SubCategory / SubSubCategory CRUD
- Banner CRUD
- Order management
- User management
- Home page sections
- Dashboard / analytics
- Audit logs
- Colors, Materials, Sizes
- FAQs, Testimonials, Reviews
- Why Choose Us, Logos
- Product FAQs

---

## Tech Stack
- **`swagger-jsdoc`** — parses JSDoc annotations into an OpenAPI 3.0 spec
- **`swagger-ui-express`** — serves the Swagger UI at `/api/docs`
- **OpenAPI 3.0** — the spec format used

## How to View
1. Start the API server: `cd api && npm run dev`
2. Open `http://localhost:5000/api/docs` in your browser
3. The raw OpenAPI JSON is available at `http://localhost:5000/api/docs.json`

## Swagger Visibility
- In **development**: Swagger UI is always accessible
- In **production**: Swagger is disabled unless `NODE_ENV=production` and `ENABLE_SWAGGER=true` is set
