"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthToken, clearAuthCookies } from "@/lib/cookies";

/**
 * Query key factory for cart queries.
 */
export const cartKeys = {
  all: ["cart"] as const,
  view: () => ["cart", "view"] as const,
};

interface CartViewResponse {
  _id?: string;
  items?: Array<{
    product: { _id: string };
    quantity: number;
    color?: { _id: string };
  }>;
  totalPrice?: number;
  totalItems?: number;
}

/**
 * Fetch the server-side cart view.
 * Caches for 30 seconds, auto-refetches on window focus.
 * Only enabled when a valid auth token exists.
 */
export function useCartView() {
  const token = getAuthToken();

  return useQuery({
    queryKey: cartKeys.view(),
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/website/cart/view`,
        { headers },
      );
      if (res.status === 401) {
        clearAuthCookies();
        return null;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return (data._status ? data._data : null) as CartViewResponse | null;
    },
    staleTime: 30 * 1000,
    enabled: !!token,
    refetchOnWindowFocus: true,
  });
}
