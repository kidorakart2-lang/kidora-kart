"use client";

import { motion } from "motion/react";
import type { ProductVariant } from "@/types";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  productStock: number;
  onSelect: (variant: ProductVariant) => void;
}

export default function VariantSelector({
  variants,
  selectedVariant,
  productStock,
  onSelect,
}: VariantSelectorProps) {
  return (
    <div className="space-y-2">
      {variants.map((variant) => {
        const active = selectedVariant?._id === variant._id;
        const outOfStock = variant.quantity > (productStock ?? 0);
        const hasDiscount = variant.mrp != null && variant.mrp > variant.price;
        const discountPercent = hasDiscount
          ? Math.round(((variant.mrp! - variant.price) / variant.mrp!) * 100)
          : 0;

        return (
          <motion.button
            key={variant._id ?? variant.name}
            type="button"
            onClick={() => onSelect(variant)}
            disabled={outOfStock}
            whileHover={!outOfStock ? { y: -1 } : {}}
            whileTap={!outOfStock ? { scale: 0.99 } : {}}
            aria-pressed={active}
            className={`relative w-full rounded-xl border px-4 pt-6 pb-4 text-left transition-all duration-200 ${
              outOfStock
                ? "opacity-50 cursor-not-allowed border-border bg-muted/40"
                : active
                  ? "border-brand-accent-200 bg-brand-accent-50"
                  : "border-border bg-background hover:border-brand-accent-200 hover:bg-brand-accent-50/50"
            }`}
          >
            {active && hasDiscount && discountPercent > 0 && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent-600 px-2.5 py-1 text-[10px] font-medium text-white">
                SAVE {discountPercent}%
              </span>
            )}

            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm fw-heading ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {variant.name}
              </span>
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through fw-body">
                    ₹{variant.mrp!.toLocaleString()}
                  </span>
                )}
                <span className="text-sm fw-heading text-foreground">
                  ₹{variant.price.toLocaleString()}
                </span>
              </div>
            </div>

            {outOfStock && (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] fw-cta text-destructive">
                Out of stock
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
