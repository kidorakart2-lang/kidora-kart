"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

import {
  Tag,
  Hash,
  Box,
  Clock,
  CheckCircle,
  Star,
  Calendar,
} from "lucide-react";
import ProductReviews from "./product-reviews";

export interface ProductData {
  _id: string;
  name: string;
  image: string;
  images: string[];
  slug: string;
  description: string;
  weight?: string;
  length?: number;
  height?: number;
  breadth?: number;
  minimumAge?: number;
  idealAge?: number;
  maximumAge?: number;
  type?: string;
  sku?: string;
  tags?: string[];
  videoUrl?: string;
  code: string;
  price: number;
  discount_price?: number;
  stock: number;
  dimensions?: string;
  estimated_delivery_time?: string;
  status: "active" | "inactive" | "draft";
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isPersonalized: boolean;
  isGift: boolean;
  isUpsell: boolean;
  isOnSale: boolean;
  isTopRated: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
  colors?: Array<{ _id: string; name: string; code: string }>;
  material?: Array<{ _id: string; name: string }>;
  category?: Array<{ _id: string; name: string }>;
  subCategory?: Array<{ _id: string; name: string }>;
  subSubCategory?: Array<{ _id: string; name: string }>;
  sizes?: Array<{ _id: string; name: string }>;
}

