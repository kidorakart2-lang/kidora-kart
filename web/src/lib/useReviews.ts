"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./getAuthToken";

export interface Review {
  _id: string;
  verified: boolean;
  userId: { _id?: string; avatar?: string; name: string };
  createdAt: string;
  comment: string;
  rating: number;
}

export interface ReviewResponse {
  _data: Review[];
  _rating: number;
}

/**
 * Query key factory for review queries.
 */
export const reviewKeys = {
  byProduct: (productId: string) => ["reviews", productId] as const,
};

/**
 * Fetch reviews for a given product.
 */
export function useProductReviews(productId: string | null | undefined) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/review/get/${productId}`,
      );
      const data = (await res.json()) as ReviewResponse;
      return {
        reviews: data._data ?? [],
        averageRating: data._rating ?? 0,
      };
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Submit a review mutation — invalidates review cache on success.
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      comment,
      rating,
    }: {
      productId: string;
      comment: string;
      rating: number;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/review/create`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ comment, rating, productId }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err._message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(variables.productId) });
    },
  });
}
