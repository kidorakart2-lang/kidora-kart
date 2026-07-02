import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  type PersistConfig,
} from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
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

// Configuration for redux-persist
const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage: storageSession,
  whitelist: ["cart", "wishlist"],
  ...(encryptTransform ? { transforms: [encryptTransform] } : {}),
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
