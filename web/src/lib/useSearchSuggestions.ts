"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export interface SuggestionData {
  suggestions: string[];
  products: Array<{
    _id: string;
    slug: string;
    image: string;
    name: string;
    discount_price: number | null;
    price: number;
  }>;
}

/**
 * Query key factory for search suggestion queries.
 */
export const suggestionKeys = {
  all: ["suggestions"] as const,
  search: (term: string) => ["suggestions", term] as const,
};

/**
 * Debounce a value by the given delay in ms.
 * Returns the debounced value after the delay elapses without changes.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Minimum characters before triggering a search suggestion fetch. */
const MIN_SEARCH_CHARS = 2;

/** Debounce delay in ms — how long after the user stops typing before fetching. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Fetch search suggestions for the given search term.
 * The query is automatically debounced (400ms) — it only fires after the
 * user stops typing. Previously searched terms are cached for 5 minutes.
 *
 * Only enabled when `term.trim().length >= MIN_SEARCH_CHARS`.
 */
export function useSearchSuggestions(term: string) {
  const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const shouldFetch = debouncedTerm.trim().length >= MIN_SEARCH_CHARS;

  return useQuery({
    queryKey: suggestionKeys.search(debouncedTerm),
    queryFn: async () => {
      const res = await fetch(`/api/website/result/suggestion?search=${encodeURIComponent(debouncedTerm)}`);
      if (!res.ok) return { suggestions: [], products: [] };
      const data = await res.json();
      return (data._data ?? { suggestions: [], products: [] }) as SuggestionData;
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 min — search suggestions change rarely
    gcTime: 10 * 60 * 1000,
  });
}
