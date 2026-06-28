"use client";

import { toast } from "sonner";
import type { CartSyncItem, WishlistSyncItem, SyncResult, CartItem, WishlistItem } from "@/types";

/**
 * Sync guest cart items to the server after login
 */
export async function syncGuestCartToServer(token: string, guestCartItems: CartSyncItem[]): Promise<SyncResult> {
  if (!guestCartItems || guestCartItems.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of guestCartItems) {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/cart/add",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            colorId: item.colorId,
            sizeId: item.sizeId,
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data._status) {
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  if (synced > 0) {
    // toast.success(
    //   `${synced} cart item${synced > 1 ? "s" : ""} synced from your session`
    // );
  }

  return { success: failed === 0, synced, failed };
}

/**
 * Sync guest wishlist items to the server after login
 */
export async function syncGuestWishlistToServer(token: string, guestWishlistItems: WishlistSyncItem[]): Promise<SyncResult> {
  if (!guestWishlistItems || guestWishlistItems.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of guestWishlistItems) {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/wishlist/add",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item._id || item.productId,
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data._status) {
        synced++;
      } else {
        // Item might already exist in wishlist, don't count as failure
        if (data._message?.includes("already")) {
          // Skip, item already in wishlist
        } else {
          failed++;
        }
      }
    } catch (error) {
      failed++;
    }
  }

  if (synced > 0) {
    // toast.success(
    //   `${synced} wishlist item${synced > 1 ? "s" : ""} synced from your session`
    // );
  }

  return { success: failed === 0, synced, failed };
}

/**
 * Get guest cart items from localStorage
 */
export function getGuestCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("guestCart");
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save guest cart items to localStorage
 */
export function saveGuestCartToStorage(cartItems: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("guestCart", JSON.stringify(cartItems));
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Clear guest cart from localStorage
 */
export function clearGuestCartStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("guestCart");
  } catch {
    // Ignore errors
  }
}

/**
 * Get guest wishlist items from localStorage
 */
export function getGuestWishlistFromStorage(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("guestWishlist");
    return stored ? (JSON.parse(stored) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save guest wishlist items to localStorage
 */
export function saveGuestWishlistToStorage(wishlistItems: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("guestWishlist", JSON.stringify(wishlistItems));
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Clear guest wishlist from localStorage
 */
export function clearGuestWishlistStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("guestWishlist");
  } catch {
    // Ignore errors
  }
}
