"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Heart,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  LogIn,
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
        <div className="text-center space-y-8 max-w-md">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand-300"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-brand-400"
                  animate={{
                    scale: [0.9, 1.2, 0.9],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [-3, 3, -3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Heart
                    className="w-16 h-16 text-brand-500"
                    strokeWidth={1.5}
                    fill="currentColor"
                  />
                </motion.div>
              </div>
            </div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-6 h-6 text-brand-500" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground text-base">
              Save your favorite pieces and create your dream collection
            </p>
          </div>

          <Link
            href="/category/all"
className="inline-flex items-center gap-2 btn-gradient font-medium py-3 px-8 rounded-full shadow-sm transform hover:scale-105"
          >
            <ShoppingBag size={18} />
            Start Shopping
            <ChevronRight size={18} />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <section
      id="wishlist"
      className="py-12 md:py-16 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
              Your Collection
            </span>
            <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-4 tracking-wide">
            My Wishlist
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-brand-600"></div>
            <div className="w-3 h-3 bg-brand-600 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-brand-600"></div>
          </div>

          <p className="text-muted-foreground text-base md:text-lg font-light">
            {items.length} {items.length === 1 ? "item" : "items"} saved for
            later
          </p>

          {/* Guest notice */}
          <div className="mt-4 inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
            <LogIn size={16} className="text-brand-600" />
            <span className="text-sm text-brand-800">
              <Link href="/login" className="font-semibold hover:underline">
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
                         hover:shadow-2xl transition-all duration-500 border border-border 
                         hover:border-brand-200"
              >
                {/* Remove Button */}
                <motion.button
                  onClick={() => handleRemoveFromWishlist(item)}
                  className="absolute top-3 right-3 z-20 w-10 h-10 bg-background/90 backdrop-blur-sm 
                           rounded-full shadow-lg border border-border flex items-center 
                           justify-center hover:bg-background hover:border-brand-accent-400 hover:scale-110 
                           transition-all duration-300"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove from wishlist"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-brand-accent-500 transition-colors" />
                </motion.button>

                {/* Image Container */}
                <div
                  className="relative h-72 sm:h-80 bg-gradient-to-br from-brand-50 to-muted 
                           overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/product-details/${item.slug}`)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
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

                  {/* Hover Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  {/* Quick View Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-0 right-0 text-center opacity-0 
                             group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <span className="text-background text-sm font-medium">
                      Click to View Details
                    </span>
                  </motion.div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3
                    className="text-lg font-semibold text-foreground mb-3 line-clamp-2 
                             group-hover:text-brand-700 transition-colors cursor-pointer 
                             leading-tight min-h-[3.5rem]"
                    onClick={() => router.push(`/product-details/${item.slug}`)}
                  >
                    {item.name}
                  </h3>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
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
                          <Sparkles className="w-3 h-3" />
                          {Math.round(
                            (1 - item.discount_price / item.price) * 100
                          )}
                          % OFF
                        </div>
                      )}
                  </div>
                </div>

                {/* Bottom Shine Effect */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r 
                             from-transparent via-brand-400 to-transparent opacity-0 
                             group-hover:opacity-100 transition-opacity duration-500"
                ></div>
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
            className="inline-flex items-center gap-2 btn-gradient font-medium py-4 px-10 rounded-full shadow-sm transform hover:scale-105"
          >
            <ShoppingBag size={18} />
            Continue Shopping
            <ChevronRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
