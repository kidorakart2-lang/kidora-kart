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
import { toast } from "sonner";
import type { WishlistProduct } from "@/types";
import type { RootState } from "@/redux/store/store";

export default function GuestWishlist() {
  const router = useRouter();
  const dispatch = useDispatch();

  const items = useSelector((state: RootState) => state.wishlist.wishlistItems as WishlistProduct[]);

  const handleRemoveFromWishlist = (item: WishlistProduct) => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                className="group relative bg-background rounded-2xl overflow-hidden shadow-md 
                         hover:shadow-xl transition-all duration-300 border border-border"
              >
                {/* Remove Button */}
                <motion.button
                  onClick={() => handleRemoveFromWishlist(item)}
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
                        ₹{(item.discount_price || item.price || 0).toFixed(2)}
                      </span>
                      {item.price &&
                        item.discount_price &&
                        item.price > item.discount_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.price.toFixed(2)}
                          </span>
                        )}
                    </div>

                    {item.price &&
                      item.discount_price &&
                      item.price > item.discount_price && (
                        <div
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 
                                    text-xs font-semibold px-2 py-1 rounded-md"
                        >
                          {Math.round(
                            (1 - item.discount_price / item.price) * 100
                          )}
                          % OFF
                        </div>
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