export default function ProductDetails({ product }: { product: ProductData }) {
  const [mainImage, setMainImage] = useState(product.image);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);


  const handleThumbnailClick = (img: string) => {
    setMainImage(img);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.isNewArrival && (
              <Badge className="absolute top-2 left-2 bg-green-600">
                New Arrival
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge className="absolute top-2 right-2 bg-amber-500">
                Bestseller
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[product.image, ...(product.images ?? [])]
              .slice(0, 4)
              .map((img, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(img)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                    mainImage === img ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
          </div>

          <div className="mt-5">
            {product.category && (
              <div>
                <h3 className="text-sm font-medium text-foreground">Category</h3>
                {product.category.length > 0 &&
                  product.category.map((category) => (
                    <p className="mt-1 text-sm text-muted-foreground flex items-center">
                      <Tag className="w-4 h-4 mr-2" /> {category.name}
                    </p>
                  ))}
                {product.category.length === 0 && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> No Category
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="">
            {product.subCategory && (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-foreground">
                  Sub Category
                </h3>
                {product.subCategory.length > 0 &&
                  product.subCategory.map((subCategory) => (
                    <p className="mt-1 text-sm text-muted-foreground flex items-center">
                      <Tag className="w-4 h-4 mr-2" /> {subCategory.name}
                    </p>
                  ))}
                {product.subCategory.length === 0 && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> No Sub Category
                  </p>
                )}
              </div>
            )}
            {product.subSubCategory && (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-foreground">
                  Sub Sub Category
                </h3>
                {product.subSubCategory.length > 0 &&
                  product.subSubCategory.map((subSubCategory) => (
                    <p className="mt-1 text-sm text-muted-foreground flex items-center">
                      <Tag className="w-4 h-4 mr-2" /> {subSubCategory.name}
                    </p>
                  ))}
                {product.subSubCategory.length === 0 && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> No Sub Sub Category
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center mt-2 space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 text-amber-400 fill-current"
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">(24 reviews)</span>
              </div>
              <span className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> In Stock (
                {product.stock} available)
              </span>
            </div>
          </div>
          {
            product.slug && (
              <div>
                <h3 className="text-sm font-medium text-foreground">Slug</h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Tag className="w-4 h-4 mr-2" /> {product.slug}
                </p>
              </div>
            )
          }

          <div className="space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(product.discount_price || product.price)}
              </span>
              {product.discount_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge className="bg-red-100 text-red-800">
                    {Math.round(
                      (1 - product.discount_price / product.price) * 100
                    )}
                    % OFF
                  </Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Description</h3>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground">Colors</h3>
                <div className="flex space-x-2 mt-2">
                  {product.colors.map((color) => (
                    <button
                      key={color._id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor?._id === color._id
                          ? "border-primary"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color.code }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Product Code
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Hash className="w-4 h-4 mr-2" /> {product.code}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Dimensions
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Box className="w-4 h-4 mr-2" /> {product.dimensions}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Delivery Time
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-2" />{" "}
                  {product.estimated_delivery_time}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Material</h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Tag className="w-4 h-4 mr-2" />{" "}
                  {product.material?.map((material) => material.name).join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Weight</h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Tag className="w-4 h-4 mr-2" /> {product.weight ? `${product.weight}g` : "N/A"}
                </p>
              </div>
              {product.dimensions && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Dimensions</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Box className="w-4 h-4 mr-2" /> {product.dimensions}
                  </p>
                </div>
              )}
              {!product.dimensions && (product.length || product.height || product.breadth) && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Dimensions</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Box className="w-4 h-4 mr-2" /> {[product.length, product.breadth, product.height].filter(Boolean).join(" × ")} cm
                  </p>
                </div>
              )}
              {product.sku && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">SKU</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Hash className="w-4 h-4 mr-2" /> {product.sku}
                  </p>
                </div>
              )}
              {product.type && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Type</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> {product.type}
                  </p>
                </div>
              )}
              {product.videoUrl && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-foreground">Video URL</h3>
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-primary hover:text-primary/80 underline flex items-center break-all"
                  >
                    <Tag className="w-4 h-4 mr-2 flex-shrink-0" /> {product.videoUrl}
                  </a>
                </div>
              )}
              {(product.minimumAge != null || product.maximumAge != null) && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Age Range</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> {product.minimumAge != null ? `${product.minimumAge}` : "0"}{" "}-
                    {" "}{product.maximumAge != null ? `${product.maximumAge}` : "18"} Years
                  </p>
                </div>
              )}
              {product.idealAge != null && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">Ideal Age</h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> {product.idealAge} Years
                  </p>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-foreground">Tags</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 border border-brand-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* is trending */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isTrending
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is Trending
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isTrending ? "Yes" : "No"}
                </p>
              </div>
              {/* is featured */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isFeatured
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is Featured
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isFeatured ? "Yes" : "No"}
                </p>
              </div>
              {/* is personalized */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isPersonalized
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is Personalized
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isPersonalized ? "Yes" : "No"}
                </p>
              </div>
              {/* is gift */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isGift
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">Is Gift</h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isGift ? "Yes" : "No"}
                </p>
              </div>
              {/* is upsell */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isUpsell
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">Is Upsell</h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isUpsell ? "Yes" : "No"}
                </p>
              </div>
              {/* is on sale */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isOnSale
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is On Sale
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isOnSale ? "Yes" : "No"}
                </p>
              </div>
              {/* is top rated */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isTopRated
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is Top Rated
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isTopRated ? "Yes" : "No"}
                </p>
              </div>
              {/* is new arrival */}
              <div
                className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                  product.isNewArrival
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-foreground">
                  Is New Arrival
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {product.isNewArrival ? "Yes" : "No"}
                </p>
              </div>
            </div>
            {/* status */}
            <div
              className={`mt-4 flex items-center justify-center rounded-2xl w-fit px-2 space-x-2 ${
                product.status === "active"
                  ? "text-green-600 bg-green-100"
                  : product.status === "draft"
                  ? "text-amber-600 bg-amber-100"
                  : "text-red-600 bg-red-100"
              }`}
            >
              <h3 className="text-sm font-medium ">Status :</h3>
              <p className=" text-sm px-2 py-1 rounded flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />{" "}
                {product.status === "active"
                  ? "Active"
                  : product.status === "draft"
                  ? "Draft"
                  : "Inactive"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* createdAt            */}
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Created At
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />{" "}
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
              {/* updatedAt            */}
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Last Updated At
                </h3>
                <p className="mt-1 text-sm text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />{" "}
                  {new Date(product.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product._id} />
    </div>
  );
}
