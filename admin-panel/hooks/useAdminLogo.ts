"use client";

import { useState, useEffect, useRef } from "react";

const BACKEND_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:5000/";

/**
 * Shared hook for fetching and caching the admin panel logo.
 *
 * Fetches from `POST /api/website/logo`, caches the result in sessionStorage,
 * and returns the logo URL for use across auth pages and the sidebar.
 *
 * @param cacheKey Optional sessionStorage key (defaults to "admin-logo")
 */
export function useAdminLogo(cacheKey = "admin-logo") {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setLogoUrl(cached);
      setIsLoading(false);
      return;
    }

    const base = BACKEND_URL.endsWith("/") ? BACKEND_URL : BACKEND_URL + "/";
    fetch(base + "api/website/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => res.json())
      .then((json) => {
        if (
          json._status &&
          Array.isArray(json._data) &&
          json._data.length > 0
        ) {
          const url = json._data[0].logo;
          if (url) {
            sessionStorage.setItem(cacheKey, url);
            setLogoUrl(url);
          }
        }
      })
      .catch(() => {
        // Silently fall back to the static icon
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [cacheKey]);

  return { logoUrl, isLoading };
}
