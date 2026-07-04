"use client";

import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeGuestCart } from "@/redux/features/cart";
import { initializeGuestWishlist } from "@/redux/features/wishlist";
import { login, setProfile } from "@/redux/features/auth";
import { getAuthToken } from "@/lib/getAuthToken";
import {
  fetchAndDispatchCart,
  fetchAndDispatchWishlist,
} from "@/lib/fetchCartWislist";

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
    if (!getAuthToken()) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/user/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch {
      // Silently ignore
    }
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) return;

    refreshIntervalRef.current = setInterval(doRefresh, 10 * 60 * 1000);

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
 * Restore the Redux auth state from the userToken cookie on page load.
 * sessionStorage is cleared on tab close, so redux-persist loses the auth
 * state. This effect detects that scenario and re-hydrates Redux so the
 * Header, Profile, Wishlist, etc. all see the user as logged in.
 */
function useAuthBootstrap() {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth: { isLogin: boolean } }) => state.auth.isLogin);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    const token = getAuthToken();
    if (!token || isLogin) return;

    bootstrapped.current = true;
    dispatch(login(token));

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data._status) {
          dispatch(setProfile(data._data));
        }
      })
      .catch(() => {});

    fetchAndDispatchCart(dispatch);
    fetchAndDispatchWishlist(dispatch);
  }, [dispatch, isLogin]);
}

export default function GuestDataInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth: { isLogin: boolean } }) => state.auth.isLogin);

  useTokenRefresh();
  useAuthBootstrap();

  useEffect(() => {
    if (!isLogin && !getAuthToken()) {
      dispatch(initializeGuestCart());
      dispatch(initializeGuestWishlist());
    }
  }, [dispatch, isLogin]);

  return children;
}
