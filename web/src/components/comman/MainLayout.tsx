"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLogo } from "@/redux/features/logo";
import Header from "./Header";
import Footer from "./Footer";
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import ToolBar from "./ToolBar";

const HIDE_LAYOUT_PATHS = ["/login", "/signup", "/reset-password", "/verify-email", "/change-password"];

export default function MainLayout({
  children,
  navigationData,
  featuredProducts,
  logoData,
}: {
  children: React.ReactNode;
  navigationData: any;
  featuredProducts?: any[];
  logoData?: { logo?: string } | null;
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isAuthPage = HIDE_LAYOUT_PATHS.includes(pathname);
  const isCheckoutPage = pathname.startsWith("/checkout");
  const isOrderSuccessPage = pathname.startsWith("/order-success");

  useEffect(() => {
    if (logoData?.logo) {
      dispatch(setLogo(logoData.logo));
    }
  }, [logoData, dispatch]);

  if (isAuthPage || isCheckoutPage || isOrderSuccessPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header navigationData={navigationData} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer featuredProducts={featuredProducts} />
      <BottomTabNavigation />
      <ToolBar />
    </>
  );
}
