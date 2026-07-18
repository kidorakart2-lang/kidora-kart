"use client";

import { motion } from "motion/react";

interface QuantitySelectorProps {
  quantity: number;
  stock: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function QuantitySelector({
  quantity,
  stock,
  onIncrement,
  onDecrement,
}: QuantitySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mb-7"
    >
      <h3 className="text-base uppercase tracking-widest text-foreground mb-5 font-[350]">
        Quantity
      </h3>
      <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
        <motion.button
          type="button"
          onClick={onDecrement}
          disabled={quantity <= 1}
          whileHover={{
            backgroundColor:
              "color-mix(in srgb, var(--brand-500) 5%, transparent)",
          }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          −
        </motion.button>
        <div className="w-12 h-10 flex items-center justify-center text-foreground font-light border-x border-border">
          {quantity}
        </div>
        <motion.button
          type="button"
          onClick={onIncrement}
          disabled={quantity >= stock}
          whileHover={{
            backgroundColor:
              "color-mix(in srgb, var(--brand-500) 5%, transparent)",
          }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          +
        </motion.button>
      </div>
    </motion.div>
  );
}
