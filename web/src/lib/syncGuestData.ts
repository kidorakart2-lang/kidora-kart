"use client";

import type { CartSyncItem, WishlistSyncItem, SyncResult } from "@/types";

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
      const response = await fetch("/api/website/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            colorId: item.colorId,
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
      const response = await fetch("/api/website/wishlist/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item._id,
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

