"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import ToolBar from "./ToolBar";

const AUTH_PATHS = ["/login", "/signup"];

export default function MainLayout({
  children,
  navigationData,
  featuredProducts,
}: {
  children: React.ReactNode;
  navigationData: any;
  featuredProducts?: any[];
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (isAuthPage) {
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
