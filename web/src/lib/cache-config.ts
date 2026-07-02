/**
 * Cache duration configuration for the web frontend.
 *
 * All durations are in seconds.
 *
 * These values are used by the `cacheLife` profiles in `next.config.ts`.
 * Since the admin panel can proactively invalidate caches via
 * `invalidateCache()` → `/api/revalidate`, durations can be generous —
 * updates are pushed, not waited for.
 */

export const CACHE = {
  /** Products: price/stock changes propagate via admin panel invalidation */
  products: {
    stale: 600,       // 10 min — serve stale while revalidating
    revalidate: 7200, // 2 hr   — max age before re-fetch
    expire: 86400,    // 24 hr  — hard expiry from cache store
  },

  /** Homepage: banners, sections, testimonials, why-choose-us */
  homepage: {
    stale: 3600,       // 1 hour
    revalidate: 14400, // 4 hr
    expire: 86400,     // 24 hr
  },

  /** Categories: hierarchy changes rarely, admin invalidates on change */
  categories: {
    stale: 7200,        // 2 hr
    revalidate: 86400,  // 24 hr
    expire: 604800,     // 7 days
  },

  /** Filters: colors, materials — very stable */
  filters: {
    stale: 7200,
    revalidate: 86400,
    expire: 604800,
  },

  /** FAQ content: almost never changes */
  faq: {
    stale: 86400,       // 24 hr
    revalidate: 604800, // 7 days
    expire: 2592000,    // 30 days
  },

  /** Testimonials */
  testimonials: {
    stale: 7200,
    revalidate: 86400,
    expire: 604800,
  },

  /** Search results: more dynamic */
  search: {
    stale: 600,
    revalidate: 3600,
    expire: 14400,
  },

  /** Navigation menu */
  navigation: {
    stale: 86400,
    revalidate: 604800,
    expire: 2592000,
  },

  /** Best sellers / flash sale product lists */
  "best-sellers": {
    stale: 600,
    revalidate: 3600,
    expire: 14400,
  },

  /** Tab products (silver/gold/gift) */
  tabs: {
    stale: 600,
    revalidate: 7200,
    expire: 28800,
  },

  /** Default max-age profile used by revalidateTag() */
  max: {
    stale: 7200,
    revalidate: 86400,
    expire: 604800,
  },
} as const;

/** Type for a single cache profile. */
export interface CacheProfile {
  stale: number;
  revalidate: number;
  expire: number;
}

/** Type for the full cache config. */
export type CacheConfig = Record<string, CacheProfile>;
