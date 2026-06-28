import { useState, useEffect } from "react";

/**
 * Debounce a value by the specified delay in milliseconds.
 * Useful for search inputs that trigger API calls.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * // useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
