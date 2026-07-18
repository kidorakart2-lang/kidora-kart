"use client";
import { Heart, ShoppingCart, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/getAuthToken";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/features/cart";
import { useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";

interface VerticalProductCardProps {
  data: ProductData;
}

export default function VerticalProductCard({ data }: VerticalProductCardProps) {
  const cartItem = useSelector((state: RootState) =>
    (state.cart?.cartItems ?? []).find((item) => item.productId === data?._id)
  );

  const [quantity, setQuantity] = useState(
    cartItem && typeof cartItem.quantity === "number" ? cartItem.quantity : 1
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    data?.colors?.[0]?._id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted = useSelector((state: RootState) =>
    (state.wishlist?.wishlistItems ?? []).find((item) => item._id === data?._id)
  );

  const dispatch = useDispatch();

  const displayPrice = data?.price;
  const displayCurrentPrice = data?.discount_price;

  const cartObj = {
    productId: data?._id,
    slug: data?.slug,
    quantity,
    colorId: selectedColor,
  };

  const handleWishlistToggle = async () => {
    const isLoggedIn = !!getAuthToken();
    setWishlistLoading(true);

    if (isWishlisted) {
      if (isLoggedIn) {
        try {
          const response = await fetch(
            process.env.NEXT_PUBLIC_API_URL +
              "api/website/wishlist/remove/" +
              data?._id,
            {
              method: "PUT",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({ productId: data?._id }),
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(removeFromWishlist({ _id: data?._id }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(removeFromWishlist({ _id: data?._id, isGuest: true }));
        toast.success("Removed from wishlist");
        setWishlistLoading(false);
      }
    } else {
      if (isLoggedIn) {
        try {
          const response = await fetch(
            process.env.NEXT_PUBLIC_API_URL + "api/website/wishlist/add",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({ productId: data?._id }),
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(addToWishlist({ _id: data?._id, slug: data?.slug }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(addToWishlist({ _id: data?._id, slug: data?.slug, isGuest: true }));
        toast.success("Added to wishlist");
        setWishlistLoading(false);
      }
    }
  };

  const handleAddToCart = async () => {
    const isLoggedIn = !!getAuthToken();
    setLoading(true);

    if (isLoggedIn) {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "api/website/cart/add",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(cartObj),
          }
        );
        const responseData = await response.json();
        if (response.ok || responseData._status) {
          dispatch(addToCart(cartObj));
          toast.success(responseData._message);
        } else {
          toast.error(responseData._message);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    } else {
      dispatch(addToCart({ ...cartObj, isGuest: true }));
      toast.success("Added to cart");
      setLoading(false);
    }
  };

  return (
    <article
      className="group flex flex-col sm:flex-row gap-5 p-4 bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300"
      itemScope
      itemType="https://schema.org/Product"
      role="article"
      aria-label={`Product: ${data.name}`}
    >
      {/* Schema.org structured data */}
      <meta itemProp="productID" content={data._id} />
      <meta itemProp="url" content={`/product-details/${data.slug}`} />

      <div
        itemProp="offers"
        itemScope
        itemType="https://schema.org/Offer"
        style={{ display: "none" }}
      >
        <meta itemProp="price" content={String(displayCurrentPrice ?? "")} />
        <meta itemProp="priceCurrency" content="INR" />
        <meta itemProp="availability" content="https://schema.org/InStock" />
      </div>

      {/* Image */}
      <Link
        href={`/product-details/${data.slug}`}
        aria-label={`View details for ${data.name}`}
        title={data.name}
        prefetch={false}
        className="shrink-0"
      >
        <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-40 md:h-48 bg-muted rounded-xl overflow-hidden">
          {data?.image ? (
            <Image
              width={400}
              height={400}
              src={data.image}
              alt={`${data.name} - Product image`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              itemProp="image"
              title={data.name}
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart size={32} />
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Tags — above title */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {data.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{data.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <Link href={`/product-details/${data.slug}`} prefetch={false}>
            <h3
              className="text-lg fw-heading text-foreground truncate group-hover:text-brand-700 transition-colors cursor-pointer"
              itemProp="name"
            >
              {data.name}
            </h3>
          </Link>

          {/* Price + Rating row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Price */}
            <div className="flex items-baseline gap-2" role="group" aria-label="Product pricing">
              {displayCurrentPrice && (
                <span className="text-2xl fw-heading text-foreground" itemProp="price">
                  ₹{displayCurrentPrice}
                </span>
              )}
              {displayPrice && displayPrice !== displayCurrentPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{displayPrice}
                </span>
              )}
            </div>

            {/* Rating */}
            {(data.rating ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.round(data.rating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      }
                    />
                  ))}
                </div>
                {(data.reviewCount ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({data.reviewCount} Reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Color + Qty row */}
        <div className="flex flex-wrap items-center gap-6 mt-4">
          {/* Color swatches */}
          {data.colors && data.colors.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm fw-body text-foreground">Color</span>
              <div className="flex items-center gap-2">
                {data.colors.map((color) => (
                  <button
                    key={color._id}
                    type="button"
                    aria-label={`Select color: ${color.name}`}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color._id
                        ? "border-foreground scale-110"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                    style={{ backgroundColor: color.code || "#ccc" }}
                    onClick={() => setSelectedColor(color._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm fw-body text-foreground">Qty:</span>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm fw-heading text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-4">
          {/* Wishlist */}
          <button
            type="button"
            disabled={wishlistLoading}
            aria-label={
              isWishlisted
                ? `Remove ${data.name} from wishlist`
                : `Add ${data.name} to wishlist`
            }
            aria-pressed={!!isWishlisted}
            className={`w-11 h-11 shrink-0 rounded-xl border border-border flex items-center justify-center
                        hover:bg-muted transition-all duration-200
                        ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleWishlistToggle}
          >
            <Heart
              size={18}
              fill={isWishlisted ? "currentColor" : "none"}
              className={`transition-colors ${
                isWishlisted ? "text-brand-accent-500" : "text-muted-foreground"
              }`}
            />
          </button>

          {/* Add to cart */}
          <Button
            disabled={loading || data.stock === 0}
            variant="gradient"
            className="flex-1 h-11 fw-cta rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-300"
            onClick={handleAddToCart}
            aria-label={`Add ${data.name} to cart`}
            type="button"
          >
            <ShoppingCart size={16} />
            <span>
              {loading
                ? "Adding..."
                : data.stock === 0
                ? "Out of Stock"
                : "Add to cart"}
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}
