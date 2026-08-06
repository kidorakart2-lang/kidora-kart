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
  /** Exact line total stored at order time (avoids per-unit rounding drift). */
  subtotal?: number;
  colorId: { code: string; name: string };
  sizeId?: { _id?: string; name: string; value?: string } | string | null;

  isPersonalized: boolean;
  personalizedName?: string;
  variantName?: string;
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
  customer?: string;
}

export interface OrderData {
  _id?: string;
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
  shipping?: {
    carrier?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  packageId: string;
  notes?: OrderNotes;
}

export interface OrderTrackingResponse {
  order: OrderData;
}

/** Raw response shape from the API for an order list endpoint. */
export interface OrderListApiResponse {
  success?: boolean;
  orders?: OrderData[];
  totalPages?: number;
  currentPage?: number;
  totalOrders?: number;
  message?: string;
}

/** Raw response shape from the API for an order detail endpoint. */
export interface OrderDetailApiResponse {
  success?: boolean;
  order?: OrderData;
  message?: string;
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
