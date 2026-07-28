"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, Package } from "lucide-react";
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
  const unitPrice = item.product.discount_price || item.product.price;
  const totalPrice = unitPrice * item.quantity;

  return (
    <div className="group bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Left accent stripe with brand gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 via-brand-400 to-brand-600 opacity-60" />

      <div className="flex gap-5 p-5 sm:p-6 relative z-10">
        {/* Product Image */}
        <Link
          href={`/product-details/${item.product.slug}`}
          className="flex-shrink-0"
        >
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden border border-border bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md">
            <Image
              src={item.product.image ?? "/placeholder.svg"}
              alt={item.product.name}
              width={144}
              height={144}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top row: name + remove button */}
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <Link href={`/product-details/${item.product.slug}`}>
                <h3 className="text-base sm:text-lg fw-heading text-foreground line-clamp-2 hover:text-brand-700 transition-colors leading-snug">
                  {item.product.name}
                </h3>
              </Link>

              {/* Color indicator */}
              {item.color?.name && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-border shadow-sm shrink-0"
                    style={{ backgroundColor: item.color.code }}
                  />
                  <span className="text-xs text-muted-foreground">{item.color.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onRemove(item._id)}
              className="shrink-0 w-9 h-9 rounded-lg bg-muted hover:bg-destructive/10 border border-border hover:border-destructive/30 flex items-center justify-center transition-all duration-300 group/btn"
              aria-label="Remove item"
            >
              <Trash2
                size={15}
                className="text-muted-foreground group-hover/btn:text-destructive transition-colors"
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* Bottom row: price + quantity + stock */}
          <div className="flex flex-wrap items-end justify-between gap-4 mt-auto pt-3">
            {/* Quantity controls */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-border rounded-lg overflow-hidden bg-muted/30">
                <button
                  disabled={loading || item.quantity <= 1}
                  onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className="w-10 text-center text-sm fw-heading text-foreground border-x border-border bg-background/50">
                  {item.quantity}
                </span>
                <button
                  disabled={loading || item.quantity >= (item.product.stock ?? 0)}
                  onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>

              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package size={12} strokeWidth={1.5} />
                {(item.product.stock ?? 0)} in stock
              </span>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-lg sm:text-xl fw-heading text-foreground">
                ₹{totalPrice.toFixed(2)}
              </p>
              {item.product.discount_price && (
                <p className="text-xs text-muted-foreground line-through">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
