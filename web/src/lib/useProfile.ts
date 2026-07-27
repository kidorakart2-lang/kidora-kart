"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthToken, clearAuthCookies } from "@/lib/cookies";
import type { UserDetails } from "@/types";

/**
 * Query key factory for user/profile queries.
 */
export const userKeys = {
  all: ["user"] as const,
  profile: () => ["user", "profile"] as const,
};

/**
 * Fetch the authenticated user's profile.
 * Caches for 5 minutes, does not retry on error (401 handled gracefully).
 * Returns `UserDetails | null`.
 */
export function useUserProfile() {
  const token = getAuthToken();

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const res = await fetch(
        `/api/website/user/profile`,
        {
          headers: { Authorization: `Bearer ${token!}` },
        },
      );
      if (res.status === 401) {
        clearAuthCookies();
        return null;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return (data._status ? data._data : null) as UserDetails | null;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!token,
  });
}
