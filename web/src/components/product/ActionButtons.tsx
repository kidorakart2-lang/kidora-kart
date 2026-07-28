"use client";

import { motion } from "motion/react";
import { ShoppingCart, ShoppingBag, Heart, Loader2, Zap } from "lucide-react";

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
  const isOutOfStock = stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, duration: 0.5 }}
      className="mt-auto space-y-3"
    >
      {/* Primary row: Add to Cart + Wishlist */}
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock || loading}
          whileHover={!isOutOfStock && !loading ? { y: -2 } : {}}
          whileTap={!isOutOfStock && !loading ? { scale: 0.98 } : {}}
          className="flex-1 h-13 rounded-xl border-2 border-border bg-background
                   text-foreground fw-cta flex items-center justify-center gap-2.5
                   hover:bg-muted hover:border-foreground/20
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300 text-sm tracking-wider active:scale-[0.98]"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={18} />
            </motion.div>
          ) : (
            <>
              {isOutOfStock ? (
                <ShoppingCart size={17} className="opacity-60" />
              ) : (
                <ShoppingBag size={17} />
              )}
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          disabled={wishlistLoading}
          onClick={onWishlist}
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className={`w-13 h-13 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
            isWishlisted
              ? "border-brand-accent-300 bg-brand-accent-50 text-brand-accent-500 shadow-sm"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:border-foreground/20"
          } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wishlistLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <motion.div
              animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={19}
                fill={isWishlisted ? "currentColor" : "none"}
                strokeWidth={isWishlisted ? 2.5 : 1.5}
              />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Buy Now button — gradient */}
      <motion.button
        type="button"
        onClick={onBuyNow}
        disabled={isOutOfStock}
        whileHover={!isOutOfStock ? { y: -2 } : {}}
        whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
        className="w-full h-13 rounded-xl btn-gradient fw-cta flex items-center justify-center gap-2.5
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-300 text-sm tracking-wider shadow-md hover:shadow-lg active:shadow-sm"
      >
        <Zap size={17} />
        <span>Buy Now</span>
      </motion.button>

      {/* Stock indicator */}
      {!isOutOfStock && stock <= 5 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-amber-600 fw-body"
        >
          Only {stock} left in stock — order soon
        </motion.p>
      )}
    </motion.div>
  );
}
