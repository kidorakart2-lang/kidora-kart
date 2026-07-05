"use client";
import Link from "next/link";
import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";
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
} from "lucide-react";
import { motion, type Variants } from "motion/react";
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
import { PlaceholdersAndVanishInput } from "../ui/placeholders-and-vanish-input";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import {
  fetchAndDispatchCart,
  fetchAndDispatchWishlist,
} from "@/lib/fetchCartWislist";
import { usePathname, useRouter } from "next/navigation";
import { openLoginModal, setNavigation } from "@/redux/features/uiSlice";
import type { UiNavigationData } from "@/redux/features/uiSlice";
import Cookies from "js-cookie";
import { getUser } from "@/lib/fetchUser";
import { getAuthToken } from "@/lib/getAuthToken";
import { login, logout, setProfile } from "@/redux/features/auth";
import { siteConfig } from "@/lib/utils";

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

interface SuggestionData {
  suggestions: string[];
  products: Array<{
    _id: string;
    slug: string;
    image: string;
    name: string;
    discount_price: number | null;
    price: number;
  }>;
}

interface MobileLinkProps {
  name: string;
  href: string;
}

interface SearchBarProps {
  className?: string;
  inputId?: string;
}

interface HeaderProps {
  navigationData: UiNavigationData;
}

const userMenuItems = [
  { label: "My Profile", icon: UserIcon, href: "/profile?tab=account" },
  { label: "My Orders", icon: Package, href: "/profile?tab=orders" },
  { label: "Account Settings", icon: Settings, href: "/profile?tab=settings" },
  {
    label: "Addresses",
    icon: MapPin,
    href: "/profile?tab=account",
  },
];

