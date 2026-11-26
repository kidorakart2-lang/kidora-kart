"use client";

import { ShoppingBag, ArrowRight, Gem } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export default function CartEmptyState() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--brand-cream)] px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md text-center"
      >
        <div className="arch-top mx-auto mb-7 grid h-24 w-24 place-items-center border border-[var(--brand-gold)]/40 bg-white text-[var(--brand-gold-dark)]">
          <Gem size={30} strokeWidth={1.3} />
        </div>

        <p className="eyebrow mb-3">
          <span className="mr-2">✦</span>
          Nothing selected yet
        </p>
        <h1 className="display-heading text-3xl sm:text-4xl">
          Your bag is <span className="accent-italic">empty.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--brand-ink)]/65">
          Every heirloom starts with a first piece. Explore our collections of
          earrings, necklaces, bangles and more to find something special.
        </p>

        <Link href="/category" className="btn-gold mt-8">
          <ShoppingBag size={16} />
          Start Shopping
          <ArrowRight size={15} />
        </Link>

        <p className="mt-5 text-[10.5px] uppercase tracking-[0.2em] text-[var(--brand-mauve)]">
          New arrivals added weekly
        </p>
      </motion.div>
    </main>
  );
}
