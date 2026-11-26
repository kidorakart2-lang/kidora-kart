"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ShoppingBag,
  LogIn,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "@/redux/features/wishlist";
import { useProductsByIds } from "@/lib/useProduct";
import { toast } from "sonner";
import type { WishlistProduct } from "@/types";
import type { RootState } from "@/redux/store/store";

interface GuestWishlistItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  discount_price?: number;
  slug: string;
}

export default function GuestWishlist() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Redux stores only lean { _id, slug } — fetch full product data by ids
  const leanItems = useSelector(
    (state: RootState) => state.wishlist.wishlistItems as WishlistProduct[],
  );
  const ids = leanItems.map((item) => item._id).filter(Boolean);
  const { productMap, isLoading } = useProductsByIds(ids);

  const items: GuestWishlistItem[] = leanItems.map((item) => {
    const fetched = item._id ? productMap.get(item._id) : undefined;
    return {
      _id: item._id,
      name: fetched?.name ?? "Loading...",
      image: fetched?.image ?? "/placeholder.svg",
      price: fetched?.price ?? 0,
      discount_price: fetched?.discount_price,
      slug: item.slug ?? fetched?.slug ?? "",
    };
  });

  const handleRemoveFromWishlist = (item: { _id: string }) => {
    dispatch(removeFromWishlist({ _id: item._id, isGuest: true }));
    toast.success("Removed from wishlist");
  };

  if (isLoading && leanItems.length > 0) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-white py-16">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[var(--brand-gold)]" />
          <p className="text-[12px] text-[var(--brand-ink)]/50">Loading your wishlist…</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[70vh] items-center justify-center bg-white px-4 py-16"
      >
        <div className="max-w-sm space-y-6 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-white">
            <Heart className="h-8 w-8 text-[var(--brand-gold)]" strokeWidth={1.3} fill="currentColor" />
          </div>

          <div className="space-y-2">
            <h2 className="display-heading text-2xl">
              Your Wishlist is <span className="accent-italic">Empty</span>
            </h2>
            <p className="text-[12.5px] text-[var(--brand-ink)]/55">
              Save your favourite pieces and create your dream collection.
            </p>
          </div>

          <Link
            href="/category/all"
            className="btn-gold inline-flex items-center gap-2 !text-[10.5px] uppercase tracking-[0.18em]"
          >
            <ShoppingBag size={15} />
            Start Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <section
      id="wishlist"
      className="bg-white py-12 md:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="eyebrow mb-2"><span className="mr-2">✦</span>Saved for later</p>
          <h1 className="display-heading text-2xl sm:text-3xl">
            My <span className="accent-italic">Wishlist</span>
          </h1>
          <p className="mt-1.5 text-[12px] text-[var(--brand-ink)]/50">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>

          {/* Guest notice */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/30 bg-white px-4 py-2">
            <LogIn size={14} className="text-[var(--brand-gold-dark)]" />
            <span className="text-[11.5px] text-[var(--brand-ink)]/55">
              <Link href="/login" className="text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 hover:no-underline">
                Login
              </Link>{" "}
              to save your wishlist permanently
            </span>
          </div>
        </motion.div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.article
                key={item._id}
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
                className="group relative overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white transition-all duration-300 hover:border-[var(--brand-gold)]/50 hover:shadow-md"
              >
                {/* Remove Button */}
                <motion.button
                  onClick={() => handleRemoveFromWishlist(item)}
                  className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-white/90 text-[var(--brand-ink)]/50 backdrop-blur-sm transition-all duration-300 hover:border-destructive/40 hover:bg-destructive hover:text-white"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove from wishlist"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </motion.button>

                {/* Image Container */}
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden bg-[var(--brand-cream)]"
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
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </motion.div>
                </div>

                {/* Product Details */}
                <div className="p-3">
                  <h3
                    className="mb-2 line-clamp-2 min-h-[2.5rem] cursor-pointer text-[13.5px] leading-snug text-[var(--brand-ink)] transition-colors hover:text-[var(--brand-mauve)]"
                    onClick={() => router.push(`/product-details/${item.slug}`)}
                  >
                    {item.name}
                  </h3>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="display-heading text-[16px] text-[var(--brand-plum)]">
                      ₹{(item.discount_price || item.price || 0).toLocaleString()}
                    </span>
                    {item.price &&
                      item.discount_price &&
                      item.price > item.discount_price && (
                        <>
                          <span className="text-[11px] text-[var(--brand-ink)]/40 line-through">
                            ₹{item.price.toLocaleString()}
                          </span>
                          <span className="rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 px-1.5 py-0.5 text-[9.5px] text-[var(--brand-gold-dark)]">
                            {Math.round((1 - item.discount_price / item.price) * 100)}%
                          </span>
                        </>
                      )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* Continue Shopping Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/category/all"
            className="btn-gold inline-flex items-center gap-2 !text-[10.5px] uppercase tracking-[0.18em]"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
