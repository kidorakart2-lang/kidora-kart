import Wishlist from "@/app/(sections)/Wishlist";
import GuestWishlist from "@/app/(sections)/GuestWishlist";
import React, { Suspense } from "react";
import { siteConfig } from "@/lib/utils";
import { cookies } from "next/headers";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const metadata = {
  title: `My Wishlist - ${siteConfig.name}`,
  description:
    "Save your favorite toys and games to your wishlist for easy access later.",
  robots: {
    index: false,
    follow: true,
  },
};

async function getWishlist(token: RequestCookie) {
  if (!token) return null;

  const response = await fetch(
    `/api/website/wishlist/view`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  );
  const data = await response.json();

  if (!response.ok || !data._status) {
    return null;
  }
  return data;
}

export default async function Page() {
  const cookie = await cookies();
  const token = cookie.get("userToken");

  // If no token, show guest wishlist (which reads from Redux/localStorage)
  if (!token) {
    return <GuestWishlist />;
  }

  const wishlist = await getWishlist(token);
  return (
    <div>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Wishlist wishlist={wishlist?._data} />
      </Suspense>
    </div>
  );
}
