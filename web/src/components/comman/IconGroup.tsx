"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingCartIcon,
  User as UserIcon,
  LogOut,
  Settings,
  Package,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}: IconGroupProps) {
  const router = useRouter();
  const profile = user as Record<string, string> | null;

  return (
    <div className="flex items-center gap-1 shrink-0 ml-auto md:ml-0">
      <button
        id="search-toggle-button"
        className={`grid place-items-center size-9 rounded-lg transition-colors ${
          isSearchOpen
            ? "bg-muted text-foreground"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
        onClick={onToggleSearch}
        aria-pressed={isSearchOpen}
        aria-label="Toggle search"
      >
        <Search size={19} />
      </button>

      <Link href="/wishlist">
        <span className="relative grid place-items-center size-9 rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground transition-colors">
          <Heart
            fill={wishlistCount > 0 ? "var(--brand-primary-dark)" : "none"}
            size={19}
            className={
              wishlistCount > 0 ? "text-[var(--brand-primary-dark)]" : ""
            }
          />
          {wishlistCount > 0 && (
            <Badge className="absolute -top-1 -right-1 size-4 flex items-center justify-center p-0 bg-[var(--brand-primary-dark)] hover:bg-[var(--brand-primary-dark)] text-[10px] border-2 border-background">
              {wishlistCount}
            </Badge>
          )}
        </span>
      </Link>

      <button
        className="relative hidden md:grid place-items-center size-9 rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        aria-label="View shopping bag"
        onClick={() => router.push("/cart")}
      >
        <ShoppingCartIcon
          fill={cartCount > 0 ? "var(--brand-primary-dark)" : "none"}
          size={20}
          className={
            cartCount > 0 ? "text-[var(--brand-primary-dark)]" : ""
          }
        />
        {cartCount > 0 && (
          <Badge className="absolute -top-1 -right-1 size-4 flex items-center justify-center p-0 bg-[var(--brand-primary-dark)] hover:bg-[var(--brand-primary-dark)] text-[10px] border-2 border-background">
            {cartCount}
          </Badge>
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative grid place-items-center size-9 rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            aria-label="User account menu"
          >
            {profile?.avatar ? (
              <Image
                src={profile.avatar}
                alt="User Avatar"
                width={26}
                height={26}
                className="rounded-full size-6 object-cover"
              />
            ) : (
              <UserIcon size={19} />
            )}
            {isLoggedIn && (
              <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 bg-background border border-border shadow-lg rounded-lg p-1.5"
          align="end"
        >
          {isLoggedIn ? (
            <>
              <DropdownMenuLabel className="rounded-md py-3 px-3 bg-muted/60">
                <p className="text-sm fw-heading text-foreground">
                  Hey, {profile?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              {userMenuItems.map((item, idx) => (
                <DropdownMenuItem
                  key={idx}
                  asChild
                  className="cursor-pointer rounded-md py-2.5 px-3"
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
                <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 px-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-3" size={17} />
                  <span className="fw-body text-sm">Logout</span>
                </DropdownMenuItem>
              </Link>
            </>
          ) : (
            <div className="px-3 py-4">
              <p className="text-sm text-muted-foreground mb-3.5 fw-cta text-center">
                Sign in to your account
              </p>
              <div className="space-y-2 flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="gradient" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
