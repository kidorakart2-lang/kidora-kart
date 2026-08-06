import type { CategoryData } from "@/types";

/**
 * Builds a category page href from the redux navigation data.
 *
 * If `preferred` is provided (e.g. a tab key like "gold-necklaces"), it tries to
 * match a category or sub-category by slug/name before falling back to the
 * first available category+sub-category. This replaces the old generic
 * `/category/shop-by-category` links with real, crawlable category pages.
 */
export function getCategoryHref(
  categories: CategoryData[] | undefined,
  preferred?: string,
): string {
  const list = categories ?? [];
  if (list.length === 0) return "/category";

  if (preferred) {
    const term = preferred.toLowerCase();
    for (const cat of list) {
      if (
        cat.slug?.toLowerCase() === term ||
        cat.name?.toLowerCase() === term
      ) {
        return `/category/${cat.slug}`;
      }
      const sub = (cat.subCategories ?? []).find(
        (s) =>
          s.slug?.toLowerCase() === term || s.name?.toLowerCase() === term,
      );
      if (sub) return `/category/${cat.slug}/${sub.slug}`;
    }
  }

  const first = list[0];
  const firstSub = first.subCategories?.[0];
  if (firstSub) return `/category/${first.slug}/${firstSub.slug}`;
  return `/category/${first.slug}`;
}
