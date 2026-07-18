export interface CartSyncItem {
  productId: string;
  quantity: number;
  colorId: string | null;
}

export interface WishlistSyncItem {
  _id: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
}

export interface CartItem {
  productId: string;
  slug: string | null;
  quantity: number;
  colorId: string | null;
  isGuest?: boolean;
}

export interface WishlistItem {
  _id: string;
  slug: string | null;
  isGuest?: boolean;
}
