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
          className="flex items-center gap-4 p-3 bg-muted rounded-xl"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-border flex items-center justify-center">
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
            <p className="text-sm sm:text-base font-medium text-foreground truncate">
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>Qty: {item.quantity}</span>
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
                className="mt-1.5 text-[10px] h-5 px-1.5 text-brand-700 border-brand-200 bg-brand-50"
              >
                <Gift className="w-2.5 h-2.5 mr-1" />
                {item.personalizedName}
              </Badge>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-semibold text-brand-600">
              ₹{item.priceAtPurchase * item.quantity}
            </p>
            <p className="text-[11px] text-muted-foreground">
              ₹{item.priceAtPurchase} ea
            </p>
          </div>
        </div>
      ))}
      {items.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-xs text-brand-600 hover:text-brand-700 font-medium py-2 hover:bg-brand-50 rounded-lg transition-colors"
        >
          {showAll ? "Show less" : `+${items.length - 3} more items`}
        </button>
      )}
    </div>
  );
}
