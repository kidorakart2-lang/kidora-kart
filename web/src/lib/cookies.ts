"use client";

import Cookies from "js-cookie";

/**
 * Read the non-httpOnly `userToken` cookie set by the server.
 * Returns the token string, or `null` if not present.
 *
 * The server's `Set-Cookie` header (for the non-httpOnly variant) is
 * forwarded through the Next.js rewrite proxy, so `js-cookie` can read
 * it from the frontend domain without any client-side `Cookies.set()`.
 *
 * @see api/src/lib/tokens.ts — `clientAccessTokenCookieOptions`
 * @see api/src/controller/web/user.controller.ts — `setSessionCookies`
 */
export function getAuthToken(): string | null {
  try {
    const cookieToken = Cookies.get("userToken_client") || Cookies.get("userToken");
    if (cookieToken) return cookieToken;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Clear all auth-related cookies AND the persisted auth Redux state.
 *
 * Call this when a token is expired, the session is dead, or the user
 * explicitly logs out. The server also clears httpOnly cookies via the
 * logout endpoint's `Set-Cookie: max-age=0` response.
 */
export function clearAuthCookies(): void {
  const cookieOptions = { path: "/", sameSite: "lax" as const };
  Cookies.remove("userToken_client", cookieOptions);
  Cookies.remove("userRefreshToken", cookieOptions);
  Cookies.remove("adminToken_client", cookieOptions);
  Cookies.remove("adminRefreshToken", cookieOptions);
  // Clean up old cookie names in case they still exist from before the rename
  Cookies.remove("userToken", cookieOptions);
  Cookies.remove("adminToken", cookieOptions);

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
