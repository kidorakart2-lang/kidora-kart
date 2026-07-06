"use client";
import { Heart, ShoppingCart, Eye, Sparkles } from "lucide-react";
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

export default function ProductCard({ data }: { data: ProductData }) {
  const cartItem = useSelector((state: RootState) =>
    (state.cart?.cartItems ?? []).find((item) => item.productId === data?._id)
  );

  const cartObj = {
    productId: data?._id,
    slug: data?.slug,
    quantity:
      cartItem && typeof cartItem.quantity === "number" ? cartItem.quantity : 1,
    colorId: data?.colors?.[0]?._id,
    sizeId: data?.sizes?.[0]?._id || null,
  };

  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = useSelector((state: RootState) =>
    (state.wishlist?.wishlistItems ?? []).find((item) => item._id === data?._id)
  );

  const dispatch = useDispatch();

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
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              removeFromWishlist({
                _id: data?._id,
              })
            );
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
        // Guest user - remove from local state
        dispatch(
          removeFromWishlist({
            _id: data?._id,
            isGuest: true,
          })
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
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              addToWishlist({
                _id: data?._id,
                slug: data?.slug,
              })
            );
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
        // Guest user - add to local state
        dispatch(
          addToWishlist({
            _id: data?._id,
            slug: data?.slug,
            isGuest: true,
          })
        );
        toast.success("Added to wishlist");
        setWishlistLoading(false);
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      // Guest user - add to local state only
      dispatch(addToCart({ ...cartObj, isGuest: true }));
      toast.success("Added to cart");
      setLoading(false);
    }
  };

  return (
    <article
      className="group relative bg-background rounded-2xl overflow-hidden shadow-md hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 border border-border"
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

      {/* Top Actions Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div
            className="bg-gradient-to-br from-brand-accent-500 to-destructive text-background px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-in fade-in slide-in-from-left duration-300"
            role="status"
            aria-label={`${discountPercentage} percent discount`}
          >
            <Sparkles className="w-3 h-3" />
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          disabled={wishlistLoading}
          aria-label={
            isWishlisted
              ? `Remove ${data.name} from wishlist`
              : `Add ${data.name} to wishlist`
          }
           aria-pressed={!!isWishlisted}
          className={`w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border
                   hover:bg-background flex items-center justify-center
                   transition-all duration-300 shadow-lg hover:shadow-xl
                   hover:scale-110 active:scale-90
                   ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleWishlistToggle}
          type="button"
        >
          <Heart
            size={18}
            fill={isWishlisted ? "currentColor" : "none"}
            className={`transition-colors ${
              isWishlisted ? "text-brand-accent-500" : "text-muted-foreground"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Image Container */}
      <Link
        href={`/product-details/${data.slug}`}
        aria-label={`View details for ${data.name}`}
        title={data.name}
        prefetch={false}
      >
        <div
          className="relative h-64 sm:h-72 bg-gradient-to-br from-brand-50 to-muted overflow-hidden"
          onMouseEnter={() => handleImageHover(true)}
          onMouseLeave={() => handleImageHover(false)}
        >
          {/* Main image */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              isHovered && data?.images != null && data.images.length > 0 ? "opacity-0" : "opacity-100"
            }`}
          >
            <Image
              width={500}
              height={500}
              src={data?.image ?? ""}
              alt={`${data.name} - Product image`}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-700"
              itemProp="image"
              title={data.name}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          {/* Hover image */}
          {data?.images != null && data.images.length > 0 && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                width={500}
                height={500}
                src={data.images[0]}
                alt={`${data.name} - Product image hover`}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-700"
                itemProp="image"
                title={data.name}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Quick View Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            <div
              className={`bg-background rounded-full px-6 py-3 flex items-center gap-2 shadow-xl transition-all duration-300 ${
                isHovered ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
            >
              <Eye className="w-5 h-5 text-brand-700" />
              <span className="text-sm font-semibold text-foreground">
                Quick View
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-5">
        {/* Category */}
        {data.subCategory && data.subCategory.length > 0 && (
          <p className="text-[10px] uppercase tracking-wider text-brand-700 font-bold mb-2 flex items-center gap-1">
            <span className="w-1 h-1 bg-brand-700 rounded-full"></span>
            <span itemProp="category">
              {data.subCategory.map((cat) => cat.name).join(", ")}
            </span>
          </p>
        )}

        {/* Product Name */}
        <Link href={`/product-details/${data.slug}`} prefetch={false}>
          <h3
            className="text-base sm:text-lg font-semibold text-foreground mb-3 line-clamp-2
                     group-hover:text-brand-700 transition-colors cursor-pointer leading-tight"
            itemProp="name"
          >
            {data.name}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="mb-4" role="group" aria-label="Product pricing">
          <div className="flex items-baseline gap-2 mb-1">
            {displayCurrentPrice && (
              <span
                className="text-2xl font-bold text-foreground"
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
          </div>
          {savings > 0 && (
            <span
              className="inline-block text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md"
              aria-label={`You save: ${savings} rupees`}
            >
              Save ₹{savings}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div role="group" aria-label="Product actions">
          <Button
            disabled={loading || data.stock === 0}
            className="w-full bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900
                     text-background py-6 rounded-xl text-sm font-semibold uppercase tracking-wider
                     flex items-center justify-center gap-2 shadow-lg
                      transition-all duration-300
                     active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                     group-hover:shadow-2xl"
            onClick={handleAddToCart}
            aria-label={`Add ${data.name} to cart`}
            type="button"
          >
            <ShoppingCart size={16} aria-hidden="true" />
            <span>
              {loading
                ? "Adding..."
                : data.stock === 0
                ? "Out of Stock"
                : "Add to Cart"}
            </span>
          </Button>
        </div>
      </div>

    </article>
  );
}
