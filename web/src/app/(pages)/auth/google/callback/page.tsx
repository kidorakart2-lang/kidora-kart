"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { login, setProfile } from "@/redux/features/auth";
import { clearGuestCart } from "@/redux/features/cart";
import { clearGuestWishlist } from "@/redux/features/wishlist";
import { openPhoneModal } from "@/redux/features/uiSlice";
import {
  syncGuestCartToServer,
  syncGuestWishlistToServer,
} from "@/lib/syncGuestData";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/lib/useCart";
import { wishlistKeys } from "@/lib/useWishlist";
import { userKeys } from "@/lib/useProfile";
import type { RootState } from "@/redux/store/store";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Read guest data from Redux state (persisted in localStorage via redux-persist)
  const guestCartItems = useSelector((state: RootState) => state.cart.cartItems);
  const guestWishlistItems = useSelector((state: RootState) => state.wishlist.wishlistItems);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      // const returnTo = searchParams.get("returnTo");
      const storedReturnTo = localStorage.getItem("googleLoginReturnTo");

      if (code && sessionStorage.getItem(`google_cb_${code}`)) return;
      if (code) sessionStorage.setItem(`google_cb_${code}`, "1");

      if (error) {
        toast.error("Google sign-in was cancelled");
        router.push("/");
        return;
      }

      if (!code) {
        toast.error("No authorization code received");
        router.push("/");
        return;
      }
      // Get mobile from localStorage (set during checkout for guests)
      const checkoutMobile = localStorage.getItem("checkoutMobile");

      try {
        // Send code to backend
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "api/website/user/google-callback",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              state: searchParams.get("state") || "",
              mobile: checkoutMobile || "",
            }),
          }
        );

        const data = await res.json();

        if (data._status) {
          toast.success(data._message || "Login successful!");
          dispatch(login());
          dispatch(setProfile(data._data.user));

          // Sync guest cart and wishlist to server (read from Redux state persisted in localStorage)
          if ((guestCartItems?.length ?? 0) > 0 || (guestWishlistItems?.length ?? 0) > 0) {
            await Promise.all([
              syncGuestCartToServer(data._data.token, guestCartItems),
              syncGuestWishlistToServer(data._data.token, guestWishlistItems),
            ]);
            dispatch(clearGuestCart());
            dispatch(clearGuestWishlist());
          }

          // Invalidate React Query caches — hooks in Header/GuestDataInitializer auto-refetch
          queryClient.invalidateQueries({ queryKey: cartKeys.all });
          queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
          queryClient.invalidateQueries({ queryKey: userKeys.all });

          localStorage.removeItem("googleLoginReturnTo");
          localStorage.removeItem("checkoutMobile");
          // Get return URL from localStorage and clear it

          // Check if user has phone number, if not show phone modal
          if (!data._data.user?.mobile) {
            // Store flag to show phone modal after navigation
            localStorage.setItem("showPhoneModal", "true");
          }

          router.push(storedReturnTo || "/profile");
        } else {
          localStorage.removeItem("googleLoginReturnTo");
          localStorage.removeItem("checkoutMobile");

          toast.error(data._message || "Login failed");
          router.push(storedReturnTo || "/");
        }
      } catch (error) {
        localStorage.removeItem("googleLoginReturnTo");
        localStorage.removeItem("checkoutMobile");

        toast.error("Authentication failed");
        router.push(storedReturnTo || "/");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
