"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

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
      <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border sticky top-24">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Order Summary
          </h2>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-4 py-6 border-y border-border">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-[var(--brand-accent-600)]">
              <span>Discount</span>
              <span className="font-semibold">
                -₹{discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="font-semibold text-foreground">
              ₹{shipping.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-6">
          <span className="text-lg font-semibold text-foreground">
            Estimated Total
          </span>
          <span className="text-2xl font-bold text-foreground">
            ₹{estimatedTotal.toFixed(2)}
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link href="/checkout?type=cart">
            <button
              className="w-full btn-gradient fw-cta
                         py-4 rounded-xl transition-all duration-300 shadow-sm
                         flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>
          </Link>

          <Link href="/">
            <button
              className="w-full mt-4 bg-background border border-border hover:border-foreground/30
                         text-muted-foreground hover:text-foreground fw-cta py-4 rounded-xl
                         transition-all duration-300"
            >
              Continue Shopping
            </button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-[var(--brand-accent-100)] flex items-center justify-center">
              <svg
                className="w-3 h-3 text-[var(--brand-accent-600)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-[var(--brand-accent-100)] flex items-center justify-center">
              <svg
                className="w-3 h-3 text-[var(--brand-accent-600)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>100% Safe & Tested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
