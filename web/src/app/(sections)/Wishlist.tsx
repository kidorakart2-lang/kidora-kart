"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { getAuthToken } from "@/lib/cookies";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import LoadingOverlay from "@/components/comman/LoadingOverlay";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { setWishlist } from "@/redux/features/wishlist";
import { useProductsByIds } from "@/lib/useProduct";
import type { WishlistProduct } from "@/types";
import type { RootState } from "@/redux/store/store";

interface WishlistDisplayItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  discount_price?: number;
  slug: string;
  originalPrice?: number;
  stock: number;
}

export default function Wishlist({
  wishlist,
}: {
  wishlist: WishlistProduct[] | { items: WishlistProduct[] } | null;
}) {
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Read Redux wishlist items for guest/fallback path
  const reduxWishlistItems = useSelector(
    (state: RootState) => state.wishlist?.wishlistItems ?? [],
  );
  const hasServerData = !!wishlist;

  // Collect product IDs from Redux wishlist items for guest batch fetch
  const wishlistIds = useMemo(() => {
    if (hasServerData) return [];
    return [
      ...new Set(reduxWishlistItems.map((item) => item._id).filter(Boolean)),
    ];
  }, [hasServerData, reduxWishlistItems]);

  const { productMap, isLoading: guestProductsLoading } =
    useProductsByIds(wishlistIds);

  // Build display items from fetched product data for guest/fallback
  const guestItems: WishlistDisplayItem[] = useMemo(() => {
    if (hasServerData) return [];
    return reduxWishlistItems.map((item) => {
      const fetched = item._id ? productMap.get(item._id) : undefined;
      return {
        _id: item._id,
        name: fetched?.name ?? "Loading...",
        image: fetched?.image ?? "/placeholder.svg",
        price: fetched?.price ?? 0,
        discount_price: fetched?.discount_price,
        slug: item.slug ?? "",
        stock: fetched?.stock ?? 0,
        originalPrice: fetched?.price,
      };
    });
  }, [hasServerData, reduxWishlistItems, productMap]);

  const removeFromWishlist = async (id: string): Promise<void> => {
    setWishlistLoading(true);
    try {
      const response = await fetch(
        "/api/website/wishlist/remove/" + id,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            productId: id,
          }),
        },
      );
      const responseData = await response.json();
      if (response.ok || responseData._status) {
        router.push("/wishlist");
        toast.success(responseData._message);
      } else {
        toast.error(responseData._message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    if (!wishlist || wishlist == null) return;
    dispatch(setWishlist(wishlist));
  }, [wishlist, dispatch]);

  // Determine which items to render: SSR data (server) or guest items with TanStack Query
  const displayItems: WishlistDisplayItem[] = hasServerData
    ? (Array.isArray(wishlist) ? wishlist : (wishlist?.items ?? [])).map((item) => ({
        _id: item._id,
        name: item.name,
        image: item.image ?? "/placeholder.svg",
        price: item.price,
        discount_price: item.discount_price,
        slug: item.slug,
        originalPrice: item.originalPrice,
        stock: item.stock ?? 0,
      }))
    : guestItems;

  const isLoading = hasServerData ? false : guestProductsLoading;

  // ── Empty state ──────────────────────────────────────────────────
  if (displayItems.length === 0 && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[70vh] flex items-center justify-center py-16"
      >
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} fill="currentColor" />
          </div>

          <div className="space-y-2">
             <h2 className="text-2xl fw-heading text-foreground tracking-tight">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground text-sm">
              Save your favorite items and create your dream collection.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 btn-gradient fw-cta py-3 px-8
                     rounded-xl transition-all duration-300 shadow-sm"
          >
            <ShoppingBag size={18} />
            Start Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingOverlay hidden={false} />
      </div>
    );
  }

  // ── Wishlist grid ────────────────────────────────────────────────
  return (
    <>
      <section
        id="wishlist"
        className="py-12 md:py-16 bg-muted/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
             <h1 className="text-2xl sm:text-3xl fw-heading tracking-tight text-foreground">
              My Wishlist
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {displayItems.length}{" "}
              {displayItems.length === 1 ? "item" : "items"} saved
            </p>
          </motion.div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, index) => (
                <WishlistCard
                  key={item._id}
                  item={item}
                  index={index}
                  onRemove={removeFromWishlist}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Continue Shopping Button */}
          {displayItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 btn-gradient fw-cta py-3 px-8
                         rounded-xl transition-all duration-300"
              >
                <ShoppingBag size={18} />
                Continue Shopping
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <LoadingOverlay hidden={wishlistLoading} />
    </>
  );
}

function WishlistCard({
  item,
  index,
  onRemove,
}: {
  item: WishlistDisplayItem;
  index: number;
  onRemove: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 },
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        layout: { duration: 0.3 },
      }}
      className="group relative bg-background rounded-2xl overflow-hidden shadow-md
               hover:shadow-xl transition-all duration-300 border border-border"
    >
      {/* Remove Button */}
      <motion.button
        onClick={() => onRemove(item._id)}
        className="absolute top-3 right-3 z-20 w-10 h-10 bg-background/90 backdrop-blur-sm
                 rounded-full shadow-lg border border-border flex items-center
                 justify-center hover:bg-destructive hover:text-destructive-foreground
                 transition-all duration-300"
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Remove from wishlist"
      >
        <X className="w-5 h-5 text-muted-foreground transition-colors" />
      </motion.button>

      {/* Stock Badge */}
      <div className="absolute top-3 left-3 z-20">
        {item.stock < 0 ? (
          <span
            className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-accent-500 to-destructive
                         text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            <span className="w-1.5 h-1.5 bg-background rounded-full animate-pulse"></span>
            Out of Stock
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600
                         text-background text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            <span className="w-1.5 h-1.5 bg-background rounded-full"></span>
            In Stock
          </span>
        )}
      </div>

      {/* Image Container */}
      <div
        className="relative h-72 sm:h-80 bg-muted/30 overflow-hidden cursor-pointer"
        onClick={() => router.push(`/product-details/${item.slug}`)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full"
        >
          <Image
            src={item.image ?? "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>
      </div>

      {/* Product Details */}
      <div className="p-5">
        <h3
          className="text-base font-medium text-foreground mb-3 line-clamp-2
                   transition-colors cursor-pointer leading-tight min-h-[3rem]"
          onClick={() => router.push(`/product-details/${item.slug}`)}
        >
          {item.name}
        </h3>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              ₹{item.price.toFixed(2)}
            </span>
            {item.originalPrice != null && item.originalPrice > item.price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{item.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {item.originalPrice != null && item.originalPrice > item.price && (
            <div
              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600
                          text-xs font-semibold px-2 py-1 rounded-md"
            >
              {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
