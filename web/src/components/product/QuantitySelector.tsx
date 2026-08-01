"use client";

import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  stock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** When true, the stepper is read-only (e.g. a selected pack fixes the qty). */
  locked?: boolean;
}

export default function QuantitySelector({
  quantity,
  stock,
  onIncrement,
  onDecrement,
  locked = false,
}: QuantitySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-1 h-4 rounded-full bg-brand-500" />
        <h3 className="text-sm uppercase tracking-[0.2em] text-muted-foreground fw-heading">
          Quantity
        </h3>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="inline-flex items-center rounded-xl border-2 border-border bg-background
                     shadow-sm overflow-hidden"
        >
          <motion.button
            type="button"
            onClick={onDecrement}
            disabled={locked || quantity <= 1}
            whileTap={{ scale: 0.92 }}
            className="w-11 h-11 flex items-center justify-center text-muted-foreground
                     hover:bg-muted transition-colors duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Decrease quantity"
          >
            <Minus size={15} strokeWidth={2.5} />
          </motion.button>

          <div className="w-14 h-11 flex items-center justify-center border-x-2 border-border bg-muted/30">
            <motion.span
              key={quantity}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-base fw-heading text-foreground tabular-nums"
            >
              {quantity}
            </motion.span>
          </div>

          <motion.button
            type="button"
            onClick={onIncrement}
            disabled={locked || quantity >= stock}
            whileTap={{ scale: 0.92 }}
            className="w-11 h-11 flex items-center justify-center text-muted-foreground
                     hover:bg-muted transition-colors duration-200
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Increase quantity"
          >
            <Plus size={15} strokeWidth={2.5} />
          </motion.button>
        </div>

        <span className="text-xs text-muted-foreground fw-body">
          {locked ? "Pack size fixed" : `${stock} available`}
        </span>
      </div>
    </motion.div>
  );
}
