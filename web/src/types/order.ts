export interface StatusHistoryItem {
  status: string;
  timestamp: string;
}

export interface OrderItem {
  _id: string;
  productId: { slug: string };
  images: string[];
  name: string;
  quantity: number;
  priceAtPurchase: number;
  colorId: { code: string; name: string };
  sizeId?: { name: string };
  isPersonalized: boolean;
  personalizedName?: string;
}

export interface PaymentInfo {
  method: string;
  status: string;
  codAdvance: boolean;
}

export interface PricingInfo {
  subtotal: number;
  shipping: number;
  discount: { amount: number };
  advance: number;
  total: number;
}

export interface CancellationInfo {
  reason: string;
  cancelledBy: string;
  cancelledAt: string;
  refundStatus: string;
  refundAmount: number;
  refundedAt?: string;
  refundError?: string;
}

export interface OrderShippingAddress {
  fullName: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  instructions?: string;
}

export interface OrderNotes {
  internal?: string;
}

export interface OrderData {
  status: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
  items: OrderItem[];
  isGift: boolean;
  giftMessage?: string;
  payment: PaymentInfo;
  pricing: PricingInfo;
  cancellation?: CancellationInfo;
  shippingAddress: OrderShippingAddress;
  packageId: string;
  notes?: OrderNotes;
}

export interface OrderTrackingResponse {
  order: OrderData;
}

export interface CheckoutFormData {
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    instructions: string;
  };
  notes: string;
  isGift: boolean;
  giftMessage: string;
  giftWrap: boolean;
  couponCode: string;
  isPersonalizedName: string;
}
