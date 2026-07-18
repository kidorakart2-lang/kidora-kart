"use client";

import { ShoppingCart, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartEmptyState() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <div className="text-center space-y-6 max-w-sm px-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl fw-heading text-foreground tracking-tight">
            Your Cart is Empty
          </h2>
          <p className="text-muted-foreground text-sm">
            Discover our toy collection and add items to get started.
          </p>
        </div>

        <Link
          href="/category/new-arrival"
          className="inline-flex items-center gap-2 btn-gradient fw-cta py-3 px-8
                   rounded-xl transition-all duration-300 shadow-sm"
        >
          <ShoppingBag size={18} />
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
