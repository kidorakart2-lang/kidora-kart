export interface ColorItem {
  _id: string;
  name: string;
  code: string;
}

export interface MaterialItem {
  _id: string;
  name: string;
}

export interface ProductData {
  _id: string;
  name: string;
  price: number;
  discount_price?: number;
  createdAt?: string;
  image?: string;
  slug: string;
  images?: string[];
  stock?: number;
  description?: string;
  category?: string;
  material?: string;
  subCategory?: { _id: string; name: string }[];
  colors?: { _id: string; name: string; code?: string }[];
  sizes?: { _id: string; name: string }[];
}

export interface SubCategoryData {
  _id?: string;
  slug: string;
  name: string;
  image?: string;
}

export interface CategoryData {
  _id?: string;
  slug: string;
  name?: string;
  image?: string;
  subCategories?: SubCategoryData[];
}

export interface WishlistProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  discount_price?: number;
  slug: string;
  originalPrice?: number;
  stock: number;
  isGuest?: boolean;
}

export interface CouponData {
  discountPercentage: number;
  minAmount: number;
  maxAmount: number;
}

export interface DirectPurchaseItem {
  productId: string;
  colorId: string;
  quantity: number;
  isPersonalized: boolean;
  personalizedName: string | null;
  product: ProductData;
  colorCode: string;
  colorName: string;
  sizeName: string;
  sizeId: string;
}

export interface OrderSummaryCartItem {
  _id?: string;
  product: ProductData;
  quantity: number;
  color?: { _id: string; code: string; name: string };
  colorCode?: string;
  colorName?: string;
  size?: { _id: string; name: string };
  sizeName?: string;
  sizeId?: string;
  isPersonalized?: boolean;
}

export interface NavigationData extends CategoryData {
  subCategories?: SubCategoryData[];
}
