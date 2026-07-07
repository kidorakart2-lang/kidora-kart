"use client";

import Cookies from "js-cookie";

/**
 * Clear all auth-related cookies AND the persisted auth Redux state.
 * Call this when a token is expired or the user needs to be logged out.
 */
export function clearAuthCookies(): void {
  const cookieOptions = { path: "/", sameSite: "lax" as const };
  Cookies.remove("userToken", cookieOptions);
  Cookies.remove("userRefreshToken", cookieOptions);
  Cookies.remove("adminToken", cookieOptions);
  Cookies.remove("adminRefreshToken", cookieOptions);

  // Also clear the auth slice from redux-persist so isLogin resets to false
  try {
    const raw = localStorage.getItem("persist:root");
    if (raw) {
      const parsed = JSON.parse(raw);
      delete parsed.auth;
      localStorage.setItem("persist:root", JSON.stringify(parsed));
    }
  } catch {
    // localStorage may be unavailable — ignore
  }
}
