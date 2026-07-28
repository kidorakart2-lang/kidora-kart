"use client";

import { ShoppingBag, ArrowRight, Shield, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

interface OrderSummaryPanelProps {
  subtotal: number;
  discountAmount: number;
  shipping: number;
  estimatedTotal: number;
}

export default function OrderSummaryPanel({
  subtotal,
  discountAmount,
  shipping,
  estimatedTotal,
}: OrderSummaryPanelProps) {
  return (
    <div className="lg:col-span-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 sticky top-24 overflow-hidden"
      >
        {/* Header with brand accent */}
        <div className="flex items-center gap-3 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-brand-600" strokeWidth={2} />
          </div>
          <h2 className="text-base fw-heading text-foreground">
            Order Summary
          </h2>
        </div>

        {/* Price Breakdown */}
        <div className="px-6 sm:px-8">
          <div className="space-y-3.5 py-5 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="fw-heading text-foreground">₹{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-accent-600">Discount</span>
                <span className="fw-heading text-brand-accent-600">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="fw-heading text-foreground">
                {shipping === 0 ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  `₹${shipping.toFixed(2)}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="px-6 sm:px-8">
          <div className="flex justify-between items-center py-4 border-t border-border">
            <span className="text-base fw-heading text-foreground">Estimated Total</span>
            <motion.span
              key={estimatedTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl fw-heading text-foreground"
              style={{
                background: "linear-gradient(135deg, var(--brand-price-1-from), var(--brand-price-1-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ₹{estimatedTotal.toFixed(2)}
            </motion.span>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4">
          <Link href="/checkout?type=cart">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-gradient fw-cta py-3.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </motion.button>
          </Link>

          <Link href="/">
            <button className="w-full py-3 rounded-xl border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground fw-cta text-sm transition-all duration-300">
              Continue Shopping
            </button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <Shield size={13} className="text-brand-600" strokeWidth={2} />
              </div>
              <span>Secure checkout via Razorpay</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Truck size={13} className="text-emerald-600" strokeWidth={2} />
              </div>
              <span>Free shipping on orders over ₹499</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw size={13} className="text-amber-600" strokeWidth={2} />
              </div>
              <span>Easy 7-day returns</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
