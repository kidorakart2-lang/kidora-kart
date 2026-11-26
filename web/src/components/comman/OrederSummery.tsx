"use client";
import React, { useEffect, useState } from "react";
import { Truck } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import type { OrderSummaryCartItem, CouponData } from "@/types";

interface OrderSummaryOrderData {
  giftWrap?: boolean;
}

interface ShippingEstimate {
  estimatedCharge: number;
  courierName?: string;
  etd?: string;
}

export default function OrederSummery({ cartItems, type, orderData, coupon, shippingEstimate }: {
  cartItems: OrderSummaryCartItem[];
  type: string;
  orderData: OrderSummaryOrderData;
  coupon: CouponData | null;
  shippingEstimate?: ShippingEstimate | null;
}) {
  if (type === "direct" || type === "cart") {
    const [personalizedName, setPersonalizedName] = useState("");

    // Load personalized name from sessionStorage on component mount
    useEffect(() => {
      const storedName = sessionStorage.getItem("personalizedName");
      if (storedName) {
        setPersonalizedName(storedName);
      }
    }, []);

    // Update sessionStorage when personalizedName changes
    useEffect(() => {
      if (personalizedName) {
        sessionStorage.setItem("personalizedName", personalizedName);
      }
    }, [personalizedName]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPersonalizedName(e.target.value);
    };

    const subtotal = cartItems.reduce(
      (sum, item) =>
        sum +
        (item.variantPrice != null
          ? item.variantPrice
          : (item?.product?.discount_price || item?.product?.price) *
            item?.quantity),
      0
    );

    const giftWrapCharge = orderData.giftWrap ? 50 : 0;
    const shippingCharge = shippingEstimate?.estimatedCharge ?? 50;

    let couponDiscount = 0;

    // coupon has: discountPercentage, minAmount, maxAmount (max discount value)
    if (coupon && coupon.discountPercentage) {
      const isEligible = subtotal >= (coupon.minAmount || 0);

      if (isEligible) {
        const percentageDiscount = (subtotal * coupon.discountPercentage) / 100;
        // Cap discount amount by coupon.maxAmount, e.g. upto 200
        couponDiscount = Math.min(
          percentageDiscount,
          coupon.maxAmount || percentageDiscount
        );
      }
    }

    const total = subtotal + giftWrapCharge + shippingCharge - couponDiscount;

    return (
      <div>
        {/* Order Items */}
        <div className="mb-5 space-y-3">
          {cartItems.map((item, index) => (
            <div key={item._id || index} className="flex items-start gap-3">
              <div className="framed-tile size-[68px] shrink-0 overflow-hidden rounded-lg border border-[var(--brand-gold)]/20">
                <Link
                  className="w-full h-full"
                  href={`/product-details/${item?.product?.slug}`}
                >
                  <Image
                    src={item?.product?.image || "/placeholder.svg"}
                    alt={item?.product?.name || "cart image"}
                    width={80}
                    height={80}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </Link>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="display-heading truncate text-[13.5px] italic">
                  {item?.product?.name}
                </h3>
                <p className="text-[11.5px] text-[var(--brand-ink)]/55">
                  Qty: {item?.quantity}{" "}
                  {type == "cart" && item?.color && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--brand-ink)]/60">
                      <span
                        style={{ backgroundColor: item.color.code }}
                        className="w-3 h-3 rounded-full border border-border inline-block"
                      />
                      {item.color.name}
                    </span>
                  )}
                  {type == "direct" && item?.colorCode && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--brand-ink)]/60">
                      <span
                        style={{ backgroundColor: item.colorCode }}
                        className="w-3 h-3 rounded-full border border-border inline-block"
                      />
                      {item.colorName}
                    </span>
                  )}
                  {item.variantName && (
                    <span className="ml-1 rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 px-2 py-0.5 text-[10px] text-[var(--brand-gold-dark)]">
                      {item.variantName}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[13px] text-[var(--brand-ink)]">
                  {item.variantPrice != null ? (
                    <>₹{item.variantPrice.toLocaleString()}</>
                  ) : (
                    <>₹{item?.product?.discount_price}</>
                  )}
                  {!item.variantPrice && item?.product?.discount_price && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">
                      ₹{item?.product?.price}
                    </span>
                  )}
                </p>
              </div>
              {item.isPersonalized && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    Personalized Name
                  </span>
                  <input
                    type="text"
                    value={personalizedName}
                    onChange={handleNameChange}
                    className="border border-input rounded px-2 py-1 text-sm bg-background text-foreground"
                    placeholder="Enter name"
                    aria-label="Personalized name for item"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="space-y-3 border-t border-[var(--brand-gold)]/20 pt-4">
          <div className="flex justify-between text-[12.5px] text-[var(--brand-ink)]/60">
            <span>Subtotal</span>
            <span>
              ₹
              {cartItems.reduce(
                (sum, item) =>
                  sum +
                  (item.variantPrice != null
                    ? item.variantPrice
                    : (item?.product?.discount_price || item?.product?.price) *
                      item?.quantity),
                0
              )}
            </span>
          </div>

          <div className="flex justify-between text-[12.5px] text-[var(--brand-ink)]/60">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Shipping
            </span>
            <span className="text-[var(--brand-ink)]">
              {shippingEstimate ? (
                <span className="text-[var(--brand-gold-dark)]">₹{shippingCharge}</span>
              ) : (
                <span>₹{shippingCharge}</span>
              )}
            </span>
          </div>

          {shippingEstimate?.courierName && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--brand-ink)]/50">Courier</span>
              <span className="text-[var(--brand-ink)]/80">
                {shippingEstimate.courierName}
              </span>
            </div>
          )}

          {shippingEstimate?.etd && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--brand-ink)]/50">Est. Delivery</span>
              <span className="text-[var(--brand-mauve)]">{shippingEstimate.etd}</span>
            </div>
          )}

          {orderData.giftWrap && (
            <div className="flex justify-between text-[12.5px] text-[var(--brand-ink)]/60">
              <span>Gift Wrap</span>
              <span>₹50</span>
            </div>
          )}

          {couponDiscount > 0 && (
            <p className="mt-1 text-xs text-[var(--brand-accent-600)]">
              Coupon applied: -₹{Math.round(couponDiscount)}
            </p>
          )}

          <div className="mt-2 border-t border-[var(--brand-gold)]/25 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/55">
                Total
              </span>
              <span className="display-heading text-xl text-[var(--brand-plum)]">
                ₹{total}
              </span>
            </div>
            <p className="mt-1 text-[10.5px] text-[var(--brand-ink)]/40">
              Inclusive of all taxes
            </p>
          </div>

          {/* Payment Info Cards */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-3 py-2">
              <span className="text-[13px] text-[var(--brand-gold-dark)]">✓</span>
              <span className="text-[11.5px] text-[var(--brand-gold-dark)]">
                5% discount on online payment
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--brand-mauve)]/30 bg-[var(--brand-rose)]/20 px-3 py-2">
              <span className="text-[13px] text-[var(--brand-mauve)]">✓</span>
              <span className="text-[11.5px] text-[var(--brand-plum)]/80">
                10% advance and the rest on delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <div>SomeThing went wrong </div>;
}
