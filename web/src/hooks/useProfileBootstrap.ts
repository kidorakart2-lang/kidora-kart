"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProfile } from "@/redux/features/auth";
import { useUserProfile } from "@/lib/useProfile";

/**
 * Hook for pages that depend on user profile data (profile, checkout, cart).
 * Uses React Query's useUserProfile() under the hood — cached for 5 min,
 * automatically deduplicated across consumers, and synced to Redux.
 */
export function useProfileBootstrap(): { isLoading: boolean } {
  const dispatch = useDispatch();
  const { data: profile, isLoading } = useUserProfile();

  // Sync profile to Redux when React Query returns fresh data
  useEffect(() => {
    if (profile) {
      dispatch(setProfile(profile));
    }
  }, [profile, dispatch]);

  return { isLoading };
}
