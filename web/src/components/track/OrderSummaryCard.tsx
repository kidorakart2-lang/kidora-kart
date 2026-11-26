"use client";

import { motion } from "motion/react";

interface PricingInfo {
  subtotal?: number;
  shipping?: number;
  total: number;
  advance?: number;
  discount?: { amount?: number };
}

interface OrderSummaryCardProps {
  pricing?: PricingInfo;
  isCodAdvance?: boolean;
}

export default function OrderSummaryCard({ pricing, isCodAdvance }: OrderSummaryCardProps) {
  if (!pricing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
      className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">4</div>
        <h2 className="display-heading text-lg">Order Summary</h2>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-[12.5px]">
          <span className="text-[var(--brand-ink)]/55">Subtotal</span>
          <span className="text-[var(--brand-ink)]">₹{pricing.subtotal?.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-[12.5px]">
          <span className="text-[var(--brand-ink)]/55">Shipping</span>
          <span className="text-[var(--brand-ink)]">{pricing.shipping === 0 ? "Free" : `₹${pricing.shipping?.toLocaleString("en-IN")}`}</span>
        </div>
        {pricing.discount?.amount != null && pricing.discount.amount > 0 && (
          <div className="flex justify-between text-[12.5px]">
            <span className="text-[var(--brand-mauve)]">Discount</span>
            <span className="text-[var(--brand-mauve)]">-₹{pricing.discount.amount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {isCodAdvance && pricing.advance != null && (
          <div className="flex justify-between text-[12.5px]">
            <span className="text-[var(--brand-ink)]/55">Amount Left</span>
            <span className="text-[var(--brand-ink)]">₹{(pricing.total - pricing.advance).toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-[var(--brand-gold)]/25 pt-3">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/55">Total</span>
          <span className="display-heading text-xl text-[var(--brand-plum)]">₹{pricing.total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
