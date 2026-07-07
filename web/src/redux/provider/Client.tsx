"use client";

import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import type { RootState } from "../store/store";

import { makeStore } from "../store/store";
import Image from "next/image";
import GuestDataInitializer from "@/components/providers/GuestDataInitializer";
import QueryProvider from "@/app/QueryProvider";

const Loading = () => {
  const logo = useSelector((state: RootState) => state.logo.logo);

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-center w-full h-screen bg-background">
      <Image
        src={logo || "/images/logo.webp"}
        className="animate-pulse w-24 h-20"
        alt="Loading"
        width={100}
        height={100}
      />
    </div>
  );
};

export function Client({ children }: { children: React.ReactNode }) {
  const { store, persistor } = makeStore();

  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <GuestDataInitializer>
          <QueryProvider>{children}</QueryProvider>
        </GuestDataInitializer>
      </PersistGate>
    </Provider>
  );
}
