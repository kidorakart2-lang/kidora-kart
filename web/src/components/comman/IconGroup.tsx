"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Settings,
  Package,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IconGroupProps {
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  user: unknown;
  /** Desktop header shows "Account / Wishlist / Bag" captions under each icon. */
  labeled?: boolean;
  showSearch?: boolean;
}

const userMenuItems = [
  { label: "My Profile", icon: UserIcon, href: "/profile?tab=account" },
  { label: "My Orders", icon: Package, href: "/profile?tab=orders" },
  { label: "Account Settings", icon: Settings, href: "/profile?tab=settings" },
  { label: "Addresses", icon: MapPin, href: "/profile?tab=account" },
];

export default function IconGroup({
  isSearchOpen,
  onToggleSearch,
  cartCount,
  wishlistCount,
  isLoggedIn,
  user,
  labeled = false,
  showSearch = true,
}: IconGroupProps) {
  const router = useRouter();
  const profile = user as Record<string, string> | null;

  const itemClass = labeled
    ? "flex flex-col items-center gap-1 px-3 text-[var(--brand-ink)]/80 transition-colors hover:text-[var(--brand-plum)]"
    : "relative grid size-9 place-items-center rounded-lg text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";

  const labelClass =
    "text-[10px] uppercase leading-none tracking-[0.12em] text-[var(--brand-ink)]/70";

  const countBadge = (count: number) =>
    count > 0 ? (
      <span className="absolute -right-1.5 -top-1 grid size-4 place-items-center rounded-full bg-[var(--brand-gold)] text-[9px] font-medium text-[var(--brand-plum)]">
        {count}
      </span>
    ) : null;

  return (
    <div
      className={`flex shrink-0 items-center ${
        labeled ? "gap-2" : "gap-1 md:ml-0"
      }`}
    >
      {showSearch && (
        <button
          id="search-toggle-button"
          className={
            labeled
              ? itemClass
              : `grid place-items-center size-9 rounded-lg transition-colors ${
                  isSearchOpen
                    ? "bg-muted text-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`
          }
          onClick={onToggleSearch}
          aria-pressed={isSearchOpen}
          aria-label="Toggle search"
        >
          <Search size={labeled ? 21 : 19} strokeWidth={1.5} />
          {labeled && <span className={labelClass}>Search</span>}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={itemClass} aria-label="User account menu">
            <span className="relative">
              {profile?.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="User Avatar"
                  width={26}
                  height={26}
                  className="size-7 rounded-full border border-[var(--brand-gold)]/40 object-cover"
                />
              ) : (
                <UserIcon size={labeled ? 21 : 19} strokeWidth={1.5} />
              )}
              {isLoggedIn && (
                <span className="absolute -right-1 -top-0.5 size-2 rounded-full border border-[var(--brand-cream)] bg-[var(--brand-gold)]" />
              )}
            </span>
            {labeled && <span className={labelClass}>Account</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-xl border border-[var(--brand-gold)]/25 bg-background p-1.5 shadow-lg"
          align="end"
        >
          {isLoggedIn ? (
            <>
              <DropdownMenuLabel className="rounded-lg bg-[var(--brand-rose)]/25 px-3 py-3">
                <p className="text-sm fw-heading text-foreground">
                  Hey, {profile?.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {profile?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              {userMenuItems.map((item, idx) => (
                <DropdownMenuItem
                  key={idx}
                  asChild
                  className="cursor-pointer rounded-md px-3 py-2.5"
                >
                  <Link href={item.href} className="flex items-center">
                    <item.icon
                      className="mr-3 text-muted-foreground"
                      size={17}
                    />
                    <span className="fw-body text-sm">{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1" />
              <Link href="/profile?tab=settings&logout=true">
                <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-3" size={17} />
                  <span className="fw-body text-sm">Logout</span>
                </DropdownMenuItem>
              </Link>
            </>
          ) : (
            <div className="px-3 py-4">
              <p className="mb-3.5 text-center text-sm fw-cta text-muted-foreground">
                Sign in to your account
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/login">
                  <Button className="btn-gold w-full !text-[10px] uppercase tracking-[0.16em]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full rounded-full border-[var(--brand-gold)]/40 !text-[10px] uppercase tracking-[0.16em] text-[var(--brand-ink)]/70">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Link href="/wishlist" className={itemClass} aria-label="Wishlist">
        <span className="relative">
          <Heart
            size={labeled ? 21 : 19}
            strokeWidth={1.5}
            fill={wishlistCount > 0 ? "currentColor" : "none"}
            className={
              wishlistCount > 0 ? "text-[var(--brand-mauve)]" : "text-[var(--brand-ink)]/75"
            }
          />
          {countBadge(wishlistCount)}
        </span>
        {labeled && <span className={labelClass}>Wishlist</span>}
      </Link>

      <button
        className={`${labeled ? itemClass : "relative hidden md:grid size-9 place-items-center rounded-lg text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"}`}
        aria-label="View bag"
        onClick={() => router.push("/cart")}
      >
        <span className="relative">
          <ShoppingBag
            size={labeled ? 21 : 20}
            strokeWidth={cartCount > 0 ? 1.9 : 1.5}
            fill="none"
            className="text-[var(--brand-plum)]"
          />
          {countBadge(cartCount)}
        </span>
        {labeled && <span className={labelClass}>Bag</span>}
      </button>
    </div>
  );
}
