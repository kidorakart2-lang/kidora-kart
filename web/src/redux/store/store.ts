import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  type PersistConfig,
} from "redux-persist";
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
  const { default: storage } = require("redux-persist/lib/storage");
  return {
    ...storage,
    setItem: async (key: string, value: string) => {
      try {
        await storage.setItem(key, value);
      } catch (err) {
        if (err instanceof DOMException && err.name === "QuotaExceededError") {
          console.warn("Storage quota exceeded, clearing persisted state");
          await storage.removeItem("persist:root");
          try {
            await storage.setItem(key, value);
          } catch {
            // console.warn("Still unable to store after clearing, persisting disabled");
          }
        } else {
          throw err;
        }
      }
    },
  };
};

// Configuration for redux-persist
// ponytail: no encryption transform — auth isLogin/details aren't sensitive, tokens are in httpOnly cookies
const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage: createSafeStorage(),
  whitelist: ["cart", "wishlist", "auth", "logo"],
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
