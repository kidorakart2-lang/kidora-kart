"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import type { OrderTrackingResponse } from "@/types";

interface OrderItemsListProps {
  items?: OrderTrackingResponse["order"]["items"];
  isGift?: boolean;
  giftMessage?: string;
}

export default function OrderItemsList({ items, isGift, giftMessage }: OrderItemsListProps) {
  if (!items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">2</div>
        <div>
          <h2 className="display-heading text-lg">Order Items</h2>
          <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">{items.length} items in this order</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4 rounded-lg border border-[var(--brand-gold)]/15 bg-[var(--brand-cream)]/60 p-3 transition-colors hover:bg-[var(--brand-cream)]">
            <Link href={`/product-details/${(item.productId as { slug?: string })?.slug || ""}`}>
              <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-[var(--brand-gold)]/20 bg-white">
                <Image src={item.images?.[0] || "/placeholder.jpg"} alt={item.name} width={96} height={96} className="h-full w-full object-cover" />
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <h3 className="display-heading truncate text-[14px] italic">{item.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                <span className="text-[11.5px] text-[var(--brand-ink)]/55">Qty: {item.quantity}</span>
                <span className="text-[13.5px] text-[var(--brand-ink)]">₹{(item.subtotal ?? item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</span>
              </div>
              {item.variantName && (
                <p className="mt-1 text-[11.5px] text-[var(--brand-gold-dark)]">✦ {item.variantName}</p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[var(--brand-ink)]/55">
                <span>Colour</span>
                <span
                  style={{
                    backgroundColor: item.colorId?.code || "#ccc",
                    width: "12px", height: "12px", borderRadius: "50%",
                    display: "inline-block", border: "1px solid rgba(198,168,117,0.5)",
                  }}
                />
                {item.colorId?.name || ""}
              </p>
              {item.isPersonalized && item.personalizedName && (
                <p className="mt-2 inline-block rounded border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-2 py-1 text-[11px] text-[var(--brand-ink)]/70">
                  <span className="text-[var(--brand-gold-dark)]">Personalised:</span> {item.personalizedName}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {isGift && giftMessage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-r-lg border-l-2 border-[var(--brand-gold)] bg-[var(--brand-cream)] p-4">
          <div className="flex items-start gap-2">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold-dark)]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-gold-dark)]">Gift Order</p>
              <p className="mt-1 text-[12.5px] text-[var(--brand-ink)]/70"><span className="text-[var(--brand-ink)]/50">Message:</span> {giftMessage}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
