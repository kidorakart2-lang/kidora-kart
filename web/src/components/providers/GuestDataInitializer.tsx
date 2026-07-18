"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setProfile } from "@/redux/features/auth";
import { updateFullCart } from "@/redux/features/cart";
import { setWishlist } from "@/redux/features/wishlist";
import { getAuthToken } from "@/lib/getAuthToken";
import { useUserProfile } from "@/lib/useProfile";
import { useCartView } from "@/lib/useCart";
import { useWishlistView } from "@/lib/useWishlist";

/**
 * Restore the Redux auth state from the userToken cookie on page load.
 * Uses React Query hooks for cached, deduplicated data fetching.
 */
function useAuthBootstrap() {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth?: { isLogin?: boolean } }) => state.auth?.isLogin ?? false);
  const bootstrapped = useRef(false);

  // React Query — fetch profile, cart, wishlist with caching + dedup
  const { data: profile } = useUserProfile();
  const { data: cartData } = useCartView();
  const { data: wishlistData } = useWishlistView();

  useEffect(() => {
    // Only bootstrap from cookie once
    if (bootstrapped.current) return;
    const token = getAuthToken();
    if (!token || isLogin) return;

    bootstrapped.current = true;
    dispatch(login());
  }, [dispatch, isLogin]);

  // Sync profile to Redux when React Query returns data
  useEffect(() => {
    if (profile) {
      dispatch(setProfile(profile));
    }
  }, [profile, dispatch]);

  // Sync cart to Redux when React Query returns data
  useEffect(() => {
    if (!cartData?.items) return;        const items = cartData.items.map((item: { product?: { _id: string }; quantity?: number; color?: { _id: string } }) => ({
      productId: item.product?._id ?? "",
      quantity: item.quantity ?? 1,
      colorId: item.color?._id ?? null,
      isGuest: false,
    }));
    dispatch(updateFullCart({
      items,
      totalPrice: cartData.totalPrice ?? 0,
      totalItems: cartData.totalItems ?? items.length,
    }));
  }, [cartData, dispatch]);

  // Sync wishlist to Redux when React Query returns data
  useEffect(() => {
    if (wishlistData && Array.isArray(wishlistData)) {
      dispatch(setWishlist(wishlistData));
    }
  }, [wishlistData, dispatch]);
}

export default function GuestDataInitializer({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();

  return children;
}
