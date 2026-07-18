"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { NAV_ITEMS_WITH_ICONS } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminLogo } from "@/hooks/useAdminLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = NAV_ITEMS_WITH_ICONS;

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const { logoUrl } = useAdminLogo();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const pathname = usePathname();

  const isMobile = useIsMobile();

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && !isMobile && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left duration-300 overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">T</span>
                </div>
              )}
            </div>              <span className="font-bold text-lg text-sidebar-foreground">
              Kidora Kart
            </span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="transition-all duration-300"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 no-scroll">
        <TooltipProvider>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                onClick={() => {
                  if (isMobile) setMobileSheetOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:bg-sidebar-primary",
                  !isActive && "text-sidebar-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(!collapsed || (isMobile && isMobileSheetOpen)) && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </TooltipProvider>
      </nav>
    </div>
  );

  // Mobile: render sidebar content inside a Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-3 top-3 z-50 h-9 w-9 rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-opacity opacity-50 hover:opacity-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {sidebarContent}
    </aside>
  );
}
