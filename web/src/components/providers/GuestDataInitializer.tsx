"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeGuestCart } from "@/redux/features/cart";
import { initializeGuestWishlist } from "@/redux/features/wishlist";
import Cookies from "js-cookie";

/**
 * This component initializes guest cart and wishlist from localStorage
 * when the app mounts and user is not logged in.
 * It should be placed inside the Redux Provider.
 */
export default function GuestDataInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth: { isLogin: boolean } }) => state.auth.isLogin);

  useEffect(() => {
    // Only initialize guest data if not logged in
    if (!isLogin && !Cookies.get("user")) {
      dispatch(initializeGuestCart());
      dispatch(initializeGuestWishlist());
    }
  }, [dispatch, isLogin]);

  return children;
}
