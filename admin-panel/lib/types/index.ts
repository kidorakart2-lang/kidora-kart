export interface OrderItem {
  productId: string;
  name: string;
  images: string[];
  quantity: number;
  priceAtPurchase: number;
  isPersonalized: boolean;
  personalizedName?: string;
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
    discount?: number;
    tax?: number;
  };
  payment?: {
    status?: string;
    method?: string;
    transactionId?: string;
  };
  isGift?: boolean;
  giftMessage?: string;
  date?: string;
  orderDate?: string;
}

export interface Product {
  _id?: string;
  name: string;
  status: string;
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
  _id?: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: string;
}

export interface ColorItem {
  _id?: string;
  name: string;
  status: string;
  code?: string;
  createdAt?: string;
}

export interface Testimonial {
  _id?: string;
  title: string;
  description: string;
  rating: number;
  image?: string;
  status: string;
  address?: string;
  createdAt?: string;
}

export interface WhyChooseUsItem {
  _id?: string;
  icon: string;
  image?: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string;
}

export interface Logo {
  _id?: string;
  name?: string;
  image?: string;
  status: string;
  createdAt?: string;
}

export interface Banner {
  _id?: string;
  name: string;
  link?: string;
  image?: string;
  status: string;
  createdAt?: string;
}

export interface FAQ {
  _id?: string;
  question: string;
  answer: string;
  status: string;
  createdAt?: string;
}

export interface Review {
  _id?: string;
  productId: { _id: string; name: string };
  userId: { _id: string; name: string };
  rating: number;
  comment: string;
  status: string;
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
