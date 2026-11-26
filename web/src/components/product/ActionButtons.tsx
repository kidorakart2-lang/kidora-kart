"use client";

import { motion } from "motion/react";
import { ShoppingBag, Heart, Loader2, Minus, Plus } from "lucide-react";

interface ActionButtonsProps {
  loading: boolean;
  wishlistLoading: boolean;
  isWishlisted: boolean;
  stock: number;
  onAddToCart: (e: React.FormEvent) => void;
  onWishlist: () => void;
  onBuyNow: () => void;
  children?: React.ReactNode;
  topChildren?: React.ReactNode;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  quantityLocked?: boolean;
}

export default function ActionButtons({
  loading,
  wishlistLoading,
  isWishlisted,
  stock,
  onAddToCart,
  onWishlist,
  onBuyNow,
  children,
  topChildren,
  quantity,
  onIncrement,
  onDecrement,
  quantityLocked,
}: ActionButtonsProps) {
  const isOutOfStock = stock <= 0;
  const showStepper =
    typeof quantity === "number" && onIncrement && onDecrement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mt-6 space-y-2.5"
    >
      {topChildren}

      <div className="flex items-stretch gap-2">
        {showStepper && (
          <div className="hidden h-[52px] items-center rounded-full border border-[var(--brand-gold)]/40 px-1.5 sm:flex">
            <button
              type="button"
              onClick={onDecrement}
              disabled={quantityLocked || quantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-8 place-items-center rounded-full text-[var(--brand-ink)]/70 transition-colors hover:bg-[var(--brand-cream)] disabled:opacity-30"
            >
              <Minus size={13} />
            </button>
            <span className="w-7 text-center text-sm tabular-nums text-[var(--brand-ink)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={quantityLocked || quantity >= (stock || 10)}
              aria-label="Increase quantity"
              className="grid size-8 place-items-center rounded-full text-[var(--brand-ink)]/70 transition-colors hover:bg-[var(--brand-cream)] disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock || loading}
          className="h-[52px] flex-1 rounded-full bg-[var(--brand-plum)] px-4 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-cream)] transition-all duration-300 hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ShoppingBag size={15} />
            )}
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </span>
        </button>

        <button
          type="button"
          disabled={wishlistLoading}
          onClick={onWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border transition-colors ${
            isWishlisted
              ? "border-[var(--brand-mauve)] bg-[var(--brand-rose)]/35 text-[var(--brand-mauve)]"
              : "border-[var(--brand-gold)]/40 text-[var(--brand-ink)]/70 hover:bg-[var(--brand-cream)]"
          } ${wishlistLoading ? "opacity-50" : ""}`}
        >
          {wishlistLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart
              size={17}
              fill={isWishlisted ? "currentColor" : "none"}
              strokeWidth={1.6}
            />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onBuyNow}
        disabled={isOutOfStock}
        className="h-[52px] w-full rounded-full border border-[var(--brand-pink)] bg-[#ffffff] text-[11px] uppercase tracking-[0.18em] text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buy Now
      </button>

      {children}

      {!isOutOfStock && stock <= 5 && (
        <p className="text-center text-xs text-[var(--brand-mauve)]">
          Only {stock} left in stock — order soon
        </p>
      )}
    </motion.div>
  );
}
