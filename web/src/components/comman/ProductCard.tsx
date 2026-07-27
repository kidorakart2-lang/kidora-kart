"use client";
import { Heart, ShoppingCart, Star, Loader2, Dot } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/cookies";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/features/cart";
import { useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";

export default function ProductCard({ data }: { data: ProductData }) {
  const cartItem = useSelector((state: RootState) =>
    (state.cart?.cartItems ?? []).find((item) => item.productId === data?._id),
  );

  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    colorId: data?.colors?.[0]?._id,
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
  const outOfStock = data.stock === 0;

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
      if (isLoggedIn) {
        try {
          const response = await fetch(
            "/api/website/wishlist/remove/" +
              data?._id,
            {
              method: "PUT",
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
      if (isLoggedIn) {
        try {
          const response = await fetch(
            "/api/website/wishlist/add",
            {
              method: "POST",
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
    if (loading || outOfStock) return;

    const isLoggedIn = !!getAuthToken();

    setLoading(true);

    if (isLoggedIn) {
      try {          const response = await fetch(
          "/api/website/cart/add",
          {
            method: "POST",
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
      dispatch(addToCart({ ...cartObj, isGuest: true }));
      toast.success("Added to cart");
      setLoading(false);
    }
  };

  return (
    <article
      className="group relative bg-background rounded-2xl overflow-hidden border border-border
                 shadow-[0_1px_2px_rgba(16,24,40,0.04)]
                 hover:shadow-[0_12px_24px_-8px_rgba(16,24,40,0.14),0_4px_8px_-4px_rgba(16,24,40,0.08)]
                 hover:-translate-y-1 hover:border-brand-200 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform"
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
          {/* Discount sticker — tilted like a price sticker on packaging */}
          {discountPercentage > 0 && (
            <div
              className="absolute top-3 left-3 z-20 -rotate-6 bg-brand-accent-500 text-white px-2.5 py-1 rounded-lg text-[11px] fw-cta shadow-md flex items-center gap-0.5 animate-in fade-in slide-in-from-left duration-300"
              role="status"
              aria-label={`${discountPercentage} percent discount`}
            >
              <Dot className="size-4 -ml-1 animate-ping" aria-hidden="true" />
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

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <span className="rounded-full border border-border bg-background/95 px-4 py-1.5 text-xs fw-cta uppercase tracking-wide text-muted-foreground shadow-sm">
                Out of Stock
              </span>
            </div>
          )}
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
      <div className="p-5 sm:p-6 flex flex-col gap-3">
        {/* 3 & 4. Name + price in a single row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <Link href={`/product-details/${data.slug}`} prefetch={false}>
              <h3
                className="text-base sm:text-lg fw-heading text-foreground line-clamp-2
                         group-hover:text-brand-700 transition-colors cursor-pointer leading-snug"
                itemProp="name"
              >
                {data.name}
              </h3>
            </Link>
            {data.subCategory && data.subCategory.length > 0 && (
              <span className="inline-block text-[10px] uppercase tracking-wide fw-body bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                {data.subCategory[0].name}
              </span>
            )}
            {data.shortDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {data.shortDescription}
              </p>
            )}
            {!data.shortDescription && data.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {/* 6. Price */}
          <div
            role="group"
            aria-label="Product pricing"
            className="flex flex-col items-end gap-1 shrink-0 text-right"
          >
            {displayCurrentPrice && (
              <span
                className="text-2xl sm:text-3xl fw-body text-foreground tracking-tight leading-none"
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
                className="text-[11px] text-brand-accent-600 fw-body bg-brand-accent-50 px-1.5 py-0.5 rounded-full"
                aria-label={`You save: ${savings} rupees`}
              >
                Save ₹{savings}
              </span>
            )}
          </div>
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

        {/* 7. Add to Cart */}
        <button
          disabled={loading || outOfStock}
          className="w-full h-11 rounded-xl text-sm fw-cta bg-brand-500 text-white
                   flex items-center justify-center gap-2
                   shadow-sm hover:bg-brand-600 hover:shadow-md active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-brand-500 disabled:active:scale-100
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
                   transition-all duration-300"
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
              : outOfStock
                ? "Out of Stock"
                : "Add to Cart"}
          </span>
        </button>
      </div>
    </article>
  );
}
