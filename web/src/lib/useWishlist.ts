"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "./getAuthToken";
import { clearAuthCookies } from "./clearAuthCookies";

/**
 * Query key factory for wishlist queries.
 */
export const wishlistKeys = {
  all: ["wishlist"] as const,
  view: () => ["wishlist", "view"] as const,
};



/**
 * Fetch the server-side wishlist view.
 * Caches for 30 seconds, auto-refetches on window focus.
 * Only enabled when a valid auth token exists.
 */
export function useWishlistView() {
  const token = getAuthToken();

  return useQuery({
    queryKey: wishlistKeys.view(),
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/wishlist/view`,
        { headers, credentials: "include" },
      );
      if (res.status === 401) {
        clearAuthCookies();
        return null;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return (data._status ? data._data : null) as Array<{ _id: string; slug?: string }> | null;
    },
    staleTime: 30 * 1000,
    enabled: !!token,
    refetchOnWindowFocus: true,
  });
}
