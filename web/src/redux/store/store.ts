import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createTransform,
  type PersistConfig,
} from "redux-persist";
import encryptTransform from "@/lib/persistTransform";
import authReducer from "../features/auth";
import cartReducer from "../features/cart";
import wishlistReducer from "../features/wishlist";
import filtersReducer from "../features/filters";
import uiReducer from "../features/uiSlice";
import logoReducer from "../features/logo";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  filters: filtersReducer,
  ui: uiReducer,
  logo: logoReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Custom storage wrapper that silently handles QuotaExceededError
const createSafeStorage = (): PersistConfig<RootState>["storage"] => {
  if (typeof window === "undefined") {
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: storageSession } = require("redux-persist/lib/storage/session");
  return {
    ...storageSession,
    setItem: async (key: string, value: string) => {
      try {
        await storageSession.setItem(key, value);
      } catch (err) {
        if (err instanceof DOMException && err.name === "QuotaExceededError") {
          console.warn("Storage quota exceeded, clearing persisted state");
          await storageSession.removeItem("persist:root");
          try {
            await storageSession.setItem(key, value);
          } catch {
            console.warn("Still unable to store after clearing, persisting disabled");
          }
        } else {
          throw err;
        }
      }
    },
  };
};

// Strip heavy product data from cart items before persisting
const cartItemTransform = createTransform(
  (inboundState: Record<string, unknown>) => {
    if (Array.isArray(inboundState.cartItems)) {
      return {
        ...inboundState,
        cartItems: inboundState.cartItems.map(
          (item: Record<string, unknown>) => ({
            productId: item.productId,
            quantity: item.quantity,
            colorId: item.colorId,
            sizeId: item.sizeId,
            isGuest: item.isGuest,
          })
        ),
      };
    }
    return inboundState;
  },
  (outboundState: Record<string, unknown>) => outboundState,
  { whitelist: ["cart"] }
);

// Strip auth token before persisting — token lives only in the cookie
const authTokenFilter = createTransform(
  (inboundState: Record<string, unknown>) => {
    const { user: _user, ...rest } = inboundState;
    return rest;
  },
  (outboundState: Record<string, unknown>) => {
    return { ...outboundState, user: null };
  },
  { whitelist: ["auth"] }
);

// Configuration for redux-persist
const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage: createSafeStorage(),
  whitelist: ["cart", "wishlist", "auth"],
  transforms: [
    ...(encryptTransform ? [encryptTransform] : []),
    cartItemTransform,
    authTokenFilter,
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor } as const;
};

export type AppStore = ReturnType<typeof makeStore>["store"];
export type AppDispatch = AppStore["dispatch"];
