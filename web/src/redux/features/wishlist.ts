import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./auth";

export interface WishlistSliceItem {
  _id: string;
  slug: string | null;
  isGuest?: boolean;
}

export interface WishlistState {
  wishlistItems: WishlistSliceItem[];
  totalQuantity: number;
}

const initialState: WishlistState = {
  wishlistItems: [],
  totalQuantity: 0,
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      // Store only the lean fields needed — do NOT spread action.payload so no
      // extra fields (name, image, price, etc.) can sneak into persisted state.
      const { _id, slug, isGuest = false } = action.payload;
      if (state.wishlistItems.find((item) => item._id === _id)) {
        return;
      } else {
        state.wishlistItems.push({ _id, slug, isGuest });
        state.totalQuantity = state.wishlistItems.length;
      }

      // Persist to localStorage for guest users
    },
    removeFromWishlist: (state, action) => {
      const { isGuest = false, _id } = action.payload;
      state.wishlistItems = state.wishlistItems.filter(
        (item) => item._id !== _id
      );
      state.totalQuantity = state.wishlistItems.length;

    },
    setWishlist: (state, action) => {
      const items = Array.isArray(action.payload) ? action.payload : [];
      // Store only lean fields — strip name, image, price, etc.
      state.wishlistItems = items.map((item: { _id?: string; slug?: string }) => ({
        _id: item._id ?? "",
        slug: item.slug ?? null,
      }));
      state.totalQuantity = state.wishlistItems.length;
    },
    // Clear guest wishlist state (call after syncing to server)
    clearGuestWishlist: (state) => {
      state.wishlistItems = [];
      state.totalQuantity = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.wishlistItems = [];
      state.totalQuantity = 0;
    });
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  setWishlist,
  clearGuestWishlist,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;
