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
        className="flex min-h-[70vh] items-center justify-center bg-[var(--brand-cream)] px-4 py-16"
      >
        <div className="max-w-sm space-y-7 text-center">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mx-auto grid size-24 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-white"
          >
            <Heart className="h-9 w-9 text-[var(--brand-gold)]" strokeWidth={1.3} fill="currentColor" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="display-heading text-3xl">
              Your Wishlist is Empty
            </h2>
            <p className="text-[12.5px] leading-relaxed text-[var(--brand-ink)]/65">
              Save your favourite pieces and create your dream collection. Start exploring our jewellery.
            </p>
          </div>

          <Link
            href="/"
            className="btn-gold inline-flex items-center gap-2 !text-[10.5px] uppercase tracking-[0.18em]"
          >
            <ShoppingBag size={15} />
            Start Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <section className="min-h-screen bg-[var(--brand-cream)] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--brand-gold)]/15" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[var(--brand-gold)]/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white">
                <div className="h-40 animate-pulse bg-[var(--brand-cream)]" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--brand-gold)]/10" />
                  <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--brand-gold)]/10" />
                  <div className="h-8 w-full animate-pulse rounded-full bg-[var(--brand-gold)]/10" />
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
      <section className="min-h-screen bg-[var(--brand-cream)] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <p className="eyebrow mb-2"><span className="mr-2">✦</span>Saved for later</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display-heading text-3xl md:text-4xl">
                My Wishlist
              </h1>
              <span className="inline-flex items-center justify-center rounded-full border border-[var(--brand-gold)]/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-gold-dark)]">
                {displayItems.length} {displayItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--brand-ink)]/65">
              Pieces you&apos;ve kept close to your heart
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-[var(--brand-gold)]/50 via-[var(--brand-gold)]/20 to-transparent" />
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
                className="btn-gold inline-flex items-center gap-2 !text-[10.5px] uppercase tracking-[0.18em]"
              >
                <ShoppingBag size={15} />
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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white transition-all duration-300 hover:border-[var(--brand-gold)]/50 hover:shadow-md"
    >
      {/* Remove Button */}
      <motion.button
        onClick={() => onRemove(item._id)}
        className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-white/90 text-[var(--brand-ink)]/65 backdrop-blur-sm transition-all duration-300 hover:border-destructive/40 hover:bg-destructive hover:text-white md:opacity-0 md:group-hover:opacity-100"
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Remove from wishlist"
      >
        <X className="w-3 h-3" strokeWidth={2} />
      </motion.button>

      {/* Stock Badge */}
      <div className="absolute top-2 left-2 z-20">
        {item.stock <= 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/30 bg-white/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--brand-ink)]/65 backdrop-blur-sm">
            <span className="size-1 animate-pulse rounded-full bg-destructive" />
            Out of Stock
          </span>
        ) : item.stock <= 5 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-mauve)]/35 bg-[var(--brand-rose)]/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--brand-plum)] backdrop-blur-sm">
            <Clock size={8} />
            {item.stock} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-cream)]/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--brand-gold-dark)] backdrop-blur-sm">
            <span className="size-1 rounded-full bg-[var(--brand-gold)]" />
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
        className="relative aspect-square cursor-pointer overflow-hidden bg-[var(--brand-cream)]"
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
          className="line-clamp-2 min-h-[2.5rem] cursor-pointer text-[13.5px] leading-snug text-[var(--brand-ink)] transition-colors hover:text-[var(--brand-mauve)]"
          onClick={() => router.push(`/product-details/${item.slug}`)}
        >
          {item.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="display-heading text-[16px] text-[var(--brand-plum)]">
            ₹{(item.discount_price || item.price || 0).toLocaleString()}
          </span>
          {item.price && item.discount_price && item.price > item.discount_price && (
            <span className="text-[11px] text-[var(--brand-ink)]/65 line-through">
              ₹{item.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 mt-auto pt-1.5">
          <button
            onClick={() => router.push(`/product-details/${item.slug}`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--brand-gold)]/40 py-2 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65 transition-all duration-300 hover:border-[var(--brand-plum)] hover:bg-[var(--brand-plum)] hover:text-[var(--brand-cream)]"
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
