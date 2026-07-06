"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProfile, logout } from "@/redux/features/auth";
import { getAuthToken } from "@/lib/getAuthToken";
import { clearAuthCookies } from "@/lib/clearAuthCookies";
import type { RootState } from "@/redux/store/store";

/**
 * Hook for pages that depend on user profile data (profile, checkout, cart).
 * Checks if:
 * 1. A user token cookie exists → user should be logged in
 * 2. But Redux profile details are empty → session wasn't bootstrapped yet
 *
 * If both conditions are true, fetches the profile from the server and
 * dispatches it to Redux. If the fetch fails (e.g. expired token), clears
 * cookies and logs the user out.
 */
export function useProfileBootstrap(): { isLoading: boolean } {
  const dispatch = useDispatch();
  const bootstrapped = useRef(false);
  const details = useSelector((state: RootState) => state.auth.details);
  const isLogin = useSelector((state: RootState) => state.auth.isLogin);

  useEffect(() => {
    // Only run once per mount
    if (bootstrapped.current) return;
    const token = getAuthToken();
    if (!token) return;

    // Profile data already populated — nothing to do
    if (details?._id) return;

    bootstrapped.current = true;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      },
    )
      .then(async (res) => {
        if (res.status === 401) {
          // Token expired — clear session
          clearAuthCookies();
          dispatch(logout());
          return null;
        }
        const data = await res.json();
        if (data._status && data._data) {
          dispatch(setProfile(data._data));
        } else {
          // Invalid response — treat as logged out
          clearAuthCookies();
          dispatch(logout());
        }
      })
      .catch(() => {
        // Network error — don't log out, just keep stale state
      });
  }, [dispatch, details?._id]);

  return { isLoading: false };
}
