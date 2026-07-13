"use client";
import Link from "next/link";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { Baloo_2 } from "next/font/google";
import {
  Heart,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
  Package,
  MapPin,
  ShoppingCartIcon,
  Truck,
  Sparkles,
  X,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useCartView } from "@/lib/useCart";
import { useWishlistView } from "@/lib/useWishlist";
import { useUserProfile } from "@/lib/useProfile";
import { useRouter } from "next/navigation";
import { openLoginModal, setNavigation } from "@/redux/features/uiSlice";
import type { UiNavigationData } from "@/redux/features/uiSlice";
import Cookies from "js-cookie";
import { login, setProfile } from "@/redux/features/auth";
import { setWishlist } from "@/redux/features/wishlist";
import { updateFullCart } from "@/redux/features/cart";
import { siteConfig } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

/**
 * ── Design notes ──────────────────────────────────────────────────────
 * Layout: "Catalog Masthead" — three stacked bars instead of the usual
 * single logo/search/icons row + nav row:
 *   1. Utility strip — promo + quick contact links.
 *   2. Masthead — centered logo (like a catalog cover), a quiet utility
 *      link on the left, and the account/wishlist/cart controls grouped
 *      into one capsule dock on the right.
 *   3. Shelf strip — category tabs. Tapping the search icon in the dock
 *      swaps this whole strip into a live search field in place, instead
 *      of opening a separate overlay or a bar that's always visible and
 *      eating header space.
 * Mega menus drop as a scalloped drawer anchored to the shelf strip
 * itself (relative/absolute, not fixed viewport math), so they can't
 * drift out of place as the header shrinks on scroll.
 *
 * Color: every accent is derived from the theme's own tokens
 * (--brand-primary / --brand-secondary / --brand-heading /
 * --brand-primary-dark) via color-mix, never hardcoded hex — so the
 * header re-skins automatically with the store's brand settings. A
 * three-way rotation across those tokens is the one repeating device
 * (category dots, drawer scallops) that ties the shelf together.
 * ─────────────────────────────────────────────────────────────────────
 */

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const TINTS = [
  "var(--brand-primary)",
  "var(--brand-secondary)",
  "var(--brand-heading)",
] as const;

interface SubSubCategory {
  _id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  name: string;
  slug: string;
  _id?: string;
  subSubCategories: SubSubCategory[];
}

interface CategoryItem {
  name: string;
  slug: string;
  _id?: string;
  subCategories: MenuItem[];
}

interface MobileLinkProps {
  name: string;
  href: string;
  tint?: string;
}

interface HeaderProps {
  navigationData: UiNavigationData;
}

const userMenuItems = [
  { label: "My Profile", icon: UserIcon, href: "/profile?tab=account" },
  { label: "My Orders", icon: Package, href: "/profile?tab=orders" },
  { label: "Account Settings", icon: Settings, href: "/profile?tab=settings" },
  { label: "Addresses", icon: MapPin, href: "/profile?tab=account" },
];

const fontClass = baloo.variable;

