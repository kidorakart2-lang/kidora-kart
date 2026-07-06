"use client";

import Cookies from "js-cookie";

/**
 * Clear all auth-related cookies on the client side.
 * Call this when a token is expired or the user needs to be logged out.
 */
export function clearAuthCookies(): void {
  const cookieOptions = { path: "/", sameSite: "lax" as const };
  Cookies.remove("userToken", cookieOptions);
  Cookies.remove("userRefreshToken", cookieOptions);
  Cookies.remove("adminToken", cookieOptions);
  Cookies.remove("adminRefreshToken", cookieOptions);
}
