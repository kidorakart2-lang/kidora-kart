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
import SearchPanel from "./SearchPanel";
import IconGroup from "./IconGroup";
import type { CategoryItem } from "./header-types";

interface HeaderProps {
  navigationData: UiNavigationData;
}

const pagesLinks = [
  { name: "Home", href: "/" },
  { name: "Contact Us", href: "/contact-us" },
  { name: "Track Order", href: "/order-track" },
  { name: "FAQ", href: "/faq" },
  { name: "Terms & Conditions", href: "/terms-and-condition" },
  { name: "Our Policy", href: "/our-policy" },
];

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
    cats.push({
      name: "Pages",
      slug: "pages",
      subCategories: pagesLinks.map((p) => ({
        name: p.name,
        slug: p.href,
        subSubCategories: [],
      })),
    });
    return cats;
  }, [navigationData]);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 left-0 z-[190] w-full bg-background/95 backdrop-blur border-b border-border transition-[box-shadow] duration-500  ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div
          className={`flex items-center gap-4 md:gap-6 px-4 md:px-6 w-full transition-[padding] duration-200 ${
            isScrolled ? "py-2" : "py-4"
          }`}
        >
          <button
            className="md:hidden shrink-0 grid place-items-center size-9 -ml-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
            aria-label="Open navigation menu"
            onClick={() => setIsOffcanvasOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src={logo || "/images/logo.webp"}
              alt={siteConfig.name}
              width={140}
              height={140}
              className={`w-auto object-contain transition-all duration-200 ${isScrolled ? "h-9" : "h-11"}`}
            />
          </Link>

          <DesktopNav categories={allCategories} />

          <IconGroup
            isSearchOpen={isSearchOpen}
            onToggleSearch={() => setIsSearchOpen((v) => !v)}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            isLoggedIn={isLoggedIn}
            user={user}
          />
        </div>

        <SearchPanel ref={searchRef} isOpen={isSearchOpen} />
      </header>

      <MobileNav
        allCategories={allCategories}
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
      />
    </>
  );
}
