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
      className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">2</div>
        <div>
          <h2 className="font-semibold text-foreground text-base">Order Items</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} items in this order</p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
            <Link href={`/product-details/${(item.productId as { slug?: string })?.slug || ""}`}>
              <div className="w-24 h-24 bg-background rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-border">
                <Image src={item.images?.[0] || "/placeholder.jpg"} alt={item.name} width={96} height={96} className="w-full h-full object-cover" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                <span className="text-lg font-semibold text-foreground">₹{(item.subtotal ?? item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</span>
              </div>
              {item.variantName && (
                <p className="text-sm text-brand-600 fw-cta mt-1">🎁 {item.variantName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <span>Color :</span>
                <span
                  style={{
                    backgroundColor: item.colorId?.code || "#ccc",
                    width: "20px", height: "20px", borderRadius: "50%",
                    display: "inline-block", marginRight: "5px",
                  }}
                />
                {item.colorId?.name || ""}
              </p>
              {item.isPersonalized && item.personalizedName && (
                <p className="text-sm text-muted-foreground mt-2 bg-muted px-2 py-1 rounded inline-block">
                  <span className="font-medium">Personalized:</span> <span className="text-foreground">{item.personalizedName}</span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {isGift && giftMessage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-start gap-2">
            <Gift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Gift Order</p>
              <p className="text-sm text-blue-700 mt-1"><span className="font-medium">Message:</span> {giftMessage}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
