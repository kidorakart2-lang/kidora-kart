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
  image?: string;
  images?: string[];
  price?: number;
  discount_price?: number;
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

export interface SizeItem {
  _id: string;
  name: string;
  order: number;
  status: boolean;
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
