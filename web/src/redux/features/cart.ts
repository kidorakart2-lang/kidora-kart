import { createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { logout } from "./auth";
import {
  getGuestCartFromStorage,
  saveGuestCartToStorage,
  clearGuestCartStorage,
} from "@/lib/syncGuestData";

export interface CartSliceItem {
  productId: string;
  product?: Record<string, unknown> | null;
  quantity: number;
  colorId: string | null;
  sizeId: string | null;
  isGuest?: boolean;
}

export interface CartState {
  cartItems: CartSliceItem[];
  totalPrice: number;
  totalQuantity: number;
  buyNowItem: {
    productId: string | null;
    product: Record<string, unknown> | null;
    quantity: number;
    colorId: string | null;
    sizeId: string | null;
  };
}

// Load initial state from localStorage for guest users
const loadInitialState = (): CartState => {
  const guestCart: CartSliceItem[] = getGuestCartFromStorage() as CartSliceItem[];
  return {
    cartItems: guestCart,
    totalPrice: 0,
    totalQuantity: guestCart.reduce(
      (total: number, item: CartSliceItem) => total + (item.quantity || 1),
      0
    ),
    buyNowItem: {
      productId: null,
      product: null,
      quantity: 1,
      colorId: null,
      sizeId: null,
    },
  };
};

const initialState: CartState = {
  cartItems: [],
  totalPrice: 0,
  totalQuantity: 0,
  buyNowItem: {
    productId: null,
    product: null,
    quantity: 1,
    colorId: null,
    sizeId: null,
  },
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Initialize cart from localStorage (call on app mount)
    initializeGuestCart: (state) => {
      const guestCart = getGuestCartFromStorage();
      if (guestCart.length > 0) {
        state.cartItems = guestCart;
        state.totalQuantity = guestCart.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
      }
    },
    addToCart: (state, action) => {
      const {
        productId,
        quantity = 1,
        colorId,
        sizeId,
        isGuest = false,
      } = action.payload;
      const existingItem = state.cartItems.find(
        (item) =>
          item.productId === productId &&
          item.colorId === colorId &&
          item.sizeId === sizeId
      );

      if (existingItem) {
        if (existingItem.quantity + quantity > 10) {
          toast.error("Maximum quantity limit of 10 reached");
          return;
        }
        existingItem.quantity += quantity;
      } else {
        state.cartItems.push({
          ...action.payload,
          quantity: quantity,
        });
      }
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      // Persist to localStorage for guest users
      if (isGuest) {
        saveGuestCartToStorage(state.cartItems);
      }
    },
    removeFromCart: (state, action) => {
      const { productId, colorId, sizeId } = action.payload;
      state.cartItems = state.cartItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.colorId === colorId &&
            item.sizeId === sizeId
          )
      );
      state.totalQuantity = state.cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      saveGuestCartToStorage(state.cartItems);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity, colorId, sizeId } = action.payload;
      const item = state.cartItems.find(
        (item) =>
          item.productId === productId &&
          item.colorId === colorId &&
          item.sizeId === sizeId
      );

      if (item) {
        if (quantity > 10) {
          toast.error("Maximum quantity limit is 10");
          return;
        }
        if (quantity < 1) {
          state.cartItems = state.cartItems.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.colorId === colorId &&
                i.sizeId === sizeId
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
        saveGuestCartToStorage(state.cartItems);
      }
    },
    updateFullCart: (state, action) => {
      state.cartItems = action.payload.items;
      state.totalQuantity = action.payload.totalItems;
      state.totalPrice = action.payload.totalPrice;
    },
    setBuyNowItem: (state, action) => {
      state.buyNowItem = action.payload;
      sessionStorage.setItem("buyNowProduct", JSON.stringify(action.payload));
    },
    // Clear guest cart from localStorage (call after syncing to server)
    clearGuestCart: () => {
      clearGuestCartStorage();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.cartItems = [];
      state.totalPrice = 0;
      state.totalQuantity = 0;
      state.buyNowItem = {
        productId: null,
        product: null,
        quantity: 1,
        colorId: null,
        sizeId: null,
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
  initializeGuestCart,
  clearGuestCart,
} = cartSlice.actions;
export default cartSlice.reducer;
