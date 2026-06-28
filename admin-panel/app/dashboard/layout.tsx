"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />
      <div
        className={`transition-all duration-300 ${isMobile ? "pl-0" : sidebarCollapsed ? "pl-16" : "pl-64"}`}
      >
        <Header />
        <main className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
