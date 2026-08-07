"use client";

import { useMemo } from "react";
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
import type { WishlistSliceItem } from "@/redux/features/wishlist";
import { useProductsByIds } from "@/lib/useProduct";
import { toast } from "sonner";
import type { RootState } from "@/redux/store/store";

export default function GuestWishlist() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Guest wishlist stores lean items (id + slug only) in Redux; the product
  // details (name, image, price) are fetched by batch so cards render fully.
  const items = useSelector(
    (state: RootState) => state.wishlist.wishlistItems as WishlistSliceItem[]
  );

  const ids = useMemo(
    () => [...new Set(items.map((item) => item._id).filter(Boolean))],
    [items]
  );
  const { productMap, isLoading } = useProductsByIds(ids);

  const displayItems = useMemo(
    () =>
      items.map((item) => {
        const product = item._id ? productMap.get(item._id) : undefined;
        return {
          _id: item._id,
          slug: item.slug ?? product?.slug ?? "",
          name: product?.name ?? "Loading...",
          image: product?.image ?? "/placeholder.svg",
          price: product?.price ?? 0,
          discount_price: product?.discount_price,
        };
      }),
    [items, productMap]
  );

  const handleRemoveFromWishlist = (item: WishlistSliceItem) => {
    dispatch(removeFromWishlist({ _id: item._id, isGuest: true }));
    toast.success("Removed from wishlist");
  };

  if (items.length === 0) {
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
            href="/category/all"
            className="inline-flex items-center gap-2 btn-gradient font-medium py-3 px-8
                     rounded-xl transition-all duration-300 shadow-sm"
          >
            <ShoppingBag size={18} />
            Start Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
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
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>

          {/* Guest notice */}
          <div className="mt-4 inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border">
            <LogIn size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <Link href="/login" className="font-semibold text-foreground hover:underline">
                Login
              </Link>{" "}
              to save your wishlist permanently
            </span>
          </div>
        </motion.div>

        {/* Wishlist Grid */}
        {isLoading && ids.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {Array.from({ length: Math.min(ids.length, 8) }).map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-xl overflow-hidden border border-border shadow-sm"
              >
                <div className="aspect-[1/1] bg-muted/60 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted/60 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, index) => (
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
                className="group relative bg-background rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Remove Button */}
                <motion.button
                  onClick={() => handleRemoveFromWishlist(item)}
                  className="absolute top-2 right-2 z-20 w-7 h-7 bg-background/90 backdrop-blur-sm 
                           rounded-full border border-border flex items-center justify-center
                           hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove from wishlist"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </motion.button>

                {/* Image Container */}
                <div
                  className="relative aspect-[1/1] bg-muted/30 overflow-hidden cursor-pointer"
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
                    className="text-sm font-medium text-foreground mb-2 line-clamp-2 cursor-pointer leading-snug min-h-[2.5rem]"
                    onClick={() => router.push(`/product-details/${item.slug}`)}
                  >
                    {item.name}
                  </h3>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base font-semibold text-foreground">
                      ₹{(item.discount_price || item.price || 0).toLocaleString()}
                    </span>
                    {item.price &&
                      item.discount_price &&
                      item.price > item.discount_price && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{item.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1 py-0.5 rounded">
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
        )}

        {/* Continue Shopping Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/category/all"
            className="inline-flex items-center gap-2 btn-gradient font-medium py-3 px-8 rounded-xl transition-all duration-300"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
