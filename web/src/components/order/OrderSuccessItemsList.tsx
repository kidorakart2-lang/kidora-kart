"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrderItem } from "@/types/order";

export default function OrderSuccessItemsList({
  items,
}: {
  items: OrderItem[];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? items : items.slice(0, 3);

  return (
    <div className="space-y-3">
      {displayed.map((item) => (
        <div
          key={item._id}
          className="flex items-center gap-4 rounded-lg border border-[var(--brand-gold)]/15 bg-[var(--brand-cream)]/60 p-3"
        >
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--brand-gold)]/20 bg-white sm:size-24">
            {item.images?.[0] ? (
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground select-none">No img</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="display-heading truncate text-[14px] italic">
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>Qty: {item.quantity}</span>
              {item.variantName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[var(--brand-gold-dark)]">{item.variantName}</span>
                </>
              )}
              {item.colorId?.name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-border inline-block"
                      style={{ backgroundColor: item.colorId.code }}
                    />
                    {item.colorId.name}
                  </span>
                </>
              )}
            </div>
            {item.isPersonalized && item.personalizedName && (
              <Badge
                variant="outline"
                className="mt-1.5 h-5 border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 px-1.5 text-[10px] text-[var(--brand-gold-dark)]"
              >
                <Gift className="w-2.5 h-2.5 mr-1" />
                {item.personalizedName}
              </Badge>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[14px] text-[var(--brand-plum)]">
              ₹{item.subtotal ?? item.priceAtPurchase * item.quantity}
            </p>
            {!item.variantName && (
              <p className="text-[11px] text-muted-foreground">
                ₹{item.priceAtPurchase} ea
              </p>
            )}
          </div>
        </div>
      ))}
      {items.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-full py-2 text-center text-[10.5px] uppercase tracking-[0.16em] text-[var(--brand-gold-dark)] transition-colors hover:bg-[var(--brand-cream)]"
        >
          {showAll ? "Show less" : `+${items.length - 3} more items`}
        </button>
      )}
    </div>
  );
}
