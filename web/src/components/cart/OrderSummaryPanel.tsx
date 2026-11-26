"use client";

import { ArrowRight, Shield, RotateCcw, Truck, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

interface OrderSummaryPanelProps {
  subtotal: number;
  discountAmount: number;
  shipping: number;
  estimatedTotal: number;
}

const TRUST = [
  { icon: Shield, label: "Secure checkout via Razorpay" },
  { icon: Truck, label: "Free shipping on orders over ₹499" },
  { icon: RotateCcw, label: "Easy 15-day returns" },
];

export default function OrderSummaryPanel({
  subtotal,
  discountAmount,
  shipping,
  estimatedTotal,
}: OrderSummaryPanelProps) {
  return (
    <div className="lg:col-span-1">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="sticky top-28 overflow-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-white"
      >
        <div className="relative px-6 pb-4 pt-6">
          <div
            className="absolute inset-x-0 top-0 h-6 bg-[url('/images/paisley-band.svg')] bg-repeat-x bg-[length:auto_100%] opacity-30"
            aria-hidden="true"
          />
          <p className="eyebrow mb-1.5 text-[10px]">
            <span className="mr-1.5">✦</span>
            Your order
          </p>
          <h2 className="display-heading text-xl">Order Summary</h2>
        </div>

        <div className="px-6">
          <div className="space-y-3 border-t border-[var(--brand-gold)]/20 py-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--brand-ink)]/60">Subtotal</span>
              <span className="text-[var(--brand-ink)]">₹{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--brand-mauve)]">Discount</span>
                <span className="text-[var(--brand-mauve)]">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--brand-ink)]/60">Shipping</span>
              <span className="text-[var(--brand-ink)]">
                {shipping === 0 ? (
                  <span className="text-[var(--brand-gold-dark)]">Free</span>
                ) : (
                  `₹${shipping.toFixed(2)}`
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between border-t border-[var(--brand-gold)]/20 py-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/55">
              Estimated total
            </span>
            <motion.span
              key={estimatedTotal}
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              className="display-heading text-2xl text-[var(--brand-plum)]"
            >
              ₹{estimatedTotal.toFixed(2)}
            </motion.span>
          </div>
        </div>

        <div className="space-y-3 px-6 pb-6">
          <Link href="/checkout?type=cart" className="block">
            <motion.span
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="btn-gold w-full !py-3.5 !text-[11px] uppercase tracking-[0.18em]"
            >
              Proceed to Checkout
              <ArrowRight size={15} />
            </motion.span>
          </Link>

          <Link href="/" className="block">
            <span className="flex w-full items-center justify-center rounded-full border border-[var(--brand-gold)]/40 py-3 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/65 transition-colors hover:bg-[var(--brand-cream)]">
              Continue Shopping
            </span>
          </Link>
        </div>

        <div className="border-t border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/60 px-6 py-5">
          <ul className="space-y-2.5">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 text-[11.5px] text-[var(--brand-ink)]/60"
              >
                <Icon
                  size={14}
                  className="shrink-0 text-[var(--brand-gold-dark)]"
                  strokeWidth={1.6}
                />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--brand-mauve)]">
            <Sparkles size={11} /> Gift wrapping available
          </p>
        </div>
      </motion.div>
    </div>
  );
}
