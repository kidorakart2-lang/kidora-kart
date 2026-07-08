"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Query key for the cache version stamp.
 */
const VERSION_KEY = ["__cache_version"] as const;

/**
 * Polling interval — how often to check if the admin panel has made changes.
 * 30 seconds is a good balance between responsiveness and network overhead.
 */
const POLL_INTERVAL = 30_000;

interface CacheVersionResponse {
  version: number;
  updatedAt: string;
}

/**
 * Internal hook that polls the cache version endpoint and invalidates
 * all React Query caches (except the version stamp itself) when the
 * version changes.
 *
 * Used internally by <CacheInvalidationProvider>.
 */
function useCacheVersionWatcher() {
  const queryClient = useQueryClient();
  const lastVersion = useRef<number | null>(null);

  const { data } = useQuery<CacheVersionResponse>({
    queryKey: VERSION_KEY,
    queryFn: async () => {
      const res = await fetch("/api/revalidate");
      if (!res.ok) throw new Error("Failed to fetch cache version");
      return res.json() as Promise<CacheVersionResponse>;
    },
    refetchInterval: POLL_INTERVAL,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;

    const currentVersion = data.version;

    // First fetch — just record the version, don't invalidate
    if (lastVersion.current === null) {
      lastVersion.current = currentVersion;
      return;
    }

    // Version changed — admin panel made a CRUD change
    if (currentVersion !== lastVersion.current) {
      lastVersion.current = currentVersion;

      // Invalidate all React Query caches EXCEPT the version stamp itself
      // to avoid a potential re-fetch loop.  A full invalidation is safe
      // because React Query only refetches active (mounted/observed) queries.
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== "__cache_version",
      });
    }
  }, [data, queryClient]);
}

/**
 * Wrap your app with this component to enable automatic cache invalidation
 * when the admin panel makes changes.
 *
 * Place this inside <QueryClientProvider> (inside QueryProvider/Client).
 *
 * Polls /api/revalidate every 30 seconds.  When the version stamp changes,
 * all active React Query caches are invalidated, triggering background
 * refetches.  Network overhead: one tiny GET (~150 bytes) every 30 seconds.
 */
export function CacheInvalidationProvider({ children }: { children: React.ReactNode }) {
  useCacheVersionWatcher();
  return children;
}
