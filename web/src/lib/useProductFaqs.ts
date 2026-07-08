"use client";

import { useQuery } from "@tanstack/react-query";

export interface FaqEntry {
  question: string;
  answer: string;
  order: number;
}

export interface FaqSet {
  _id: string;
  entries: FaqEntry[];
}

/**
 * Query key factory for product FAQ queries.
 */
export const faqKeys = {
  byProduct: (productId: string) => ["product-faqs", productId] as const,
};

/**
 * Fetch FAQs for a given product.
 */
export function useProductFaqs(productId: string | null | undefined) {
  return useQuery({
    queryKey: faqKeys.byProduct(productId ?? ""),
    queryFn: async () => {
      const params = new URLSearchParams({ product: productId! });
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/product-faq?" + params.toString(),
      );
      const data = await res.json();
      return (data._data ?? []) as FaqSet[];
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 min — FAQs don't change often
  });
}
