"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProductsByIds, type FetchedProduct } from "./api";

/**
 * Query key factory for product queries.
 */
export const productKeys = {
  all: ["products"] as const,
  detail: (slug: string) => ["products", "detail", slug] as const,
  batch: (ids: string[]) => ["products", "batch", ...ids.slice().sort()] as const,
};

/**
 * Fetch a single product by slug.
 */
export function useProduct(slug: string | null | undefined) {
  return useQuery({
    queryKey: productKeys.detail(slug ?? ""),
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch multiple products by their slugs using useQueries.
 * Returns a Map<slug, FetchedProduct> for easy lookup.
 */
export function useProductsBySlugs(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  const results = useQueries({
    queries: uniqueSlugs.map((slug) => ({
      queryKey: productKeys.detail(slug),
      queryFn: () => fetchProductBySlug(slug),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const productMap = new Map<string, FetchedProduct>();
  results.forEach((result, index) => {
    if (result.data) {
      productMap.set(uniqueSlugs[index], result.data);
    }
  });

  return {
    productMap,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}

/**
 * Fetch multiple products by their MongoDB _id values in a single batch request.
 * Returns a Map<_id, FetchedProduct> for easy lookup.
 */
export function useProductsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const result = useQuery({
    queryKey: productKeys.batch(uniqueIds),
    queryFn: () => fetchProductsByIds(uniqueIds),
    enabled: uniqueIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const productMap = new Map<string, FetchedProduct>();
  if (result.data) {
    result.data.forEach((product) => {
      productMap.set(product._id, product);
    });
  }

  return {
    productMap,
    isLoading: result.isLoading,
    isError: result.isError,
    products: result.data ?? [],
  };
}

