"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useCartView } from "@/lib/useCart";
import { useWishlistView } from "@/lib/useWishlist";
import { useUserProfile } from "@/lib/useProfile";
import { openLoginModal, setNavigation } from "@/redux/features/uiSlice";
import type { UiNavigationData } from "@/redux/features/uiSlice";
import Cookies from "js-cookie";
import { login, setProfile } from "@/redux/features/auth";
import { setWishlist } from "@/redux/features/wishlist";
import { updateFullCart } from "@/redux/features/cart";
import { siteConfig } from "@/lib/utils";
import AnnouncementBar from "./AnnouncementBar";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import { SearchBar } from "./SearchBar";
import IconGroup from "./IconGroup";
import type { CategoryItem } from "./header-types";

interface HeaderProps {
  navigationData: UiNavigationData;
}

export default function Header({ navigationData }: HeaderProps) {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = useSelector((state: RootState) => state.cart.totalQuantity);
  const wishlistCount = useSelector(
    (state: RootState) => state.wishlist.totalQuantity,
  );
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLogin);
  const user = useSelector((state: RootState) => state.auth.details);
  const logo = useSelector((state: RootState) => state.logo.logo) as
    | string
    | null;

  const dispatch = useDispatch();
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
      }) => ({
        productId: item.product?._id ?? "",
        quantity: item.quantity ?? 1,
        colorId: item.color?._id ?? null,
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
    if (isLoggedIn || Cookies.get("loginModal")) return;
    loginTimerRef.current = setTimeout(() => {
      dispatch(openLoginModal());
      Cookies.set("loginModal", "true", { expires: 1, secure: window.location.protocol === "https:" });
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
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        const toggle = document.getElementById("search-toggle-button");
        if (toggle && !toggle.contains(event.target as Node))
          setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSearchOpen]);

  const allCategories = useMemo<CategoryItem[]>(() => {
    const cats: CategoryItem[] = (navigationData?._data || []).map((cat) => ({
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      subCategories:
        (cat.subCategories ?? []).map((sub) => ({
          name: sub.name ?? "",
          slug: sub.slug ?? "",
          subSubCategories:
            (sub.subSubCategories ?? []).map((ss) => ({
              _id: ss._id ?? "",
              name: ss.name ?? "",
              slug: ss.slug ?? "",
            })) ?? [],
        })) ?? [],
    }));
    return cats;
  }, [navigationData]);

  return (
    <>
      <AnnouncementBar />

      <header className="w-full bg-background/95 z-[190] sticky top-0 left-0 shadow-lg border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
        {/* ── Row 1: Logo + Search + Icons ── */}
        <div
          className={`w-full border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] bg-background/95 transition-all duration-500 ${
            isScrolled ? "py-2 shadow-md" : "py-4"
          }`}
        >
          <div className="flex items-center justify-between px-4 md:px-6 w-full">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden shrink-0 grid place-items-center size-10 -ml-1.5 rounded-xl hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] text-foreground transition-colors"
              aria-label="Open navigation menu"
              onClick={() => setIsOffcanvasOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link href="/" className="group shrink-0">
              <Image
                src={logo || "/images/logo.webp"}
                alt={siteConfig.name}
                width={100}
                height={100}
                className={`w-auto object-contain cursor-pointer transition-all duration-500 group-hover:scale-105 ${
                  isScrolled ? "h-8" : "h-12"
                }`}
              />
            </Link>

            {/* Desktop Search */}
            <div className="hidden lg:block flex-1 px-6">
              <SearchBar className="w-full max-w-xl mx-auto" inputId="header-search-inline" />
            </div>

            {/* Icons */}
            <IconGroup
              isSearchOpen={isSearchOpen}
              onToggleSearch={() => setIsSearchOpen((v) => !v)}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              isLoggedIn={isLoggedIn}
              user={user}
            />
          </div>

          {/* Mobile Search Bar */}
          <div
            ref={searchRef}
            id="mobile-search-bar"
            className={`w-full lg:hidden transition-all duration-300 ${
              isSearchOpen
                ? "opacity-100 px-4 mt-3 mb-2"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <SearchBar className="relative" inputId="header-search-mobile" />
          </div>
        </div>

        {/* ── Row 2: Category Navbar ── */}
        <DesktopNav categories={allCategories} />
      </header>

      <MobileNav
        allCategories={allCategories}
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
      />
    </>
  );
}
