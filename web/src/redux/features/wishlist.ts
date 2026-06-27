import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./auth";
import {
  getGuestWishlistFromStorage,
  saveGuestWishlistToStorage,
  clearGuestWishlistStorage,
} from "@/lib/syncGuestData";

export interface WishlistItem {
  _id: string;
  productId?: string;
  isGuest?: boolean;
}

export interface WishlistState {
  wishlistItems: WishlistItem[];
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
    // Initialize wishlist from localStorage (call on app mount)
    initializeGuestWishlist: (state) => {
      const guestWishlist = getGuestWishlistFromStorage();
      if (guestWishlist.length > 0) {
        state.wishlistItems = guestWishlist;
        state.totalQuantity = guestWishlist.length;
      }
    },
    addToWishlist: (state, action) => {
      const { isGuest = false, ...itemData } = action.payload;
      if (state.wishlistItems.find((item) => item._id === itemData._id)) {
        return;
      } else {
        state.wishlistItems.push(itemData);
        state.totalQuantity = state.wishlistItems.length;
      }

      // Persist to localStorage for guest users
      if (isGuest) {
        saveGuestWishlistToStorage(state.wishlistItems);
      }
    },
    removeFromWishlist: (state, action) => {
      const { isGuest = false, _id } = action.payload;
      state.wishlistItems = state.wishlistItems.filter(
        (item) => item._id !== _id
      );
      state.totalQuantity = state.wishlistItems.length;

      // Update localStorage for guest users
      if (isGuest) {
        saveGuestWishlistToStorage(state.wishlistItems);
      }
    },
    setWishlist: (state, action) => {
      state.wishlistItems = action.payload;
      state.totalQuantity = action.payload.length;
    },
    // Clear guest wishlist from localStorage (call after syncing to server)
    clearGuestWishlist: () => {
      clearGuestWishlistStorage();
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
  initializeGuestWishlist,
  clearGuestWishlist,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;
