"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, ShoppingBag, Sparkles, Clock, Eye } from "lucide-react";
import Image from "next/image";
import { getAuthToken } from "@/lib/cookies";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import LoadingOverlay from "@/components/comman/LoadingOverlay";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { setWishlist, removeFromWishlist } from "@/redux/features/wishlist";
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

  const reduxWishlistItems = useSelector(
    (state: RootState) => state.wishlist?.wishlistItems ?? [],
  );
  const hasServerData = !!wishlist;

  const wishlistIds = useMemo(() => {
    if (hasServerData) return [];
    return [...new Set(reduxWishlistItems.map((item) => item._id).filter(Boolean))];
  }, [hasServerData, reduxWishlistItems]);

  const { productMap, isLoading: guestProductsLoading } = useProductsByIds(wishlistIds);

  useEffect(() => {
    if (!wishlist) return;
    dispatch(setWishlist(wishlist));
  }, [wishlist, dispatch]);

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

  const removeFromWishlistHandler = async (id: string): Promise<void> => {
    setWishlistLoading(true);
    try {
      const response = await fetch(`/api/website/wishlist/remove/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ productId: id }),
      });
      const responseData = await response.json();
      if (response.ok || responseData._status) {
        // Optimistically remove from Redux
        dispatch(removeFromWishlist({ _id: id }));
        toast.success(responseData._message);
      } else {
        toast.error(responseData._message);
      }
    } catch (error) {
      const serverErr = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(serverErr?.response?.data?.message || (error instanceof Error ? error.message : "Something went wrong"));
    } finally {
      setWishlistLoading(false);
    }
  };

  /* handleAddToCart temporarily removed — wishlist items don't carry colorId */

  // ── Empty state ──
  if (displayItems.length === 0 && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[70vh] flex items-center justify-center py-16"
      >
        <div className="text-center space-y-8 max-w-md px-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-brand-accent-100 to-brand-accent-200 dark:from-brand-accent-900/30 dark:to-brand-accent-800/30 flex items-center justify-center shadow-lg border border-brand-accent-200 dark:border-brand-accent-700/30"
          >
            <Heart className="w-12 h-12 text-brand-accent-500" strokeWidth={1.5} fill="currentColor" />
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-3xl fw-heading text-foreground tracking-tight">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground text-sm fw-body leading-relaxed">
              Save your favorite items and create your dream collection. Start exploring our toys!
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 btn-gradient fw-cta py-3.5 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ShoppingBag size={17} />
            Start Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-8 bg-muted rounded-lg animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Wishlist grid ──
  return (
    <>
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl fw-heading tracking-tight text-foreground">
                My Wishlist
              </h1>
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-brand-accent-100 text-brand-accent-600 text-sm fw-heading">
                {displayItems.length} items
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 fw-body">
              Items you&apos;ve saved for later
            </p>
            <div className="h-px bg-gradient-to-r from-border via-border to-transparent mt-4" />
          </motion.div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, index) => (
                <WishlistCard
                  key={item._id}
                  item={item}
                  index={index}
                  onRemove={removeFromWishlistHandler}
                  onAddToCart={async () => {}}
                  cartLoading={false}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Continue Shopping */}
          {displayItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 btn-gradient fw-cta py-3.5 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ShoppingBag size={17} />
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
  onAddToCart,
  cartLoading,
}: {
  item: WishlistDisplayItem;
  index: number;
  onRemove: (id: string) => Promise<void>;
  onAddToCart: (item: WishlistDisplayItem) => Promise<void>;
  cartLoading: boolean;
}) {
  const router = useRouter();
  const discountPercentage = item.price && item.discount_price && item.price > item.discount_price
    ? Math.round((1 - item.discount_price / item.price) * 100)
    : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4, delay: index * 0.05, layout: { duration: 0.3 } }}
      className="group relative bg-background rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      {/* Remove Button */}
      <motion.button
        onClick={() => onRemove(item._id)}
        className="absolute top-2 right-2 z-20 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Remove from wishlist"
      >
        <X className="w-3 h-3" strokeWidth={2} />
      </motion.button>

      {/* Stock Badge */}
      <div className="absolute top-2 left-2 z-20">
        {item.stock <= 0 ? (
          <span className="inline-flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[10px] fw-cta px-1.5 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
            <span className="w-1 h-1 bg-destructive-foreground rounded-full animate-pulse" />
            Out of Stock
          </span>
        ) : item.stock <= 5 ? (
          <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[10px] fw-cta px-1.5 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
            <Clock size={8} />
            {item.stock} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] fw-cta px-1.5 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
            <span className="w-1 h-1 bg-white rounded-full" />
            In Stock
          </span>
        )}
      </div>

      {/* Discount Badge — commented out: overlaps with remove button */}
      {/*discountPercentage > 0 && (
        <div className="absolute top-2 right-2 z-20 bg-brand-accent-500 text-white text-[10px] fw-cta px-1.5 py-0.5 rounded-md shadow-md">
          {discountPercentage}% OFF
        </div>
      )*/}

      {/* Image */}
      <div
        className="relative aspect-[1/1] bg-muted/30 overflow-hidden cursor-pointer"
        onClick={() => router.push(`/product-details/${item.slug}`)}
      >          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            <Image
              src={item.image ?? "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3
          className="text-sm fw-heading text-foreground line-clamp-2 hover:text-brand-700 transition-colors cursor-pointer leading-snug min-h-[2.5rem]"
          onClick={() => router.push(`/product-details/${item.slug}`)}
        >
          {item.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base fw-heading text-foreground">
            ₹{(item.discount_price || item.price || 0).toLocaleString()}
          </span>
          {item.price && item.discount_price && item.price > item.discount_price && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{item.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 mt-auto pt-1.5">
          <button
            onClick={() => router.push(`/product-details/${item.slug}`)}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 fw-body text-[11px] transition-all duration-300 flex items-center justify-center gap-1"
          >
            <Eye size={12} strokeWidth={1.5} />
            View
          </button>

          {/* Cart button hidden — wishlist items don't carry colorId, so adding to cart fails */}
          {/* <button
            onClick={() => onAddToCart(item)}
            disabled={item.stock <= 0 || cartLoading}
            className="flex-1 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed fw-cta text-[11px] transition-all duration-300 flex items-center justify-center gap-1 shadow-sm"
          >
            <ShoppingBag size={12} strokeWidth={1.5} />
            {cartLoading ? "Adding..." : "Cart"}
          </button> */}
        </div>
      </div>
    </motion.article>
  );
}
