"use client";

import { updateFullCart } from "@/redux/features/cart";
import { setWishlist } from "@/redux/features/wishlist";
import type { AppDispatch } from "@/redux/store/store";
import { getAuthToken } from "@/lib/getAuthToken";
import { clearAuthCookies } from "@/lib/clearAuthCookies";

async function getCart() {
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/cart/view`,
      {
        headers,
        credentials: "include",
      }
    );
    if (response.status === 401) {
      clearAuthCookies();
      return null;
    }
    if (!response.ok) return null;
    const data = await response.json();
    if (!data._status) return null;
    return data;
  } catch {
    return null;
  }
}

async function getWishlist() {
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/wishlist/view`,
      {
        headers,
        credentials: "include",
      }
    );
    if (response.status === 401) {
      clearAuthCookies();
      return null;
    }
    if (!response.ok) return null;
    const data = await response.json();
    if (!data._status) return null;
    return data;
  } catch {
    return null;
  }
}


function serverItemToSlice(item: Record<string, unknown>) {
  return {
    productId: (item.product as Record<string, unknown>)?._id as string ?? "",
    quantity: (item.quantity as number) ?? 1,
    colorId: ((item.color as Record<string, unknown>)?._id as string) ?? null,
    sizeId: ((item.size as Record<string, unknown>)?._id as string) ?? null,
    isGuest: false,
  };
}

export async function fetchAndDispatchCart(dispatch: AppDispatch) {
  try {
    const [cartData] = await Promise.all([getCart()]);

    if (cartData && cartData._data?.items?.length > 0) {
      dispatch(updateFullCart({
        items: cartData._data.items.map(serverItemToSlice),
        totalPrice: cartData._data.totalPrice ?? 0,
        totalItems: cartData._data.totalItems ?? cartData._data.items.length,
      }));
    }

    return { cart: cartData };
  } catch (error) {
    return { cart: null };
  }
}
export async function fetchAndDispatchWishlist(dispatch: AppDispatch) {
  try {
    const [wishlistData] = await Promise.all([getWishlist()]);

    if (wishlistData && wishlistData._data?.length > 0) {
      dispatch(setWishlist(wishlistData._data || []));
    }

    return { totalWishlist: wishlistData };
  } catch (error) {
    return { totalWishlist: null };
  }
}
