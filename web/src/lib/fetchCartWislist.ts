"use client";

import { updateFullCart } from "@/redux/features/cart";
import { setWishlist } from "@/redux/features/wishlist";
import type { AppDispatch } from "@/redux/store/store";
import Cookies from "js-cookie";

async function getCart() {
  const token = Cookies.get("user");

  if (!token) return null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/cart/view`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "post",
    }
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!response.ok || !data._status) {
    return null;
  }
  return data;
}

async function getWishlist() {
  const token = Cookies.get("user");

  if (!token) return null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/wishlist/view`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "post",
    }
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!response.ok || !data._status) {
    return null;
  }
  return data;
}


export async function fetchAndDispatchCart(dispatch: AppDispatch) {
  try {
    const [cartData] = await Promise.all([getCart()]);

    if (cartData && cartData._data?.items?.length > 0) {
      dispatch(updateFullCart(cartData._data || []));
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
