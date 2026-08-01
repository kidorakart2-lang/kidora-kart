"use client";

import { ArrowRight, Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "./theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { AlertDialogUse } from "./alert-dialog";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { NAV_ITEMS, type NavItem } from "@/lib/nav-items";
import { api, clearCsrfToken } from "@/lib/api";

export function Header() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [bar, setBar] = useState(false);
  const [result, setResult] = useState<NavItem[]>([]);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuItems = NAV_ITEMS;

  // Debounced search — prevents dropdown from flickering on rapid input
  const getSearchResult = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Cancel any pending close
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (value.trim() === "") {
      setResult([]);
      setBar(false);
      return;
    }

    const filtered = menuItems
      .filter((item) => item.label.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5);

    setResult(filtered);
    setBar(true);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setBar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll-based header shrinking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Proactive token refresh ──────────────────────────────────────
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTokenRefresh = useCallback(async () => {
    try {
      await api.post("/api/admin/user/refresh");
    } catch {
      // Silently ignore — auto-refresh in middleware handles edge cases
    }
  }, []);

  useEffect(() => {
    refreshIntervalRef.current = setInterval(doTokenRefresh, 10 * 60 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        doTokenRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [doTokenRefresh]);

  const handleLogout = async () => {
    try {
      await api.post("/api/admin/user/logout");
    } catch {
      // Even if the request fails, navigate to login page
    }
    // Drop the stale CSRF token client-side so the next login session fetches
    // a fresh one from the server (the server also clears it via Set-Cookie).
    clearCsrfToken();
    router.push("/");
  };
  return (
    <>
      <header
        className={`sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 transition-all duration-300 ${
          scrolled ? "h-12" : "h-14"
        }`}
      >
        <div className="flex-1 flex items-center gap-4">
          <div ref={searchContainerRef} className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              onChange={getSearchResult}
              placeholder="Search..."
              className="pl-9 h-8 text-sm"
              onFocus={() => {
                if (query.trim() !== "" && result.length > 0) {
                  setBar(true);
                }
              }}
            />
            {bar && result.length > 0 && (
              <ul className="absolute z-50 bg-popover border border-border rounded-md mt-1 w-full shadow-lg">
                {result.map((item, i) => (
                  <li key={i} className="border-b border-border last:border-b-0">
                    <Link
                      onClick={() => setBar(false)}
                      href={item.href}
                      className="px-4 py-2 hover:bg-accent flex justify-between items-center text-sm transition-colors cursor-pointer"
                    >
                      {item.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => toast.info("No new notifications")}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Account menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpen(true)}
                className="text-destructive"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <AlertDialogUse
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        description="Are you sure you want to logout?"
      />
    </>
  );
}
