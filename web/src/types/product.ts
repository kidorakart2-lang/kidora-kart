export interface ColorItem {
  _id: string;
  name: string;
  code: string;
}

export interface MaterialItem {
  _id: string;
  name: string;
}

export interface SizeItem {
  _id: string;
  name: string;
  value?: string;
}

export interface CategoryRef {
  _id: string;
  name: string;
  slug?: string;
}

export interface MaterialRef {
  _id: string;
  name: string;
}

export interface ProductVariant {
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  mrp?: number | null;
}

export interface ProductData {
  _id: string;
  name: string;
  price: number;
  discount_price?: number;
  variants?: ProductVariant[];
  createdAt?: string;
  image?: string;
  slug: string;
  images?: string[];
  stock?: number;
  description?: string;
  shortDescription?: string;
  short_description?: string;
  category?: CategoryRef[];
  material?: MaterialRef[];
  isPersonalized?: boolean;
  subCategory?: { _id: string; name: string; slug?: string }[];
  subSubCategory?: CategoryRef[];
  colors?: { _id: string; name: string; code?: string }[];

  rating?: number;
  reviewCount?: number;
  weight?: string;
  length?: number;
  height?: number;
  breadth?: number;
  purity?: string;
  sizes?: SizeItem[];
  type?: string;
  sku?: string;
  tags?: string[];
  videoUrl?: string;
  isNewArrival?: boolean;
  estimated_delivery_time?: string;
  giftImages?: string[];
}

export interface SubSubCategoryData {
  _id?: string;
  name?: string;
  slug?: string;
}

export interface SubCategoryData {
  _id?: string;
  slug: string;
  name: string;
  image?: string;
  subSubCategories?: SubSubCategoryData[];
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
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
  sizeId?: string | null;
  sizeName?: string | null;
}

export interface OrderSummaryCartItem {
  _id?: string;
  product: ProductData;
  quantity: number;
  color?: { _id: string; code: string; name: string };
  colorCode?: string;
  colorName?: string;

  isPersonalized?: boolean;
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
  size?: { _id: string; name: string };
  sizeId?: string | null;
  sizeName?: string | null;
}

export interface NavigationData extends CategoryData {
  subCategories?: SubCategoryData[];
}

export type LogoData = {
  logo: string;
};

export interface BannerItem {
  _id?: string;
  image: string;
  link?: { url?: string | null; type?: string };
}

export interface BannerLinkData {
  type?: string;
  target?: string;
  externalUrl?: string;
  label?: string;
}

