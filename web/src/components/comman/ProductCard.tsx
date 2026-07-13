"use client";
import {
  Heart,
  ShoppingCart,
  Eye,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/getAuthToken";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/features/cart";
import { useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";

/**
 * Matches the populated "colors" collection shape (see colorSchema):
 * `code` is a free-form CSS color value — usually a hex string like
 * "#FF5733", occasionally a plain color name — so it's used as-is.
 */
type ColorOption = {
  _id: string;
  name?: string;
  code: string;
};

const getSwatchColor = (color: ColorOption) => color.code || "#D4D4D8";

export default function ProductCard({ data }: { data: ProductData }) {
  const cartItem = useSelector((state: RootState) =>
    (state.cart?.cartItems ?? []).find((item) => item.productId === data?._id),
  );

  const colorOptions = (data?.colors ?? []) as unknown as ColorOption[];

  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(
    colorOptions?.[0]?._id,
  );

  const isWishlisted = useSelector((state: RootState) =>
    (state.wishlist?.wishlistItems ?? []).find(
      (item) => item._id === data?._id,
    ),
  );

  const dispatch = useDispatch();

  const cartObj = {
    productId: data?._id,
    slug: data?.slug,
    quantity:
      cartItem && typeof cartItem.quantity === "number" ? cartItem.quantity : 1,
    colorId: selectedColorId ?? data?.colors?.[0]?._id,
    sizeId: data?.sizes?.[0]?._id || null,
  };

  const displayPrice = data?.price;
  const displayCurrentPrice = data?.discount_price;
  const discountPercentage =
    displayPrice && displayCurrentPrice
      ? Math.round(((displayPrice - displayCurrentPrice) / displayPrice) * 100)
      : 0;
  const savings =
    displayPrice && displayCurrentPrice
      ? displayPrice - displayCurrentPrice
      : 0;

  const hasSecondaryImage = Boolean(data?.images && data.images.length > 0);

  // Both images are already mounted in the DOM (crossfade below) so the
  // browser fetches the secondary image as soon as the card is in view —
  // this warms the cache before hover, avoiding a flash-of-blank on swap.
  useEffect(() => {
    if (!hasSecondaryImage || typeof window === "undefined") return;
    const preload = new window.Image();
    preload.src = data.images![0];
  }, [hasSecondaryImage, data?.images]);

  const handleImageHover = (hovered: boolean) => {
    setIsHovered(hovered);
  };

  const handleWishlistToggle = async () => {
    const isLoggedIn = !!getAuthToken();

    setWishlistLoading(true);

    if (isWishlisted) {
      // Remove from wishlist
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
              body: JSON.stringify({
                productId: data?._id,
              }),
            },
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              removeFromWishlist({
                _id: data?._id,
              }),
            );
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Something went wrong",
          );
        } finally {
          setWishlistLoading(false);
        }
      } else {
        // Guest user - remove from local state
        dispatch(
          removeFromWishlist({
            _id: data?._id,
            isGuest: true,
          }),
        );
        toast.success("Removed from wishlist");
        setWishlistLoading(false);
      }
    } else {
      // Add to wishlist
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
              body: JSON.stringify({
                productId: data?._id,
              }),
            },
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              addToWishlist({
                _id: data?._id,
                slug: data?.slug,
              }),
            );
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Something went wrong",
          );
        } finally {
          setWishlistLoading(false);
        }
      } else {
        // Guest user - add to local state
        dispatch(
          addToWishlist({
            _id: data?._id,
            slug: data?.slug,
            isGuest: true,
          }),
        );
        toast.success("Added to wishlist");
        setWishlistLoading(false);
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || data.stock === 0) return;

    const isLoggedIn = !!getAuthToken();

    setLoading(true);

    if (isLoggedIn) {
      // Logged in user - call API
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
          },
        );
        const responseData = await response.json();
        if (response.ok || responseData._status) {
          dispatch(addToCart(cartObj));
          toast.success(responseData._message);
        } else {
          toast.error(responseData._message);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user - add to local state only
      dispatch(addToCart({ ...cartObj, isGuest: true }));
      toast.success("Added to cart");
      setLoading(false);
    }
  };

  return (
    <article
      className="group relative bg-background rounded-2xl overflow-hidden border border-border
                 shadow-[0_1px_2px_rgba(16,24,40,0.04)]
                 hover:shadow-[0_12px_24px_-8px_rgba(16,24,40,0.12),0_4px_8px_-4px_rgba(16,24,40,0.08)]
                 hover:-translate-y-1 transition-[transform,box-shadow] duration-300 ease-out will-change-transform"
      itemScope
      itemType="https://schema.org/Product"
      role="article"
      aria-label={`Product: ${data.name}`}
    >
      {/* Schema.org structured data */}
      <meta itemProp="productID" content={data._id} />
      <meta itemProp="url" content={`/product-details/${data.slug}`} />
      {data.subCategory && data.subCategory.length > 0 && (
        <meta
          itemProp="category"
          content={data.subCategory.map((cat) => cat.name).join(", ")}
        />
      )}

      {/* Offers schema */}
      <div
        itemProp="offers"
        itemScope
        itemType="https://schema.org/Offer"
        style={{ display: "none" }}
      >
        <meta itemProp="price" content={String(displayCurrentPrice ?? "")} />
        <meta itemProp="priceCurrency" content="INR" />
        <meta itemProp="availability" content="https://schema.org/InStock" />
        <meta itemProp="url" content={`/product-details/${data.slug}`} />
      </div>

      {/* 1. Product Image */}
      <Link
        href={`/product-details/${data.slug}`}
        aria-label={`View details for ${data.name}`}
        title={data.name}
        prefetch={false}
      >
        <div
          className="relative aspect-[4/5] bg-gradient-to-br from-brand-50 to-muted overflow-hidden"
          onMouseEnter={() => handleImageHover(true)}
          onMouseLeave={() => handleImageHover(false)}
        >
          {/* Discount badge */}
          {discountPercentage > 0 && (
            <div
              className="absolute top-3 left-3 z-20 bg-destructive text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1 animate-in fade-in slide-in-from-left duration-300"
              role="status"
              aria-label={`${discountPercentage} percent discount`}
            >
              <Sparkles className="w-3 h-3" />
              {discountPercentage}% OFF
            </div>
          )}

          {/* Main image */}
          <div
            className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${
              isHovered && hasSecondaryImage ? "opacity-0" : "opacity-100"
            } ${isHovered ? "scale-[1.04]" : "scale-100"}`}
          >
            <Image
              fill
              src={data?.image ?? ""}
              alt={`${data.name} - Product image`}
              className="object-cover cursor-pointer"
              itemProp="image"
              title={data.name}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Secondary image — crossfades in on hover */}
          {hasSecondaryImage && (
            <div
              className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${
                isHovered ? "opacity-100 scale-[1.04]" : "opacity-0 scale-100"
              }`}
            >
              <Image
                fill
                src={data.images![0]}
                alt={`${data.name} - Product image hover`}
                className="object-cover cursor-pointer"
                itemProp="image"
                title={data.name}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Quick View overlay */}
          <div
            className={`absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            <div
              className={`bg-background/95 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg transition-transform duration-300 ${
                isHovered ? "translate-y-0" : "translate-y-2"
              }`}
            >
              <Eye className="w-4 h-4 text-brand-700" />
              <span className="text-xs font-semibold text-foreground">
                Quick View
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* 2. Wishlist button — floats over the image, top-right */}
      <button
        disabled={wishlistLoading}
        aria-label={
          isWishlisted
            ? `Remove ${data.name} from wishlist`
            : `Add ${data.name} to wishlist`
        }
        aria-pressed={!!isWishlisted}
        className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border
                 hover:bg-background flex items-center justify-center
                 transition-all duration-200 shadow-md hover:shadow-lg
                 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
                 ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleWishlistToggle}
        type="button"
      >
        <Heart
          size={17}
          fill={isWishlisted ? "currentColor" : "none"}
          className={`transition-colors ${
            isWishlisted ? "text-brand-accent-500" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Details */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* 3 & 4. Name + category */}
        <div className="space-y-1">
          <Link href={`/product-details/${data.slug}`} prefetch={false}>
            <h3
              className="text-[15px] sm:text-base font-semibold text-foreground line-clamp-2
                       group-hover:text-brand-700 transition-colors cursor-pointer leading-snug"
              itemProp="name"
            >
              {data.name}
            </h3>
          </Link>
          {data.category && (
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              <span itemProp="category">
                {(Array.isArray(data.category)
                  ? data.category
                  : [data.category]
                )
                  .map((cat) => cat.name)
                  .join(", ")}
              </span>
            </p>
          )}
        </div>

        {/* 5. Rating */}
        {(data.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
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
                ({data.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* 6. Price */}
        <div
          role="group"
          aria-label="Product pricing"
          className="flex items-baseline gap-2 flex-wrap"
        >
          {displayCurrentPrice && (
            <span
              className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
              itemProp="price"
              aria-label={`Current price: ${displayCurrentPrice} rupees`}
            >
              ₹{displayCurrentPrice}
            </span>
          )}
          {displayPrice && displayPrice !== displayCurrentPrice && (
            <span
              className="text-sm text-muted-foreground line-through"
              aria-label={`Original price: ${displayPrice} rupees`}
            >
              ₹{displayPrice}
            </span>
          )}
          {savings > 0 && (
            <span
              className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded"
              aria-label={`You save: ${savings} rupees`}
            >
              Save ₹{savings}
            </span>
          )}
        </div>

        {/* 7. Color variants */}
        {colorOptions.length > 0 && (
          <div
            className="flex items-center gap-2 flex-wrap"
            role="group"
            aria-label="Available colors"
          >
            {colorOptions.slice(0, 6).map((color) => {
              const isSelected = selectedColorId === color._id;
              return (
                <button
                  key={color._id}
                  type="button"
                  aria-label={
                    color.name ? `Select color ${color.name}` : "Select color"
                  }
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColorId(color._id);
                  }}
                  className={`relative w-6 h-6 rounded-full transition-all duration-200 ease-out
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
                            ${isSelected ? "scale-110 shadow-md" : "hover:scale-105"}`}
                  style={{
                    backgroundColor: getSwatchColor(color),
                    boxShadow: isSelected
                      ? "0 0 0 2px var(--background), 0 0 0 3.5px var(--brand-primary)"
                      : "0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                  title={color.name}
                />
              );
            })}
            {colorOptions.length > 6 && (
              <span className="text-[11px] text-muted-foreground">
                +{colorOptions.length - 6}
              </span>
            )}
          </div>
        )}

        {/* 8. Add to Cart */}
        <Button
          disabled={loading || data.stock === 0}
          variant="gradient"
          className="w-full h-11 rounded-xl text-sm font-semibold
                   flex items-center justify-center gap-2
                   shadow-sm hover:shadow-md active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
                   transition-all duration-200"
          onClick={handleAddToCart}
          aria-label={`Add ${data.name} to cart`}
          type="button"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <ShoppingCart size={16} aria-hidden="true" />
          )}
          <span>
            {loading
              ? "Adding..."
              : data.stock === 0
                ? "Out of Stock"
                : "Add to Cart"}
          </span>
        </Button>
      </div>
    </article>
  );
}
