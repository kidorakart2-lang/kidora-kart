"use client";

import Cookies from "js-cookie";

export const getAuthToken = (): string | null => {
  try {
    const root = sessionStorage.getItem("persist:root");
    if (root) {
      const parsed = JSON.parse(root);
      if (parsed.auth) {
        const auth = JSON.parse(parsed.auth);
        if (auth.user) return auth.user;
      }
    }
  } catch {
    // fall through to cookie check
  }

  // Fallback: check js-cookie (set by login flow on the client side)
  try {
    const cookieToken = Cookies.get("userToken");
    if (cookieToken) return cookieToken;
  } catch {
    // ignore
  }

  return null;
};
