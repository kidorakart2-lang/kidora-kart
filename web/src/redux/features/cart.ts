import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./auth";

export interface CartSliceItem {
  productId: string;
  slug: string | null;
  quantity: number;
  colorId: string | null;
  isGuest?: boolean;
}

export interface CartState {
  cartItems: CartSliceItem[];
  totalPrice: number;
  totalQuantity: number;
  buyNowItem: {
    productId: string | null;
    slug: string | null;
    quantity: number;
    colorId: string | null;
  };
}

const initialState: CartState = {
  cartItems: [],
  totalPrice: 0,
  totalQuantity: 0,
  buyNowItem: {
    productId: null,
    slug: null,
    quantity: 1,
    colorId: null,
  },
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const {
        productId,
        slug,
        quantity = 1,
        colorId,
        isGuest = false,
      } = action.payload;
      const existingItem = state.cartItems.find(
        (item) =>
          item.productId === productId &&
          item.colorId === colorId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // Construct a clean object — do NOT spread action.payload so no
        // extra fields (like a full product document) can sneak in.
        state.cartItems.push({
          productId,
          slug,
          quantity,
          colorId,
          isGuest,
        });
      }
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
    },
    removeFromCart: (state, action) => {
      const { productId, colorId } = action.payload;
      state.cartItems = state.cartItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.colorId === colorId
          )
      );
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
    },
    updateQuantity: (state, action) => {
      const { productId, quantity, colorId } = action.payload;
      const item = state.cartItems.find(
        (item) =>
          item.productId === productId &&
          item.colorId === colorId
      );

      if (item) {
        if (quantity < 1) {
          state.cartItems = state.cartItems.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.colorId === colorId
              )
          );
          // toast.success("Item removed from cart");
        } else {
          item.quantity = quantity;
        }
        state.totalQuantity = state.cartItems.reduce(
          (total, item) => total + item.quantity,
          0
        );
      }
    },
    updateFullCart: (state, action) => {
      state.cartItems = action.payload.items;
      state.totalQuantity = action.payload.totalItems;
      state.totalPrice = action.payload.totalPrice;
    },
    setBuyNowItem: (state, action) => {
      // Strip any extra payload fields (e.g. "product", "colorCode", "colorName") —
      // persist only the lean shape so redux-persist doesn't bloat sessionStorage.
      const { productId, slug, quantity, colorId } = action.payload;
      state.buyNowItem = { productId, slug, quantity, colorId };
    },
    // Clear guest cart state (call after syncing to server)
    clearGuestCart: (state) => {
      state.cartItems = [];
      state.totalPrice = 0;
      state.totalQuantity = 0;
      state.buyNowItem = {
        productId: null,
        slug: null,
        quantity: 1,
        colorId: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.cartItems = [];
      state.totalPrice = 0;
      state.totalQuantity = 0;
      state.buyNowItem = {
        productId: null,
        slug: null,
        quantity: 1,
        colorId: null,
      };
    });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateFullCart,
  setBuyNowItem,
  clearGuestCart,
} = cartSlice.actions;
export default cartSlice.reducer;
