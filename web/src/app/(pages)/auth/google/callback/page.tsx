"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { login, setProfile } from "@/redux/features/auth";
import { clearGuestCart } from "@/redux/features/cart";
import { clearGuestWishlist } from "@/redux/features/wishlist";
import { openPhoneModal } from "@/redux/features/uiSlice";
import {
  syncGuestCartToServer,
  syncGuestWishlistToServer,
  getGuestCartFromStorage,
  getGuestWishlistFromStorage,
} from "@/lib/syncGuestData";
import {
  fetchAndDispatchCart,
  fetchAndDispatchWishlist,
} from "@/lib/fetchCartWislist";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  const dispatch = useDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      // const returnTo = searchParams.get("returnTo");
      const storedReturnTo = localStorage.getItem("googleLoginReturnTo");

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
          dispatch(login(data._data.token));
          dispatch(setProfile(data._data.user));

          // Sync guest cart and wishlist to server
          const guestCart = getGuestCartFromStorage();
          const guestWishlist = getGuestWishlistFromStorage();

          if (guestCart.length > 0 || guestWishlist.length > 0) {
            // Sync guest data to server
            await Promise.all([
              syncGuestCartToServer(data._data.token, guestCart),
              syncGuestWishlistToServer(data._data.token, guestWishlist),
            ]);

            // Clear guest data from localStorage
            dispatch(clearGuestCart());
            dispatch(clearGuestWishlist());

            // Fetch updated cart and wishlist from server
            await Promise.all([
              fetchAndDispatchCart(dispatch),
              fetchAndDispatchWishlist(dispatch),
            ]);
          }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
