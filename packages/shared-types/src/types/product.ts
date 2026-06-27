/** Product model */
export interface Product {
  _id: string;
  name: string;
  slug: string;
  image: string;
  images: string[];
  colors: string[];
  material: string[];
  sizes?: string[];
  category: string[];
  subCategory: string[];
  subSubCategory?: string[];
  description: string;
  purity: string;
  code: string;
  price: number;
  discount_price: number;
  stock: number;
  estimated_delivery_time: string;
  status: boolean;
  isPersonalized?: boolean;
  isGift?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTopRated?: boolean;
  isUpsell?: boolean;
  isOnSale?: boolean;
  rating?: number | null;
  reviewCount?: number;
  order?: number;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Cart item (within a cart) */
export interface CartItem {
  product: string;
  quantity: number;
  color: string;
  size?: string | null;
}

/** Wishlist item */
export interface WishlistItem {
  product: string;
  color?: string;
}

/** Product filter query */
export interface ProductFilter {
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  materials?: string[];
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
  page?: number;
  limit?: number;
}
