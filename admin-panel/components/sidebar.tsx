"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
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
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
        {(!collapsed || isMobile) && (
          <div className="flex min-w-0 items-center overflow-hidden">
            <div className="min-w-0 leading-none">
              <img
                src={logoUrl || "/Ratnavya Gold Leaf Logo.webp"}
                alt="Ratnavya logo"
                className="h-8 w-auto max-w-[138px] object-contain object-left"
              />
              <span className="mt-1.5 block text-[8px] uppercase tracking-[0.3em] text-[#c6a875]/80">
                Admin
              </span>
            </div>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="no-scroll flex-1 space-y-1 overflow-y-auto p-2.5">
        <TooltipProvider>
          {NAV_ITEMS_WITH_ICONS.map((item) => {
            const isActive = pathname === item.href;
            const link = (
              <Link
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                onClick={() => {
                  if (isMobile) setMobileSheetOpen(false);
                }}
                className={cn(
                  "flex items-center rounded-lg py-2.5 transition-colors duration-150",
                  collapsed && !isMobile
                    ? "justify-center px-2"
                    : "gap-3 px-3",
                  "text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "admin-nav-active",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                {(!collapsed || isMobile) && (
                  <span className="truncate text-[12.5px] font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{link}</div>;
          })}
        </TooltipProvider>
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-3 top-3 z-50 h-9 w-9 rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground opacity-50 shadow-md transition-opacity hover:opacity-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="admin-sidebar w-64 bg-sidebar p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "admin-sidebar fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {sidebarContent}
    </aside>
  );
}
