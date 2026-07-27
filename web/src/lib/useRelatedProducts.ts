"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Query key factory for related product queries.
 */
export const relatedProductKeys = {
  all: ["related-products"] as const,
  byCategories: (subCategory: string[], subSubCategory: string[]) =>
    ["related-products", ...subCategory.slice().sort(), ...subSubCategory.slice().sort()] as const,
};

/**
 * Fetch related products by subCategory and subSubCategory ids.
 */
export function useRelatedProducts(subCategory: string[], subSubCategory: string[]) {
  const sc = [...new Set(subCategory.filter(Boolean))];
  const ssc = [...new Set(subSubCategory.filter(Boolean))];

  return useQuery({
    queryKey: relatedProductKeys.byCategories(sc, ssc),
    queryFn: async () => {
      const res = await fetch("/api/website/product/get-related-products?" +
          new URLSearchParams({
            subCategoryIds: sc.join(","),
            subSubCategoryIds: ssc.join(","),
          }),
      );
      const data = await res.json();
      return (data._data ?? []) as any[];
    },
    enabled: sc.length > 0 || ssc.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
