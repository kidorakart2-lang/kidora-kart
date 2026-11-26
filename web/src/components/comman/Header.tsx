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
import { SearchBar } from "./SearchBar";
import IconGroup from "./IconGroup";
import BrandLogo from "./BrandLogo";
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
      image: (cat as { image?: string }).image ?? undefined,
      subCategories:
        (cat.subCategories ?? []).map((sub) => ({
          name: sub.name ?? "",
          slug: sub.slug ?? "",
          image: (sub as { image?: string }).image ?? undefined,
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
        className={`sticky left-0 top-0 z-[190] w-full border-b border-[var(--brand-gold)]/20 bg-white/95 backdrop-blur transition-[box-shadow] duration-500 ${
          isScrolled ? "shadow-[0_10px_30px_-26px_rgba(74,37,66,0.45)]" : ""
        }`}
      >
        {/* ── Desktop: logo · search pill · account/wishlist/bag ── */}
        <div className="hidden lg:block">
          <div
            className={`mx-auto flex max-w-[1400px] items-center gap-8 px-6 transition-[padding] duration-200 ${
              isScrolled ? "py-2.5" : "py-4"
            }`}
          >
            <Link href="/" className="flex shrink-0 items-center" aria-label={siteConfig.name}>
              {logo ? (
                <Image
                  src={logo}
                  alt={siteConfig.name}
                  width={360}
                  height={120}
                  quality={100}
                  priority
                  sizes="180px"
                  className={`w-auto max-w-[180px] object-contain mix-blend-multiply transition-all duration-200 ${
                    isScrolled ? "max-h-9" : "max-h-11"
                  }`}
                />
              ) : (
                <BrandLogo
                  size={isScrolled ? "sm" : "md"}
                  className="transition-all duration-200"
                />
              )}
            </Link>

            <div className="mx-auto w-full max-w-[520px]">
              <SearchBar
                inputId="header-search-desktop"
                formClassName="header-search-pill"
              />
            </div>

            <IconGroup
              labeled
              showSearch={false}
              isSearchOpen={isSearchOpen}
              onToggleSearch={() => setIsSearchOpen((v) => !v)}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              isLoggedIn={isLoggedIn}
              user={user}
            />
          </div>

          <DesktopNav categories={allCategories} />
        </div>

        {/* ── Mobile / tablet: menu · wordmark · actions ── */}
        <div
          className={`flex w-full items-center gap-3 px-4 transition-[padding] duration-200 lg:hidden ${
            isScrolled ? "py-2" : "py-3.5"
          }`}
        >
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg text-foreground transition-colors hover:bg-muted"
            aria-label="Open navigation menu"
            onClick={() => setIsOffcanvasOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="flex shrink-0 items-center" aria-label={siteConfig.name}>
            {logo ? (
              <Image
                src={logo}
                alt={siteConfig.name}
                width={300}
                height={100}
                quality={100}
                priority
                sizes="150px"
                className={`w-auto max-w-[150px] object-contain mix-blend-multiply transition-all duration-200 ${
                  isScrolled ? "max-h-8" : "max-h-10"
                }`}
              />
            ) : (
              <BrandLogo size={isScrolled ? "sm" : "md"} />
            )}
          </Link>

          <div className="ml-auto">
            <IconGroup
              isSearchOpen={isSearchOpen}
              onToggleSearch={() => setIsSearchOpen((v) => !v)}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              isLoggedIn={isLoggedIn}
              user={user}
            />
          </div>
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
