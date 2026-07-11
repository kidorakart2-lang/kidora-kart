"use client";

import { ArrowRight, Bell, Search, User, History } from "lucide-react";
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
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";

interface MenuItem {
  label: string;
  href: string;
}

export function Header() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [bar, setBar] = useState(false);
  const [result, setResult] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");

  const menuItems: MenuItem[] = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Products", href: "/dashboard/products" },
      { label: "Users", href: "/dashboard/users" },
      { label: "Audit Log", href: "/dashboard/audit-log" },
      { label: "Logos", href: "/dashboard/logos" },
      { label: "Orders", href: "/dashboard/orders" },
      { label: "Categories", href: "/dashboard/categories" },
      { label: "Sub Categories", href: "/dashboard/sub-category" },
      { label: "Sub Sub Categories", href: "/dashboard/sub-sub-category" },
      { label: "Banners", href: "/dashboard/banners" },
      { label: "Testimonials", href: "/dashboard/testimonials" },
      { label: "FAQs", href: "/dashboard/faqs" },
      { label: "Why Choose Us", href: "/dashboard/why-choose-us" },
      { label: "Materials & Colors", href: "/dashboard/materials" },
      { label: "Sizes", href: "/dashboard/sizes" },
      { label: "AI Helpers", href: "/dashboard/ai-helpers" },
      { label: "Home Page", href: "/dashboard/home-page" },
      { label: "Product FAQs", href: "/dashboard/product-faqs" },
    ],
    [],
  );

  const getSearchResult = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setQuery(query);
    setBar(true);

    if (query.trim() === "") {
      setResult([]);
      setBar(false);
      return;
    }

    const filtered = menuItems
      .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    setResult(filtered);
  };

  // ── Proactive token refresh ──────────────────────────────────────
  // Refresh the access token every 10 minutes (before the 15-min expiry)
  // to prevent race conditions from parallel auto-refresh attempts.
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTokenRefresh = useCallback(async () => {
    try {
      await fetch("/api/admin/user/refresh", {
        method: "POST",
        credentials: "include",
        // Don't wait for the response — fire-and-forget
      });
    } catch {
      // Silently ignore — auto-refresh in middleware handles edge cases
    }
  }, []);

  useEffect(() => {
    // Start the interval
    refreshIntervalRef.current = setInterval(doTokenRefresh, 10 * 60 * 1000);

    // Also refresh on page visibility change (user returns after idle)
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
      await fetch("/api/admin/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the request fails, navigate to login page
    }
    router.push("/");
  };
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              onChange={getSearchResult}
              placeholder="Search..."
              className="pl-10"
            />
            {bar && result.length > 0 && (
              <ul className="absolute z-10 bg-popover border border-border rounded-md mt-1 w-full shadow-md">
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

        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => toast.info("No new notifications")}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className=""
              >
                <User className="h-5 w-5" />
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
