"use client";
import { Heart, ShoppingCart, Star, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/cookies";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/features/cart";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";

interface ProductCardProps {
  data: ProductData;
  /** "dark" renders the plum-on-black card used inside dark product bands. */
  tone?: "light" | "dark";
  /** Load the primary image immediately — used inside auto-playing rails. */
  eager?: boolean;
}

export default function ProductCard({
  data,
  tone = "light",
  eager = false,
}: ProductCardProps) {
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
  const sellingPrice = displayCurrentPrice ?? displayPrice;

  // Quantity-tier pack deal — show a "Best Value" badge when a pack's per-unit
  // price beats the base selling price (e.g. base ₹25, pack of 5 @ ₹100 → ₹20/unit).
  const baseUnitPrice = data.discount_price ?? data.price;
  const bestPack = (data.variants ?? [])
    .filter((v) => v.quantity > 1 && v.price > 0)
    .map((v) => ({ ...v, perUnit: Math.round(v.price / v.quantity) }))
    .filter((v) => baseUnitPrice > 0 && v.perUnit < baseUnitPrice)
    .sort((a, b) => a.perUnit - b.perUnit)[0];
  const packDealPerUnit = bestPack?.perUnit ?? null;

  useEffect(() => {
    if (!hasSecondaryImage || typeof window === "undefined") return;
    const preload = new window.Image();
    preload.src = data.images![0];
  }, [hasSecondaryImage, data?.images]);

  const handleWishlistToggle = async () => {
    const isLoggedIn = !!getAuthToken();
    setWishlistLoading(true);

    if (isWishlisted) {
      if (isLoggedIn) {
        try {
          const response = await fetch(
            "/api/website/wishlist/remove/" + data?._id,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({ productId: data?._id }),
            },
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(removeFromWishlist({ _id: data?._id }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          const serverErr = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          toast.error(
            serverErr?.response?.data?.message ||
              (err instanceof Error ? err.message : "Something went wrong"),
          );
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
          const response = await fetch("/api/website/wishlist/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ productId: data?._id }),
          });
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(addToWishlist({ _id: data?._id, slug: data?.slug }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (err) {
          const serverErr = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          toast.error(
            serverErr?.response?.data?.message ||
              (err instanceof Error ? err.message : "Something went wrong"),
          );
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(
          addToWishlist({ _id: data?._id, slug: data?.slug, isGuest: true }),
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
      try {
        const response = await fetch("/api/website/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(cartObj),
        });
        const responseData = await response.json();
        if (response.ok || responseData._status) {
          dispatch(addToCart(cartObj));
          toast.success(responseData._message);
        } else {
          toast.error(responseData._message);
        }
      } catch (err) {
        const serverErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        toast.error(
          serverErr?.response?.data?.message ||
            (err instanceof Error ? err.message : "Something went wrong"),
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

  const isDark = tone === "dark";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-2 transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 ${
        isDark
          ? "border-[var(--brand-gold)]/20 bg-[#2e1b29] shadow-[0_18px_40px_-30px_rgba(0,0,0,0.9)] hover:border-[var(--brand-gold)]/50"
          : "border-[var(--brand-gold)]/20 bg-white shadow-[0_10px_30px_-28px_rgba(62,39,57,0.55)] hover:border-[var(--brand-gold)]/55"
      }`}
      itemScope
      itemType="https://schema.org/Product"
      role="article"
      aria-label={`Product: ${data.name}`}
    >
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

      {/* Image tile — cream, inset, with a soft lift on hover */}
      <Link
        href={`/product-details/${data.slug}`}
        aria-label={`View details for ${data.name}`}
        title={data.name}
        prefetch={false}
      >
        <div
          className="framed-tile relative aspect-square rounded-xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {discountPercentage > 0 && (
            <span
              className="absolute left-3 top-3 z-20 rounded-full bg-[var(--brand-gold)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--brand-plum)] shadow-sm"
              role="status"
              aria-label={`${discountPercentage} percent discount`}
            >
              {discountPercentage}% Off
            </span>
          )}

          <div
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              isHovered && hasSecondaryImage ? "opacity-0" : "opacity-100"
            } ${isHovered ? "scale-[1.03]" : "scale-100"}`}
          >
            <Image
              fill
              src={data?.image ?? ""}
              alt={`${data.name} - Product image`}
              className="object-cover"
              itemProp="image"
              title={data.name}
              loading={eager ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>

          {hasSecondaryImage && (
            <div
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                isHovered ? "opacity-100 scale-[1.03]" : "opacity-0 scale-100"
              }`}
            >
              <Image
                fill
                src={data.images![0]}
                alt={`${data.name} - Product image hover`}
                className="object-cover"
                itemProp="image"
                title={data.name}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
          )}

          {packDealPerUnit != null && (
            <div className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-plum)]/90 px-2.5 py-1 text-[10px] text-[var(--brand-cream)]">
              <Sparkles size={11} aria-hidden="true" />
              <span>₹{packDealPerUnit}/unit in packs</span>
            </div>
          )}

          {(data.rating ?? 0) > 0 && (
            <span className="absolute bottom-2.5 left-2.5 z-20 inline-flex items-center gap-1 rounded-full border border-black/5 bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-ink)] shadow-sm backdrop-blur-sm">
              {Number(data.rating).toFixed(1)}
              <Star size={9} className="fill-[#e0a53c] text-[#e0a53c]" />
              {(data.reviewCount ?? 0) > 0 && (
                <>
                  <span className="mx-0.5 h-2.5 w-px bg-[var(--brand-ink)]/15" />
                  <span className="text-[9.5px] text-[var(--brand-ink)]/55">
                    {data.reviewCount}
                  </span>
                </>
              )}
            </span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-xl bg-[var(--brand-cream)]/70 backdrop-blur-[1px]">
              <span className="rounded-full border border-[var(--brand-gold)]/50 bg-white/95 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--brand-plum)]">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist — floats on the image corner */}
      <button
        disabled={wishlistLoading}
        aria-label={
          isWishlisted
            ? `Remove ${data.name} from wishlist`
            : `Add ${data.name} to wishlist`
        }
        aria-pressed={!!isWishlisted}
        className={`absolute right-4 top-4 z-30 grid size-8 place-items-center rounded-full border backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-90 ${
          isDark
            ? "border-[var(--brand-gold)]/30 bg-[#2e1b29]/80"
            : "border-[var(--brand-gold)]/30 bg-white/85"
        } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleWishlistToggle}
        type="button"
      >
        <Heart
          size={15}
          fill={isWishlisted ? "currentColor" : "none"}
          className={`transition-colors ${
            isWishlisted
              ? "text-[var(--brand-gold)]"
              : isDark
                ? "text-[var(--brand-cream)]/70"
                : "text-[var(--brand-ink)]/60"
          }`}
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <Link href={`/product-details/${data.slug}`} prefetch={false}>
          <h3
            className={`display-heading line-clamp-2 text-[15px] leading-snug transition-colors sm:text-[16.5px] ${
              isDark
                ? "text-[var(--brand-cream)] group-hover:text-[var(--brand-gold)]"
                : "text-[var(--brand-ink)] group-hover:text-[var(--brand-plum)]"
            }`}
            itemProp="name"
          >
            {data.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-1.5 pt-3 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={`text-[17px] font-semibold tracking-tight sm:text-lg ${
                  isDark ? "text-[var(--brand-cream)]" : "text-[var(--brand-ink)]"
                }`}
                itemProp="price"
                aria-label={`Current price: ${sellingPrice} rupees`}
              >
                ₹{sellingPrice?.toLocaleString() ?? "—"}
              </span>
              {displayPrice && displayPrice !== displayCurrentPrice && (
                <span
                  className={`text-[10.5px] line-through ${
                    isDark
                      ? "text-[var(--brand-cream)]/45"
                      : "text-[var(--brand-ink)]/40"
                  }`}
                  aria-label={`Original price: ${displayPrice} rupees`}
                >
                  ₹{displayPrice.toLocaleString()}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--brand-gold-dark)]">
                Save ₹{savings.toLocaleString()}
              </p>
            )}
          </div>

          <button
            disabled={loading || outOfStock}
            className={`inline-flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-0 text-[9.5px] font-medium uppercase tracking-[0.05em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-55 sm:h-8 sm:w-auto sm:px-3 ${
              isDark
                ? "bg-[var(--brand-gold)] text-[var(--brand-plum)] hover:brightness-105"
                : "bg-[var(--brand-pink)] text-white hover:bg-[#b34262]"
            }`}
            onClick={handleAddToCart}
            aria-label={`Add ${data.name} to cart`}
            type="button"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingCart size={13} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {loading ? "Adding" : outOfStock ? "Sold out" : "Add to cart"}
            </span>
          </button>
        </div>

        {savings > 0 && (
          <p className="sr-only">{`You save ${savings} rupees`}</p>
        )}
      </div>
    </article>
  );
}