export default function Header({ navigationData }: HeaderProps) {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const cartCount = useSelector((state: RootState) => state.cart.totalQuantity);
  const wishlistCount = useSelector(
    (state: RootState) => state.wishlist.totalQuantity,
  );

  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLogin);
  const user = useSelector((state: RootState) => state.auth.details) as Record<
    string,
    unknown
  >;
  const logo = useSelector((state: RootState) => state.logo.logo) as
    | string
    | null;

  const dispatch = useDispatch();
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: profile } = useUserProfile();
  const { data: cartData } = useCartView();
  const { data: wishlistData } = useWishlistView();

  const bootstrappedProfile = useRef(false);
  useEffect(() => {
    if (!profile || bootstrappedProfile.current) return;
    bootstrappedProfile.current = true;
    dispatch(setProfile(profile));
    dispatch(login());
  }, [profile, dispatch]);

  useEffect(() => {
    if (wishlistData && Array.isArray(wishlistData)) {
      dispatch(setWishlist(wishlistData));
    }
  }, [wishlistData, dispatch]);

  useEffect(() => {
    if (!cartData?.items) return;
    const items = cartData.items.map(
      (item: {
        product?: { _id: string };
        quantity?: number;
        color?: { _id: string };
        size?: { _id: string };
      }) => ({
        productId: item.product?._id ?? "",
        quantity: item.quantity ?? 1,
        colorId: item.color?._id ?? null,
        sizeId: item.size?._id ?? null,
        isGuest: false,
      }),
    );
    dispatch(
      updateFullCart({
        items,
        totalPrice: cartData.totalPrice ?? 0,
        totalItems: cartData.totalItems ?? items.length,
      }),
    );
  }, [cartData, dispatch]);

  useEffect(() => {
    if (isLoggedIn || Cookies.get("loginModal")) {
      return;
    }
    loginTimerRef.current = setTimeout(() => {
      dispatch(openLoginModal());
      Cookies.set("loginModal", "true", { expires: 1 });
    }, 10000);
    return () => {
      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current);
        loginTimerRef.current = null;
      }
    };
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    dispatch(setNavigation(navigationData));
  }, [navigationData]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 120);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem("announcement-dismissed");
    if (dismissed === "true") setAnnouncementDismissed(true);
  }, []);

  useEffect(() => {
    if (!isSearchMode) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchMode(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchMode]);

  const dismissAnnouncement = useCallback(() => {
    setAnnouncementDismissed(true);
    localStorage.setItem("announcement-dismissed", "true");
  }, []);

  const MobileLink = ({ name, href, tint = TINTS[0] }: MobileLinkProps) => (
    <SheetClose asChild>
      <Link href={href}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 py-3 px-4 text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors duration-200 rounded-xl font-medium h-auto"
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ background: tint }}
          />
          {name}
        </Button>
      </Link>
    </SheetClose>
  );

  const renderMobileNav = () => (
    <nav
      className={`${fontClass} p-4 space-y-2 overflow-y-auto h-[calc(100vh-84px)]`}
    >
      {(navigationData?._data as CategoryItem[])?.map((cat, idx) => {
        const tint = TINTS[idx % TINTS.length];
        return (
          <div key={idx}>
            {cat.subCategories?.length == 0 ? (
              <MobileLink
                name={cat.name}
                href={urlPrfix(cat.slug)}
                tint={tint}
              />
            ) : (
              <Accordion
                type="single"
                collapsible
                className="w-full rounded-xl bg-background border"
                style={{
                  borderColor: `color-mix(in srgb, ${tint} 25%, transparent)`,
                }}
              >
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="py-3 px-4 rounded-xl font-semibold font-[family-name:var(--font-display)] text-foreground hover:no-underline">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: tint }}
                      />
                      <Link href={cat.slug == "home" ? "/" : cat.slug}>
                        {cat.name}
                      </Link>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="p-0 border-t"
                    style={{
                      borderColor: `color-mix(in srgb, ${tint} 20%, transparent)`,
                      background: `color-mix(in srgb, ${tint} 4%, transparent)`,
                    }}
                  >
                    {cat.subCategories?.map(
                      (menu: MenuItem, menuIdx: number) => (
                        <Accordion
                          type="single"
                          collapsible
                          className="w-full"
                          key={menuIdx}
                        >
                          <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="py-2.5 px-5 text-foreground hover:no-underline font-medium">
                              <SheetClose asChild>
                                <Link
                                  href={
                                    "/category/" + cat.slug + "/" + menu.slug
                                  }
                                >
                                  {menu.name}
                                </Link>
                              </SheetClose>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                              {menu.subSubCategories?.map(
                                (subcat: SubSubCategory, subIdx: number) => (
                                  <div key={subIdx} className="pl-3">
                                    <MobileLink
                                      name={subcat.name}
                                      tint={tint}
                                      href={
                                        "/category/" +
                                        cat.slug +
                                        "/" +
                                        menu.slug +
                                        "/" +
                                        subcat.slug
                                      }
                                    />
                                  </div>
                                ),
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ),
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        );
      })}
      <div
        className="pt-4 mt-2 border-t"
        style={{
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest px-4 mb-2 text-muted-foreground">
          Quick links
        </p>
        <div className="flex flex-wrap gap-2 px-2">
          {[
            { name: "About Us", href: "/about" },
            { name: "Contact Us", href: "/contact-us" },
            { name: "FAQ", href: "/faq" },
            { name: "Our Story", href: "/story" },
            { name: "Track Order", href: "/order-track" },
            { name: "Our Policy", href: "/our-policy" },
          ].map((l, i) => (
            <SheetClose asChild key={l.href}>
              <Link
                href={l.href}
                className="text-xs font-semibold px-3.5 py-2 rounded-full text-foreground transition-transform active:scale-95"
                style={{
                  background: `color-mix(in srgb, ${TINTS[i % TINTS.length]} 12%, var(--background))`,
                }}
              >
                {l.name}
              </Link>
            </SheetClose>
          ))}
        </div>
      </div>
    </nav>
  );

  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        const toggle = document.getElementById("search-toggle-button");
        if (toggle && !toggle.contains(event.target as Node))
          setIsMobileSearchOpen(false);
      }
    };
    if (isMobileSearchOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener,
      );
      document.addEventListener(
        "touchstart",
        handleClickOutside as unknown as EventListener,
      );
    }
    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener,
      );
      document.removeEventListener(
        "touchstart",
        handleClickOutside as unknown as EventListener,
      );
    };
  }, [isMobileSearchOpen]);

  return (
    <>
      {!announcementDismissed && (
        <div className="w-full bg-[var(--brand-primary-dark)] text-background text-[13px] py-2 relative">
          <div className="flex items-center justify-center gap-2 px-10">
            <Truck size={15} />
            <span className="font-medium">
              Kidora Kart — free gift-wrap on every order this week
            </span>
          </div>
          <button
            onClick={dismissAnnouncement}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <header
        className={`sticky top-0 left-0 z-[190] w-full bg-background/95 backdrop-blur border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] transition-shadow duration-300 ${
          isScrolled ? "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]" : ""
        }`}
      >
        {/* Bar 1 — masthead */}
        <div
          className={`${fontClass} w-full transition-all duration-300 ${isScrolled ? "py-2" : "py-3.5"}`}
        >
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-3 items-center gap-3 px-4 md:px-6 w-full">
            {/* Left cell */}
            <div className="flex items-center gap-2 justify-self-start">
              <button
                className="md:hidden grid place-items-center size-10 rounded-xl hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] text-foreground active:scale-95 transition-transform"
                aria-label="Open navigation menu"
                onClick={() => setIsOffcanvasOpen(true)}
              >
                <Menu size={22} />
              </button>
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[var(--brand-primary)] transition-colors"
              >
                <PhoneCall size={14} />
                Need help?
              </a>
            </div>

            {/* Center cell — logo */}
            <Link
              href="/"
              className="justify-self-center group flex items-center gap-2"
            >
              <Image
                src={logo || "/images/logo.webp"}
                alt={siteConfig.name}
                width={110}
                height={110}
                className={`w-auto object-contain transition-all duration-300 group-hover:scale-105 ${isScrolled ? "h-8" : "h-11"}`}
              />
            </Link>

            {/* Right cell — control dock */}
            <div className="flex items-center justify-self-end">
              <div className="flex items-center gap-0.5 rounded-full border border-[color-mix(in_srgb,var(--brand-primary)_18%,transparent)] bg-background p-1 shadow-sm">
                <button
                  id="search-toggle-button"
                  className={`grid place-items-center size-9 rounded-full transition-colors ${
                    isSearchMode
                      ? "bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)]"
                      : "text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                  }`}
                  onClick={() => {
                    setIsSearchMode((v) => !v);
                    setIsMobileSearchOpen((v) => !v);
                  }}
                  aria-pressed={isSearchMode}
                  aria-label="Toggle search"
                >
                  <Search size={18} />
                </button>

                <Link href="/wishlist">
                  <span className="relative grid place-items-center size-9 rounded-full text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors">
                    <Heart
                      fill={
                        wishlistCount > 0 ? "var(--brand-primary-dark)" : "none"
                      }
                      size={18}
                      className={
                        wishlistCount > 0
                          ? "text-[var(--brand-primary-dark)]"
                          : ""
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
                  className="relative hidden md:grid place-items-center size-9 rounded-full text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors"
                  aria-label="View shopping bag"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingCartIcon
                    fill={cartCount > 0 ? "var(--brand-primary-dark)" : "none"}
                    size={19}
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
                      className="relative grid place-items-center size-9 rounded-full text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors"
                      aria-label="User account menu"
                    >
                      {(user as Record<string, string>)?.avatar ? (
                        <Image
                          src={(user as Record<string, string>).avatar}
                          alt="User Avatar"
                          width={26}
                          height={26}
                          className="rounded-full size-6 object-cover"
                        />
                      ) : (
                        <UserIcon size={18} />
                      )}
                      {isLoggedIn && (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={`${fontClass} w-64 bg-background border border-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)] shadow-2xl rounded-2xl p-1.5`}
                    align="end"
                  >
                    {isLoggedIn ? (
                      <>
                        <DropdownMenuLabel
                          className="rounded-xl py-3.5 px-3.5"
                          style={{
                            background:
                              "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
                          }}
                        >
                          <p className="text-sm font-bold font-[family-name:var(--font-display)] text-foreground">
                            Hey, {(user as Record<string, string>)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(user as Record<string, string>)?.email}
                          </p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1 bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]" />
                        {userMenuItems.map((item, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            asChild
                            className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                          >
                            <Link
                              href={item.href}
                              className="flex items-center"
                            >
                              <item.icon
                                className="mr-3 text-muted-foreground"
                                size={17}
                              />
                              <span className="font-medium text-sm">
                                {item.label}
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1 bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]" />
                        <Link href="/profile?tab=settings&logout=true">
                          <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5 px-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <LogOut className="mr-3" size={17} />
                            <span className="font-medium text-sm">Logout</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    ) : (
                      <div className="px-3 py-4">
                        <p className="text-sm text-muted-foreground mb-3.5 font-medium text-center">
                          Sign in to your account
                        </p>
                        <div className="space-y-2 flex flex-col gap-2">
                          <Link href="/login">
                            <Button variant="gradient" className="w-full">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/signup">
                            <Button
                              variant="outline"
                              className="w-full border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                            >
                              Register
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile search — swaps in below masthead */}
          <div
            ref={mobileSearchRef}
            className={`w-full md:hidden transition-all duration-300 ${
              isMobileSearchOpen
                ? "opacity-100 px-4 mt-3"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <SearchBar inputId="mobile-search" />
          </div>
        </div>

        {/* Bar 2 — shelf strip: category tabs, or search-mode */}
        <div
          className={`${fontClass} relative hidden md:block border-t border-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]`}
        >
          {isSearchMode ? (
            <div className="flex items-center gap-3 max-w-2xl mx-auto px-6 py-2.5">
              <div className="flex-1">
                <SearchBar />
              </div>
              <button
                onClick={() => setIsSearchMode(false)}
                aria-label="Close search"
                className="grid place-items-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <nav className="flex flex-wrap justify-center items-center gap-1 text-sm py-2.5">
              {(navigationData?._data as CategoryItem[])?.map((cat, idx) => {
                const tint = TINTS[idx % TINTS.length];
                return (
                  <div key={idx} className="relative group">
                    {cat.subCategories?.length == 0 ? (
                      <Link
                        href={urlPrfix(cat.slug)}
                        className="inline-flex items-center gap-1.5 font-[family-name:var(--font-display)] font-semibold text-[13.5px] whitespace-nowrap px-3.5 py-1.5 rounded-full text-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: tint }}
                        />
                        {cat.name}
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push("/category/" + cat.slug)}
                          className="inline-flex items-center gap-1.5 font-[family-name:var(--font-display)] font-semibold text-[13.5px] whitespace-nowrap px-3.5 py-1.5 rounded-full text-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                          aria-haspopup="menu"
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: tint }}
                          />
                          {cat.name}
                          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
                        </button>

                        {/* Mega menu — scalloped drawer anchored to this strip */}
                        <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[999]">
                          <div
                            className="w-[1100px] max-w-[92vw] h-3"
                            style={{
                              background: `radial-gradient(circle at 12px 0, transparent 12px, color-mix(in srgb, ${tint} 30%, transparent) 13px) 0 0 / 24px 12px repeat-x`,
                            }}
                          />
                          <Card className="w-[1100px] max-w-[92vw] h-auto bg-background shadow-2xl rounded-b-2xl rounded-t-none p-7 border border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] border-t-0">
                            <div className="grid grid-cols-5 gap-6">
                              {cat.subCategories?.map(
                                (menu: MenuItem, i: number) => (
                                  <div key={i}>
                                    <Link
                                      href={
                                        "/category/" +
                                        cat.slug +
                                        "/" +
                                        menu.slug
                                      }
                                    >
                                      <h4 className="mb-3">
                                        <span
                                          className="inline-block text-sm font-bold font-[family-name:var(--font-display)] px-3 py-1.5 rounded-lg"
                                          style={{
                                            background: `color-mix(in srgb, ${tint} 14%, transparent)`,
                                            color: "var(--brand-heading)",
                                          }}
                                        >
                                          {menu.name}
                                        </span>
                                      </h4>
                                    </Link>
                                    <ul className="space-y-1.5 text-[13.5px]">
                                      {menu.subSubCategories?.map(
                                        (subcat: SubSubCategory) => (
                                          <li key={subcat._id}>
                                            <Link
                                              href={`/category/${cat.slug}/${menu.slug}/${subcat.slug}`}
                                              className="block text-foreground/75 hover:text-[var(--brand-primary)] hover:translate-x-1 transition-all duration-150 py-0.5"
                                            >
                                              {subcat.name}
                                            </Link>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                ),
                              )}
                            </div>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <Link
                href="/contact-us"
                className="font-[family-name:var(--font-display)] font-semibold text-[13.5px] whitespace-nowrap px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/order-track"
                className="font-[family-name:var(--font-display)] font-semibold text-[13.5px] whitespace-nowrap px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Track Order
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Mobile off-canvas nav */}
      <Sheet open={isOffcanvasOpen} onOpenChange={setIsOffcanvasOpen}>
        <SheetContent
          side="left"
          className={`${fontClass} w-[82vw] sm:w-80 bg-background p-0 z-[999] border-r border-[color-mix(in_srgb,var(--brand-primary)_20%,transparent)]`}
        >
          <SheetHeader
            className="p-5 border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]"
            style={{
              background:
                "color-mix(in srgb, var(--brand-primary) 6%, transparent)",
            }}
          >
            <SheetTitle className="text-lg font-[family-name:var(--font-display)] font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--brand-primary)]" />
              Menu
            </SheetTitle>
          </SheetHeader>
          {renderMobileNav()}
        </SheetContent>
      </Sheet>
    </>
  );
}

const urlPrfix = (slug: string) => {
  if (slug == "home") return "/";
  else if (slug == "track-your-order") return "/order-track";
  else if (slug == "contact-us") return "/contact-us";
  return "/category/" + slug;
};
