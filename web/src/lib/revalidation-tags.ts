/**
 * Cache tag constants for `revalidateTag()`.
 *
 * Every tag below corresponds to a `next: { tags: [...] }` option on a
 * server-side `fetch()` call in the web frontend.  When the admin panel
 * performs a CRUD operation it calls `invalidateCache([...tags])` which
 * POSTs these tags to the `/api/revalidate` endpoint to purge the
 * corresponding data-fetch caches immediately.
 *
 * ── Tag naming convention ───────────────────────────────────────────
 *
 *   "products"            –  any product list (new-arrivals, trending, …)
 *   "product:{id}"        –  a single product detail page
 *   "categories"          –  all category lists
 *   "category:{slug}"     –  a single category / its product grid
 *   "homepage"            –  homepage sections, banners, why-choose-us
 *   "best-sellers"        –  best-sellers list
 *   "flash-sale"          –  flash-sale endpoints
 *   "search"              –  search suggestions / results
 *   "testimonials"        –  testimonial carousel / list
 *   "brand:{slug}"        –  brand-filtered product list
 *   "tabs"                –  tab-products data (silver / gold / gift)
 *   "product-faq"         –  product-specific FAQ sets
 */

// ── Generic scope tags ──────────────────────────────────────────────

export const TAG_PRODUCTS = "products" as const;
export const TAG_CATEGORIES = "categories" as const;
export const TAG_HOMEPAGE = "homepage" as const;
export const TAG_BEST_SELLERS = "best-sellers" as const;
export const TAG_FLASH_SALE = "flash-sale" as const;
export const TAG_SEARCH = "search" as const;
export const TAG_TESTIMONIALS = "testimonials" as const;
export const TAG_TABS = "tabs" as const;
export const TAG_FAQ = "faq" as const;
export const TAG_FILTERS = "filters" as const;
export const TAG_NAVIGATION = "navigation" as const;
export const TAG_FEATURED_PRODUCTS = "featured-products" as const;
export const TAG_PRODUCT_FAQ = "product-faq" as const;

// ── Scoped tag helpers ──────────────────────────────────────────────

/** Tag for a single product detail page (used as `product:${id}`). */
export function productTag(id: string): string {
  return `product:${id}`;
}

/** Tag for a single category page / product grid (used as `category:${slug}`). */
export function categoryTag(slug: string): string {
  return `category:${slug}`;
}

/** Tag for a single brand page (used as `brand:${slug}`). */
export function brandTag(slug: string): string {
  return `brand:${slug}`;
}

// ── Request / response types for the /api/revalidate endpoint ───────

export interface RevalidateRequest {
  /** One or more cache tags to invalidate.  Duplicates are deduplicated server-side. */
  tags: string[];
}

export interface RevalidateResponse {
  success: boolean;
  revalidated: string[];
  error?: string;
}
