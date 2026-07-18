"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2 } from "lucide-react";
import type { CartApiItem } from "@/app/(sections)/Cart";

interface CartItemRowProps {
  item: CartApiItem;
  loading: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemRow({
  item,
  loading,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div
      className="group bg-background rounded-2xl p-5 sm:p-6 shadow-sm
                 transition-all duration-300 border border-border
                 relative overflow-hidden"
    >
      <div className="flex gap-4 sm:gap-6 relative z-10">
        {/* Product Image */}
        <Link
          href={`/product-details/${item.product.slug}`}
          className="flex-shrink-0"
        >
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-border
                        transition-all duration-300 bg-muted"
          >
            <Image
              src={item.product.image ?? "/placeholder.svg"}
              alt={item.product.name}
              width={128}
              height={128}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-4">
              <Link href={`/product-details/${item.product.slug}`}>
                <h3
                  className="text-base sm:text-lg font-semibold text-foreground mb-2
                             transition-colors line-clamp-2"
                >
                  {item.product.name}
                </h3>
              </Link>

              {/* Color */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">
                  Color:
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: item.color.code }}
                    className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.color.name}
                  </span>
                </div>
              </div>

              {/* Price */}
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                ₹
                {(
                  item.product.discount_price || item.product.price
                ).toFixed(2)}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(item._id)}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-muted hover:bg-destructive/10
                       border border-border hover:border-destructive/30 flex items-center justify-center
                       transition-all duration-300 group/btn"
              aria-label="Remove item"
            >
              <Trash2
                size={16}
                className="text-muted-foreground group-hover/btn:text-destructive transition-colors"
              />
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-full p-1 border border-border">
              <button
                disabled={loading || item.quantity === 1}
                onClick={() =>
                  onUpdateQuantity(item._id, item.quantity - 1)
                }
                className="w-8 h-8 rounded-full hover:bg-background border border-transparent 
                         hover:border-border flex items-center justify-center transition-all 
                         disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus size={14} className="text-muted-foreground" />
              </button>
              <span className="w-10 text-center font-semibold text-foreground">
                {item.quantity}
              </span>
              <button
                disabled={
                  loading || item.quantity === item.product.stock
                }
                onClick={() =>
                  onUpdateQuantity(item._id, item.quantity + 1)
                }
                className="w-8 h-8 rounded-full hover:bg-background border border-transparent 
                         hover:border-border flex items-center justify-center transition-all 
                         disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} className="text-muted-foreground" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {item.product.stock} in stock
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