export default function Header({ navigationData }: HeaderProps) {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = useSelector((state: RootState) => state.cart.totalQuantity);
  const wishlistCount = useSelector(
    (state: RootState) => state.wishlist.totalQuantity,
  );

  const pathName = usePathname();

  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLogin);
  const user = useSelector((state: RootState) => state.auth.details) as Record<
    string,
    unknown
  >;
  const logo = useSelector((state: RootState) => state.logo.logo) as
    string | null;

  const dispatch = useDispatch();
  const fetchedRef = useRef(false);

  const fetchUser = async () => {
    if (user && (user as Record<string, unknown>)._id) {
      return;
    }
    const userData = await getUser();
    if (userData && typeof userData === "object" && "_data" in userData) {
      dispatch(setProfile((userData as { _data: unknown })._data));
      dispatch(login(getAuthToken()));
    }
  };

  // Fetch user once on mount if a token cookie exists
  useEffect(() => {
    if (fetchedRef.current) return;
    if (pathName === "/profile") return;
    if (user && (user as Record<string, unknown>)._id) {
      fetchedRef.current = true;
      return;
    }
    // Skip API call if no token cookie exists
    if (!getAuthToken()) {
      fetchedRef.current = true;
      return;
    }
    fetchedRef.current = true;
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn || Cookies.get("loginModal")) {
      return;
    } else {
      setTimeout(() => {
        dispatch(openLoginModal());
        Cookies.set("loginModal", "true", { expires: 1 });
      }, 10000);
      return;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    dispatch(setNavigation(navigationData));
  }, [navigationData]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAndDispatchWishlist(dispatch);
      fetchAndDispatchCart(dispatch);
    }
  }, [isLoggedIn]);

  // SCROLL EFFECT
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const MobileLink = ({ name, href }: MobileLinkProps) => (
    <SheetClose asChild>
      <Link href={href}>
        <Button
          variant="ghost"
          className="w-full justify-start py-3 px-4 text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] rounded-lg font-medium h-auto"
        >
          {name}
        </Button>
      </Link>
    </SheetClose>
  );

  const renderMobileNav = () => (
    <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
      {(navigationData?._data as CategoryItem[])?.map((cat, idx) => (
        <div key={idx}>
          {cat.subCategories?.length == 0 ? (
            <MobileLink name={cat.name} href={urlPrfix(cat.slug)} />
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full border rounded-lg bg-background shadow-sm"
            >
              {/* sub category accordian  */}
              <AccordionItem value="item-1" className="border-b-0">
                          <AccordionTrigger className="py-3 px-4 text-foreground hover:bg-muted rounded-lg font-medium">
                  <Link href={cat.slug == "home" ? "/" : cat.slug}>
                    {cat.name}
                  </Link>
                </AccordionTrigger>
                <AccordionContent className="p-0 border-t bg-muted">
                  {cat.subCategories?.map((menu: MenuItem, menuIdx: number) => (
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full"
                      key={menuIdx}
                    >
                      {/* sub sub category accordian */}
                      <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="py-3 px-4 text-foreground hover:bg-muted rounded-lg font-medium">
                          <SheetClose asChild>
                            <Link
                              href={"/category/" + cat.slug + "/" + menu.slug}
                            >
                              {menu.name}
                            </Link>
                          </SheetClose>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t bg-muted">
                          {menu.subSubCategories &&
                            menu.subSubCategories.map(
                              (subcat: SubSubCategory, subIdx: number) => (
                                <div key={subIdx}>
                                  <MobileLink
                                    name={subcat.name}
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
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      ))}
      <div className="border-t border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] pt-3 mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-2" style={{ color: 'var(--brand-heading)' }}>
          Quick Links
        </p>
        <MobileLink name="About Us" href="/about" />
        <MobileLink name="Contact Us" href="/contact-us" />
        <MobileLink name="FAQ" href="/faq" />
        <MobileLink name="Our Story" href="/story" />
        <MobileLink name="Track Order" href="/order-track" />
        <MobileLink name="Our Policy" href="/our-policy" />
      </div>
    </nav>
  );

  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        // Check if the click is not on the search toggle button
        const searchToggleButton = document.getElementById(
          "search-toggle-button",
        );
        if (
          searchToggleButton &&
          !searchToggleButton.contains(event.target as Node)
        ) {
          setIsSearchOpen(false);
        }
      }
    };

    if (isSearchOpen) {
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
  }, [isSearchOpen]);

  return (
    <>
      <div className="w-full text-center bg-gradient-to-r from-[var(--brand-primary-dark)] via-[var(--brand-primary-dark)] to-[var(--brand-primary-darker)] text-background text-sm py-2.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shimmer"></div>
        <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
          <Truck className="inline rotate-y-180" size={16} />
          Free Shipping above ₹1000 | Welcome to{" "}
          {process.env.NEXT_PUBLIC_APP_NAME}
        </span>
      </div>

      <header className="max-w-screen w-full bg-background/95 z-[190] sticky top-0 left-0 shadow-lg border-b  border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
        {/* Main Header Bar */}
        <div
          className={`w-full border-b   bg-background/95  border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] transition-all duration-500 ${
            isScrolled ? "py-2 shadow-md" : "py-4"
          }`}
        >
          <div className="flex items-center justify-between px-4 md:px-6 w-full">
            {/* Mobile Menu Button - Enhanced */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:text-[var(--brand-secondary)] shrink-0 rounded-xl transition-all duration-300"
              aria-label="Open navigation menu"
              onClick={() => setIsOffcanvasOpen(true)}
            >
              <Menu size={24} />
            </Button>

            {/* Logo - Enhanced with subtle animation */}
            <Link href="/" className="group">
              <Image
                src={logo || "/images/logo.webp"}
                alt={siteConfig.name}
                width={100}
                height={100}
                className={`w-auto cursor-pointer object-cover transition-all duration-500 group-hover:scale-105 ${
                  isScrolled ? "h-8" : "h-12"
                }`}
              />
            </Link>

            {/* Desktop Search - Enhanced with premium shadow */}
            <div className="hidden  lg:block flex-1 px-6">
              <SearchBar className="w-full max-w-xl mx-auto" />
            </div>

            {/* Icons - Enhanced with better hover states */}
            <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
              {/* Wishlist Icon - Premium style */}
              <Link href="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-gradient-to-br hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:text-[var(--brand-primary)] rounded-xl transition-all duration-300 hover:scale-105"
                  aria-label="View wishlist"
                >
                  <Heart
                    fill={wishlistCount > 0 ? "var(--brand-primary-dark)" : "none"}
                    size={22}
                    className={wishlistCount > 0 ? "text-[var(--brand-primary-dark)]" : ""}
                  />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 size-5 flex items-center justify-center p-0 bg-gradient-to-br from-[var(--brand-primary-dark)] to-[var(--brand-primary-darker)] hover:from-[var(--brand-primary-darker)] hover:to-[color-mix(in_srgb,var(--brand-primary-darker)_80%,black)] text-xs shadow-lg border-2 border-white">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Cart Icon - Premium style */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden md:flex hover:bg-gradient-to-br hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:text-[var(--brand-primary)] rounded-xl transition-all duration-300 hover:scale-105"
                aria-label="View shopping bag"
                onClick={() => router.push("/cart")}
              >
                <ShoppingCartIcon
                    fill={cartCount > 0 ? "var(--brand-primary-dark)" : "none"}
                    size={24}
                    className={cartCount > 0 ? "text-[var(--brand-primary-dark)]" : ""}
                  />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-br from-[var(--brand-primary-dark)] to-[var(--brand-primary-darker)] hover:from-[var(--brand-primary-darker)] hover:to-[color-mix(in_srgb,var(--brand-primary-darker)_80%,black)] text-xs shadow-lg border-2 border-white">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* Mobile Search Toggle - Enhanced */}
              <Button
                id="search-toggle-button"
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-gradient-to-br hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:text-[var(--brand-primary)] rounded-xl transition-all duration-300"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-expanded={isSearchOpen}
                aria-controls="mobile-search-bar"
                aria-label="Toggle search bar"
              >
                <Search size={20} />
              </Button>

              {/* User Dropdown - Enhanced */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-gradient-to-br hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:text-[var(--brand-primary)] rounded-xl transition-all duration-300 hover:scale-105"
                    aria-label="User account menu"
                  >
                    {(user as Record<string, string>)?.avatar ? (
                      <div className="relative">
                        <Image
                          src={(user as Record<string, string>).avatar}
                          alt="User Avatar"
                          width={28}
                          height={28}
                           className="rounded-full size-6 md:size-7 border-2 border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
                        />
                      </div>
                    ) : (
                      <UserIcon size={20} />
                    )}
                    {isLoggedIn && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-background/98  border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] shadow-2xl rounded-xl"
                  align="end"
                >
                  {isLoggedIn ? (
                    <>
                      <DropdownMenuLabel className="bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] py-4 rounded-t-xl">
                        <p className="text-sm font-semibold text-foreground">
                          Welcome back! {(user as Record<string, string>)?.name}
                        </p>
                        <p className="text-xs text-[var(--brand-primary-dark)] mt-1 font-medium">
                          {(user as Record<string, string>)?.email}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]" />
                      {userMenuItems.map((item, idx) => (
                        <DropdownMenuItem
                          key={idx}
                          asChild
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:text-[var(--brand-primary-dark)] py-3 transition-all duration-200"
                        >
                          <Link href={item.href} className="flex items-center">
                            <item.icon className="mr-3" size={18} />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]" />
                      <Link href="/profile?tab=settings&logout=true">
                        <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive py-3 transition-all duration-200">
                          <LogOut className="mr-3" size={18} />
                          <span className="font-medium">Logout</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  ) : (
                    <div className="px-3 py-5">
                      <p className="text-sm text-muted-foreground mb-4 font-medium text-center">
                        Sign in to your account
                      </p>
                      <div className="space-y-2 flex flex-col gap-2">
                        <Link href="/login" className="cursor-pointer">
                          <Button className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] hover:from-[var(--brand-primary-dark)] hover:to-[var(--brand-primary-darker)] shadow-lg hover:shadow-xl transition-all duration-300">
                            Sign In
                          </Button>
                        </Link>
                        <Link className="cursor-pointer" href="/signup">
                          <Button
                            variant="outline"
                            className="w-full border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-gradient-to-r hover:from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] transition-all duration-300"
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

          {/* Mobile Search Bar - Enhanced */}
          <div
            ref={mobileSearchRef}
            id="mobile-search-bar"
            className={`w-full lg:hidden transition-all duration-300 ${
              isSearchOpen
                ? "opacity-100 px-4 mt-3 mb-2"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <SearchBar className="relative" inputId="mobile-search" />
          </div>
        </div>

        {/* Premium Navigation Bar */}
        <nav className="hidden md:flex flex-wrap justify-center items-center space-x-8 text-sm font-medium py-3.5  bg-background   border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
          {(navigationData?._data as CategoryItem[])?.map((cat, idx) => (
            <div key={idx}>
              {cat.subCategories?.length == 0 ? (
                <Link
                  href={urlPrfix(cat.slug)}
                  className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground group font-medium"
                >
                  {cat.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ) : (
                <div className="relative group">
                  <button
                    onClick={() => router.push("/category/" + cat.slug)}
                    className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground flex items-center gap-1.5 font-medium"
                    aria-haspopup="menu"
                  >
                    {cat.name}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full"></span>
                  </button>

                  {/* Premium Mega Menu */}
                  <div
                    className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 [transform:_perspective(600px)_rotateX(-90deg)] duration-500 skew-x-10 group-hover:skew-x-0 origin-top group-hover:[transform:_perspective(1200px)_rotateX(0deg)] transition-all fixed left-1/2 -translate-x-1/2 ${
                      isScrolled ? "top-[110px]" : "top-[175px]"
                    } pt-1 z-[999] hover:visible hover:opacity-100`}
                  >
                    <Card className="w-[1150px] backdrop-blur-xl max-w-[98vw] h-auto bg-background/98  shadow-2xl rounded-2xl p-6 border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]">
                      <div className="grid grid-cols-5 gap-6">
                        {cat.subCategories?.map((menu: MenuItem, i: number) => (
                          <div key={i} className="group/menu">
                            <Link
                              href={"/category/" + cat.slug + "/" + menu.slug}
                            >
                              <h4 className="font-bold text-foreground mb-2 pb-1 border-b border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] text-base hover:text-[var(--brand-primary)] transition-colors">
                                <Badge
                                  variant="outline"
                                  className="text-sm font-bold text-[var(--brand-primary)] border-[var(--brand-primary)] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:from-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_15%,transparent)] transition-all duration-300 px-3 py-1"
                                >
                                  {menu.name}
                                </Badge>
                              </h4>
                            </Link>
                            <div className="space-y-2.5">
                              {menu.subSubCategories?.map(
                                (subcat: SubSubCategory, j: number) => (
                                  <div key={j}>
                                    <ul className="space-y-1 text-foreground text-sm">
                                      <li key={subcat._id}>
                                        <Link
                                          href={`/category/${cat.slug}/${menu.slug}/${subcat.slug}`}
                                          className="block hover:text-[var(--brand-secondary)] cursor-pointer transition-all duration-200 hover:translate-x-1 hover:font-medium py-[2px]"
                                        >
                                          {subcat.name}
                                        </Link>
                                      </li>
                                    </ul>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link
            href="/contact-us"
            className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground group font-medium"
          >
            Contact Us
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/order-track"
            className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground group font-medium"
          >
            Track Order
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>
      </header>

      {/* Mobile Menu Button (Left) */}
      <Sheet open={isOffcanvasOpen} onOpenChange={setIsOffcanvasOpen}>
        <SheetContent
          side="left"
          className="w-[80vw] sm:w-80 bg-background p-0 z-[999] border-r border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
        >
          <SheetHeader className="border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] p-5 bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)]">
            <SheetTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--brand-primary-dark)]" />
              Menu
            </SheetTitle>
          </SheetHeader>
          {renderMobileNav()}
        </SheetContent>
      </Sheet>
    </>
  );
}

const SearchBar = ({ className, inputId }: SearchBarProps) => {
  const [suggestions, setSuggestions] = useState<Partial<SuggestionData>>({});
  const value = useSelector((state: RootState) => state.ui.searchValue);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close suggestions when route changes
  useEffect(() => {
    setIsSuggestionsOpen(false);
  }, [pathname]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formElements = form.elements as HTMLFormControlsCollection & {
      search: HTMLInputElement;
    };
    const searchValue = formElements.search.value;
    router.push(`/category/shop-by-category?q=${searchValue}`);
  };
  const suggestionVariants: Variants = {
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (value.trim().length > 1) {
        // Only fetch if more than 1 character
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}api/website/result/suggestion?search=${value}`,
          );
          const resData = await res.json();
          setSuggestions(resData._data as SuggestionData);
          setIsSuggestionsOpen(true);
        } catch {
          setSuggestions({});
          setIsSuggestionsOpen(false);
        }
      } else {
        setIsSuggestionsOpen(false);
      }
    };

    // Add a small debounce to prevent too many requests
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <PlaceholdersAndVanishInput
        placeholders={[
          "Search for Women's Jewellery",
          "Buy Personalized Jewellery",
          "Search for earrings",
          "Find Gift Items",
        ]}
        onSubmit={handleSubmit}
        inputId={inputId}
      />
      <Search
        size={20}
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-primary-dark)] pointer-events-none"
      />

      {isSuggestionsOpen && (
        <motion.div
          initial="closed"
          animate={isSuggestionsOpen ? "open" : "closed"}
          variants={suggestionVariants}
          className="absolute top-full left-0 right-0 h-auto w-[78%] md:w-full mt-1 bg-background rounded-lg shadow-lg z-[200] border border-border overflow-x-hidden overflow-y-auto no-scrollbar"
        >
          <div className="grid grid-cols-[30%_auto] divide-x divide-border">
            {/* Suggestions Column */}
            {(suggestions?.suggestions?.length ?? 0) > 0 ||
            (suggestions?.products?.length ?? 0) > 0 ? (
              <>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 ">
                    <span>Suggestions</span>
                  </h3>
                  <div className="space-y-2">
                    {suggestions?.suggestions?.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors text-sm"
                        onClick={() =>
                          router.push(
                            `/category/shop-by-category?q=${suggestion}`,
                          )
                        }
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Column */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Products</span>
                    <span
                      onClick={() => setIsSuggestionsOpen(false)}
                      className="cursor-pointer"
                    >
                      <X size={20} />
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-auto no-scrollbar">
                    {suggestions?.products?.map((product) => (
                      <Link
                        onClick={() => setIsSuggestionsOpen(false)}
                        key={product._id}
                        href={`/product-details/${product.slug}`}
                        className="group flex flex-col items-center p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="relative w-full aspect-square mb-2 bg-muted rounded-md overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="96px"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-sm font-medium  line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-[var(--brand-primary-dark)] font-medium mt-1">
                          ₹{product.discount_price || product.price}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 col-span-2 text-center text-muted-foreground">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                  <span>No suggestions found</span>
                  <span
                    onClick={() => setIsSuggestionsOpen(false)}
                    className="cursor-pointer"
                  >
                    <X size={20} />
                  </span>
                </h3>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const urlPrfix = (slug: string) => {
  if (slug == "home") return "/";
  else if (slug == "track-your-order") return "/order-track";
  else if (slug == "contact-us") return "/contact-us";
  return "/category/" + slug;
};
