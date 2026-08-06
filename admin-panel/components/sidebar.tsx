"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
} from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav-items";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const { logoUrl } = useAdminLogo();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Start with all sections expanded by default
    const initial: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((section) => {
      initial[section.label] = true;
    });
    return initial;
  });
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

  // Auto-expand section containing active page
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      const isActive = section.items.some((item) => pathname === item.href);
      if (isActive) {
        setExpandedSections((prev) => {
          if (prev[section.label]) return prev; // already expanded
          return { ...prev, [section.label]: true };
        });
      }
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActiveRoute = (href: string) => pathname === href;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo + Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border shrink-0">
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
                  <span className="text-primary-foreground font-bold text-sm">J</span>
                </div>
              )}
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">
              Jewellery Walla
            </span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="transition-all duration-300 shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 no-scroll">
        <TooltipProvider>
          {NAV_SECTIONS.map((section) => {
            const isAnyItemActive = section.items.some((item) =>
              isActiveRoute(item.href),
            );
            const isExpanded = expandedSections[section.label] !== false;

            // In collapsed mode, show section items as tooltip links with section icon
            if (collapsed && !isMobile) {
              // For single-item sections (Dashboard, Orders, Users), just show the item
              if (section.items.length === 1) {
                const item = section.items[0]!;
                const isActive = isActiveRoute(item.href);
                const linkContent = (
                  <Link
                    href={item.href}
                    target={item.target}
                    rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                    onClick={() => {
                      if (isMobile) setMobileSheetOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-center w-full px-3 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-sidebar-accent",
                      isActive &&
                        "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:bg-sidebar-primary",
                      !isActive && "text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                  </Link>
                );
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // For multi-item sections, show the first item as the section icon
              const firstItem = section.items[0]!;
              return (
                <div key={section.label} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground",
                      isAnyItemActive && "bg-sidebar-accent",
                    )}
                  >
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <section.icon className="h-5 w-5 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          {section.label}
                        </p>
                        {section.items.map((item) => (
                          <p key={item.href}>{item.label}</p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            }

            // Expanded mode: show collapsible section
            const showContent = !collapsed || isMobile;
            if (!showContent) return null;

            return (
              <Collapsible
                key={section.label}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.label)}
                className="space-y-0.5"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 h-auto rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent",
                      isAnyItemActive && "bg-sidebar-accent/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {section.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 ml-1">
                  {section.items.map((item) => {
                    const isActive = isActiveRoute(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.target}
                        rel={
                          item.target === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        onClick={() => {
                          if (isMobile) setMobileSheetOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          "hover:bg-sidebar-accent",
                          isActive &&
                            "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:bg-sidebar-primary",
                          !isActive && "text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium truncate">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
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
