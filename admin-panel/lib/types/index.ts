export interface OrderAddress {
  fullName?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface OrderPricing {
  subtotal?: number;
  discount?: { amount?: number };
  shipping?: number;
  total?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  images: string[];
  quantity: number;
  priceAtPurchase: number;
  subtotal?: number;
  isPersonalized: boolean;
  personalizedName?: string;
  colorId?: { name?: string; _id?: string };
  sizeId?: { name?: string; _id?: string } | string | null;
  variantName?: string;
}

export interface OrderData {
  _id?: number | string;
  orderId: string;
  status: string;
  createdAt: string;
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  items?: OrderItem[];
  pricing?: {
    total: number;
    subtotal?: number;
    shipping?: number;
    discount?: { amount?: number };
    tax?: number;
  };
  shipping?: {
    carrier?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  payment?: {
    status?: string;
    method?: string;
    transactionId?: string;
  };
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  statusHistory?: Array<{ id: string; status: string; timestamp: string }>;
  date?: string;
  orderDate?: string;
}

export interface ProductVariant {
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  mrp?: number | null;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  discount_price: number;
  variants?: ProductVariant[];
  weight: string;
  length?: number;
  height?: number;
  breadth?: number;
  purity?: string;
  sizes?: Array<{ _id: string; name: string } | string>;
  type?: string;
  sku?: string;
  tags?: string[];
  videoUrl?: string;
  code: string;
  description: string;
  shortDescription?: string;
  estimated_delivery_time: string;
  status: "active" | "inactive" | "draft";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isUpsell: boolean;
  isOnSale: boolean;
  isPersonalized: boolean;
  isGift: boolean;
  giftImages: string[];
  order: number;
  image: string;
  images: string[];
  category: Array<{ _id: string } | string>;
  subCategory: Array<{ _id: string } | string>;
  subSubCategory: Array<{ _id: string } | string>;
  colors: Array<{ _id: string } | string>;
  material: Array<{ _id: string } | string>;
  createdAt?: string;
  date?: string;
}

export interface Category {
  _id: string;
  name?: string;
  label?: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  categoryId?: { _id: string; name: string };
  status: string;
  createdAt?: string;
}

export interface SubSubCategory {
  _id: string;
  name: string;
  subCategoryId?: { _id: string; name: string };
  status: string;
  createdAt?: string;
}

export interface MaterialItem {
  _id: string;
  name: string;
  order: number;
  status: boolean;
  description?: string;
  slug?: string;
  createdAt?: string;
}

export interface ColorItem {
  _id: string;
  name: string;
  code: string;
  order: number;
  status: boolean;
  createdAt?: string;
}

export interface SizeItem {
  _id: string;
  name: string;
  value?: string;
  order: number;
  status: boolean;
  createdAt?: string;
}

export interface Testimonial {
  _id?: string;
  title: string;
  description: string;
  rating: number;
  image?: string;
  status: boolean;
  address?: string;
  createdAt?: string;
}

export interface WhyChooseUsItem {
  _id?: string;
  icon: string;
  image?: string;
  title: string;
  description: string;
  status: boolean;
  createdAt?: string;
}

export interface Logo {
  _id: string;
  logo: string;
  status: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Banner {
  _id: string;
  description: string;
  image: string;
  status: boolean;
  order?: number;
  link?: {
    type: string;
    target?: string;
    externalUrl?: string;
    url?: string;
    label?: string;
  } | null;
  createdAt?: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  order: number;
  status: boolean;
  createdAt?: string;
}


export interface ProductFAQSet {
  _id: string;
  products: { _id: string; name: string; slug: string }[] | string[];
  entries: { question: string; answer: string; order: number }[];
  status: boolean;
  createdAt?: string;
}

export interface LinkOption {
  _id: string;
  name: string;
  slug: string;
}

export interface Review {
  _id?: string;
  productId: { _id: string; name: string };
  userId: { _id: string; name: string; email?: string };
  rating: number;
  comment: string;
  status: boolean | string;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  createdAt?: string;
}

export interface PageItem {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  _data: T[];
  _pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type BooleanKeys = "isFeatured" | "isNewArrival" | "isBestSeller" | "isTopRated" | "isUpsell" | "isOnSale" | "isPersonalized" | "isGift";

export interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  weight: string;
  length: string;
  height: string;
  breadth: string;
  purity: string;
  sizes: string[];
  type: string;
  sku: string;
  tags: string[];
  videoUrl: string;
  code: string;
  price: string;
  discount_price: string;
  stock: string;
  estimated_delivery_time: string;
  status: "active" | "inactive" | "draft";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isUpsell: boolean;
  isOnSale: boolean;
  isPersonalized: boolean;
  isGift: boolean;
  order: number;
  variants: ProductVariant[];
  mainImage: File | null;
  additionalImages: (File | null)[];
  mainImagePreview: string;
  additionalImagePreviews: string[];
  giftImages: (File | null)[];
  giftImagePreviews: string[];
}

export interface OrderUser {
  name?: string;
  email?: string;
}

export interface OrderCancellation {
  refundStatus?: string;
  refundAmount?: number;
  refundId?: string;
  refundError?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

export interface RefundOrder {
  _id: string;
  orderId: string;
  userId?: OrderUser;
  status: string;
  payment?: { status?: string };
  pricing?: { total?: number };
  issue?: string;
  suggestedStatus?: string;
  cancellation?: OrderCancellation;
}

export interface CategorizedOrders {
  pending: RefundOrder[];
  initiated: RefundOrder[];
  completed: RefundOrder[];
  failed: RefundOrder[];
  mismatched: RefundOrder[];
}

export interface OrdersSummary {
  pending?: number;
  initiated?: number;
  completed?: number;
  failed?: number;
  mismatched?: number;
}

export interface AiHistoryItem {
  _id: string;
  prompt: string;
  response: string;
  messages?: unknown[];
  createdAt: string;
}

export interface MismatchedOrder {
  orderId: string;
  razorpay: {
    paymentId: string;
    amount: string;
    status: string;
    createdAt: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
}

export interface SyncResult {
  scanned: number;
  fixed: number;
  failed: number;
  skipped: number;
  errors: Array<{ orderId: string; error: string }>;
  details: Array<{
    orderId: string;
    status: "fixed" | "skipped" | "failed";
    note: string;
  }>;
}

export interface AuditEntry {
  _id: string;
  action: string;
  admin: { _id: string; email: string } | null;
  target: { _id: string; email: string } | null;
  details: string;
  ip: string;
  createdAt: string;
}

export interface AiResponseItem {
  _id: string;
  prompt: string;
  response: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: OrderData[];
  revenueData: { month: string; revenue: number }[];
  orderStatusData: { name: string; value: number }[];
  productCategoryData: { name: string; value: number }[];
}
