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
        (item?.product?.discount_price || item?.product?.price) *
          item?.quantity,
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
        <div className="space-y-4 mb-6">
          {cartItems.map((item, index) => (
            <div key={item._id || index} className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <Link
                  className="w-full h-full"
                  href={`/product-details/${item?.product?.slug}`}
                >
                  <Image
                    src={item?.product?.image || "/placeholder.svg"}
                    alt={item?.product?.name || "cart image"}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </Link>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm fw-heading text-foreground truncate">
                  {item?.product?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Qty: {item?.quantity}{" "}
                  {type == "cart" && item?.color && (
                    <span className="text-xs text-brand-500 fw-body inline-flex items-center gap-1">
                      <span
                        style={{ backgroundColor: item.color.code }}
                        className="w-3 h-3 rounded-full border border-border inline-block"
                      />
                      {item.color.name}
                    </span>
                  )}
                  {type == "direct" && item?.colorCode && (
                    <span className="text-xs text-brand-500 fw-body inline-flex items-center gap-1">
                      <span
                        style={{ backgroundColor: item.colorCode }}
                        className="w-3 h-3 rounded-full border border-border inline-block"
                      />
                      {item.colorName}
                    </span>
                  )}
                </p>
                <p className="text-sm fw-body text-foreground mt-1">
                  ₹{item?.product?.discount_price}
                  {item?.product?.discount_price && (
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
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>
              ₹
              {cartItems.reduce(
                (sum, item) =>
                  sum +
                  (item?.product?.discount_price || item?.product?.price) *
                    item?.quantity,
                0
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Shipping
            </span>
            <span className="text-foreground fw-body">
              {shippingEstimate ? (
                <span className="text-brand-600">₹{shippingCharge}</span>
              ) : (
                <span>₹{shippingCharge}</span>
              )}
            </span>
          </div>

          {shippingEstimate?.courierName && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Courier</span>
              <span className="fw-body text-foreground">
                {shippingEstimate.courierName}
              </span>
            </div>
          )}

          {shippingEstimate?.etd && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Est. Delivery</span>
              <span className="fw-body text-brand-600">{shippingEstimate.etd}</span>
            </div>
          )}

          {orderData.giftWrap && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Gift Wrap</span>
              <span>₹50</span>
            </div>
          )}

          {couponDiscount > 0 && (
            <p className="mt-1 text-xs text-[var(--brand-accent-600)]">
              Coupon applied: -₹{Math.round(couponDiscount)}
            </p>
          )}

          <div className="border-t border-border pt-3 mt-2">
            <div className="flex justify-between fw-heading text-foreground">
              <span>Total</span>
              <span className="text-lg">₹{total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
          </div>

          {/* Payment Info Cards */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 bg-[var(--brand-accent-50)] border border-[var(--brand-accent-200)] rounded-lg px-3 py-2">
              <span className="text-[var(--brand-accent-600)] text-lg">✓</span>
              <span className="text-sm fw-body text-[var(--brand-accent-700)]">
                5% Discount on ONLINE Purchase
              </span>
            </div>
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
              <span className="text-brand-600 text-lg">✓</span>
              <span className="text-sm text-brand-700">
                10% Advance And Rest In COD
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <div>SomeThing went wrong </div>;
}
