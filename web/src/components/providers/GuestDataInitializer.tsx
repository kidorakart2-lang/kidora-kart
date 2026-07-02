"use client";

import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeGuestCart } from "@/redux/features/cart";
import { initializeGuestWishlist } from "@/redux/features/wishlist";
import { getAuthToken } from "@/lib/getAuthToken";

/**
 * Proactively refresh the user's access token every 10 minutes
 * (before the 15-minute expiry) to prevent race conditions from
 * parallel auto-refresh attempts in the auth middleware.
 */
function useTokenRefresh() {
  const isLogin = useSelector((state: { auth: { isLogin: boolean } }) => state.auth.isLogin);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(async () => {
    if (!isLogin) return;
    // Only attempt refresh if the js-readable userToken cookie exists.
    // Both cookies now share the same 5-day lifetime, so this is a reliable
    // proxy for the httpOnly refresh-token cookie being present too.
    if (!getAuthToken()) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/user/refresh`,
        {
          method: "POST",
          credentials: "include",
          // Fire-and-forget — middleware handles edge cases
        },
      );
    } catch {
      // Silently ignore
    }
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) return;

    refreshIntervalRef.current = setInterval(doRefresh, 10 * 60 * 1000);

    // Also refresh on page visibility change (user returns after idle)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        doRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isLogin, doRefresh]);
}

/**
 * This component initializes guest cart and wishlist from localStorage
 * when the app mounts and user is not logged in.
 * It should be placed inside the Redux Provider.
 */
export default function GuestDataInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth: { isLogin: boolean } }) => state.auth.isLogin);

  // Proactive token refresh
  useTokenRefresh();

  useEffect(() => {
    // Only initialize guest data if not logged in
    if (!isLogin && !getAuthToken()) {
      dispatch(initializeGuestCart());
      dispatch(initializeGuestWishlist());
    }
  }, [dispatch, isLogin]);

  return children;
}
