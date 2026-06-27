import type { ShippingAddress } from "./address.js";

export type PurchaseType = "cart" | "direct";
export type PaymentMethod = "razorpay" | "cod" | "upi" | "card" | "netbanking" | "wallet";
export type PaymentStatus = "pending" | "processing" | "cod-advance" | "completed" | "failed" | "refunded" | "partially_refunded";
export type OrderStatus = "pending" | "payment_failed" | "confirmed" | "processing" | "shipped" | "cod-advance" | "delivered" | "cancelled" | "refunded" | "returned" | "exchange";

/** An item within an order */
export interface OrderItem {
  productId: string;
  colorId: string;
  sizeId?: string | null;
  name: string;
  description?: string;
  quantity: number;
  isPersonalized?: boolean;
  personalizedName?: string | null;
  priceAtPurchase: number;
  subtotal: number;
  addedFrom?: "cart" | "direct" | "wishlist";
  images?: string[];
  sku?: string;
}

/** Pricing details */
export interface OrderPricing {
  subtotal: number;
  advance?: number;
  discount?: { amount?: number };
  shipping?: number;
  total: number;
}

/** Payment details */
export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  razorpay?: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };
  verified?: boolean;
  codAdvance?: boolean;
  transactionId?: string;
  paidAt?: Date;
  codCharges?: number;
}

/** Shipping info */
export interface OrderShipping {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

/** Cancellation details */
export interface OrderCancellation {
  reason?: string;
  refundId?: string;
  cancelledBy?: "customer" | "admin" | "system";
  cancelledAt?: Date;
  refundStatus?: "pending" | "initiated" | "completed" | "failed";
  refundAmount?: number;
  refundedAt?: Date;
  refundError?: string;
}

/** Order model */
export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  purchaseType: PurchaseType;
  items: OrderItem[];
  pricing: OrderPricing;
  shippingAddress: ShippingAddress;
  billingAddress?: Partial<ShippingAddress>;
  payment: OrderPayment;
  status: OrderStatus;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
  }>;
  shipping?: OrderShipping;
  notes?: {
    customer?: string;
    internal?: string;
  };
  packageId?: string | null;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  giftWrapCharges?: number;
  cancellation?: OrderCancellation;
  createdAt?: Date;
  updatedAt?: Date;
}
