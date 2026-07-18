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
      className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">4</div>
        <h2 className="font-semibold text-foreground text-base">Order Summary</h2>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">₹{pricing.subtotal?.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">{pricing.shipping === 0 ? "Free" : `₹${pricing.shipping?.toLocaleString("en-IN")}`}</span>
        </div>
        {pricing.discount?.amount != null && pricing.discount.amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Discount</span>
            <span className="text-emerald-600">-₹{pricing.discount.amount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {isCodAdvance && pricing.advance != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Left</span>
            <span className="text-foreground">₹{pricing.total - pricing.advance}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">₹{pricing.total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
