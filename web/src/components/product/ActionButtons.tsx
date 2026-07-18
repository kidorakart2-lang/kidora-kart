"use client";

import { motion } from "motion/react";
import { ShoppingCart, ShoppingBag, Heart } from "lucide-react";

interface ActionButtonsProps {
  loading: boolean;
  wishlistLoading: boolean;
  isWishlisted: boolean;
  stock: number;
  onAddToCart: (e: React.FormEvent) => void;
  onWishlist: () => void;
  onBuyNow: () => void;
}

export default function ActionButtons({
  loading,
  wishlistLoading,
  isWishlisted,
  stock,
  onAddToCart,
  onWishlist,
  onBuyNow,
}: ActionButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="space-y-3 mt-auto"
    >
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onAddToCart}
          disabled={!stock || loading}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-background border border-border text-foreground py-4 px-6 rounded-full fw-cta flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:border-border transition-all text-sm uppercase tracking-wider"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <ShoppingCart size={18} />
            </motion.div>
          ) : (
            <>
              <ShoppingBag size={18} />
              <span>Add to Cart</span>
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          disabled={wishlistLoading}
          onClick={onWishlist}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 flex items-center justify-center rounded-full border transition-all ${
            isWishlisted
              ? "text-red-500 border-red-300 bg-red-50"
              : "border-border hover:border-border text-muted-foreground"
          }`}
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </motion.button>
      </div>

      <motion.button
        type="button"
        onClick={onBuyNow}
        disabled={!stock}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="w-full btn-gradient py-4 px-6 rounded-full fw-cta flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm uppercase tracking-wider"
      >
        <span>Buy Now</span>
        <ShoppingCart size={18} />
      </motion.button>
    </motion.div>
  );
}
