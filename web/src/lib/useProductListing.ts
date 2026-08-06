"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { ProductData } from "@/types";

interface FilterParams {
  categorySlug: string;
  subCategorySlug: string | string[];
  subSubCategorySlug: string | string[];
  colorIds: string[];
  materialIds: string[];
  priceFrom: number | null;
  priceTo: number | null;
  quickFilter: string | null;
  searchQuery: string | null;
}

interface ProductListingResponse {
  _data: ProductData[];
  totalCount?: number;
  _total?: number;
}

const PRODUCTS_PER_PAGE = 15;
const MAX_PRODUCTS = 200;

/**
 * Build the query string for the get-by-filter endpoint.
 */
function buildFilterParams(filter: FilterParams, page: number): string {
  const params = new URLSearchParams();

  if (filter.categorySlug) params.set("categorySlug", filter.categorySlug);

  const toStr = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? v.join(",") : v;

  const sCat = toStr(filter.subCategorySlug);
  if (sCat) params.set("subCategorySlug", sCat);

  const ssCat = toStr(filter.subSubCategorySlug);
  if (ssCat) params.set("subSubCategorySlug", ssCat);

  if (filter.colorIds.length > 0) params.set("colorIds", filter.colorIds.join(","));
  if (filter.materialIds.length > 0) params.set("materialIds", filter.materialIds.join(","));
  if (filter.priceFrom != null) params.set("priceFrom", String(filter.priceFrom));
  if (filter.priceTo != null) params.set("priceTo", String(filter.priceTo));

  params.set("page", String(page));
  params.set("limit", String(PRODUCTS_PER_PAGE));

  if (filter.quickFilter === "featured") params.set("isFeatured", "true");
  if (filter.quickFilter === "newArrival") params.set("isNewArrival", "true");
  if (filter.quickFilter === "bestSeller") params.set("isBestSeller", "true");
  if (filter.quickFilter === "topRated") params.set("isTopRated", "true");
  if (filter.searchQuery) params.set("searchQuery", filter.searchQuery);

  return params.toString();
}

export const productListingKeys = {
  all: ["product-listing"] as const,
  filtered: (filter: FilterParams) => ["product-listing", filter] as const,
};

/**
 * Infinite query hook for the category product listing page.
 * Caches pages aggressively — navigating back won't re-fetch.
 */
export function useProductListing(filter: FilterParams) {
  return useInfiniteQuery({
    queryKey: productListingKeys.filtered(filter),
    queryFn: async ({ pageParam = 1 }) => {
      const qs = buildFilterParams(filter, pageParam as number);
      const res = await fetch(`/api/website/product/get-by-filter?${qs}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = (await res.json()) as ProductListingResponse;
      return {
        products: data._data ?? [],
        totalCount: data.totalCount ?? data._total ?? 0,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const totalFetched = allPages.reduce((sum, p) => sum + p.products.length, 0);
      if (totalFetched >= MAX_PRODUCTS) return undefined;
      if (lastPage.products.length < PRODUCTS_PER_PAGE) return undefined;
      return (lastPageParam as number) + 1;
    },
    staleTime: 5 * 60 * 1000, // 5min — CacheInvalidationProvider polls /api/revalidate every 30s for admin changes
    gcTime: 10 * 60 * 1000,
  });
}
