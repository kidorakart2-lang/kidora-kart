export interface CartSyncItem {
  productId: string;
  quantity: number;
  colorId: string | null;
  sizeId: string | null;
}

export interface WishlistSyncItem {
  _id?: string;
  productId?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  colorId: string | null;
  sizeId: string | null;
  isGuest?: boolean;
}

export interface WishlistItem {
  _id: string;
  productId?: string;
  isGuest?: boolean;
}
