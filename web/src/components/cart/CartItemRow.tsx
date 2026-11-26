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
  const unitPrice = item.product.discount_price || item.product.price;
  const totalPrice = unitPrice * item.quantity;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white p-3 transition-colors duration-300 hover:border-[var(--brand-gold)]/55 sm:p-4">
      <div className="flex gap-4">
        <Link
          href={`/product-details/${item.product.slug}`}
          className="shrink-0"
          aria-label={`View ${item.product.name}`}
        >
          <div className="framed-tile size-24 overflow-hidden rounded-lg sm:size-28">
            <Image
              src={item.product.image ?? "/placeholder.svg"}
              alt={item.product.name}
              width={112}
              height={112}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/product-details/${item.product.slug}`}>
                <h3 className="display-heading line-clamp-2 text-base italic leading-snug transition-colors hover:text-[var(--brand-mauve)] sm:text-lg">
                  {item.product.name}
                </h3>
              </Link>

              {item.color?.name && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className="size-3 shrink-0 rounded-full border border-[var(--brand-gold)]/40"
                    style={{ backgroundColor: item.color.code }}
                  />
                  <span className="text-[11.5px] text-[var(--brand-ink)]/55">
                    {item.color.name}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => onRemove(item._id)}
              className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--brand-ink)]/40 transition-colors hover:bg-[var(--brand-rose)]/30 hover:text-destructive"
              aria-label={`Remove ${item.product.name} from cart`}
            >
              <Trash2 size={15} strokeWidth={1.6} />
            </button>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-9 items-center rounded-full border border-[var(--brand-gold)]/40 px-1">
                <button
                  disabled={loading || item.quantity <= 1}
                  onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                  className="grid size-7 place-items-center rounded-full text-[var(--brand-ink)]/70 transition-colors hover:bg-[var(--brand-cream)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span className="w-7 text-center text-[13px] tabular-nums text-[var(--brand-ink)]">
                  {item.quantity}
                </span>
                <button
                  disabled={loading || item.quantity >= (item.product.stock ?? 0)}
                  onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                  className="grid size-7 place-items-center rounded-full text-[var(--brand-ink)]/70 transition-colors hover:bg-[var(--brand-cream)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>

              <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/40">
                {item.product.stock ?? 0} in stock
              </span>
            </div>

            <div className="text-right">
              <p className="display-heading text-base text-[var(--brand-ink)] sm:text-lg">
                ₹{totalPrice.toFixed(2)}
              </p>
              {item.product.discount_price && (
                <p className="text-[11px] text-[var(--brand-ink)]/40 line-through">
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
