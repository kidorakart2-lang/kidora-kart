"use client";

import { ShoppingCart, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export default function CartEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[70vh] flex items-center justify-center py-16"
    >
      <div className="text-center space-y-8 max-w-md px-4">
        {/* Animated cartoon icon */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center shadow-lg border border-brand-200 dark:border-brand-700/30"
        >
          <ShoppingCart
            className="w-12 h-12 text-brand-600 dark:text-brand-400"
            strokeWidth={1.5}
          />
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-3xl fw-heading text-foreground tracking-tight">
            Your Cart is Empty
          </h2>
          <p className="text-muted-foreground fw-body text-sm leading-relaxed max-w-sm mx-auto">
            Looks like you haven&apos;t added anything yet. Explore our collection of toys and games to find something special!
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles size={12} className="text-brand-500" />
          <span>New arrivals added weekly</span>
          <Sparkles size={12} className="text-brand-500" />
        </div>

        <Link
          href="/category/new-arrival"
          className="inline-flex items-center gap-2 btn-gradient fw-cta py-3.5 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group"
        >
          <ShoppingBag size={17} />
          <span>Start Shopping</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
