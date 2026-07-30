"use client";
import { useState, useEffect, useMemo } from "react";
import { Star, Package, Truck, Shield, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import ProductReviews from "@/components/product/product-reviews";
import ImageSlider from "@/components/product/image-slider";
import { getAuthToken } from "@/lib/cookies";
import { useDispatch } from "react-redux";
import { addToCart, setBuyNowItem } from "@/redux/features/cart";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useIsMobile } from "@/hooks/use-mobile";
import RelatedProducts from "@/components/product/RelatedProducts";
import Breadcrumb from "./Breadcrumb";
import Personalized from "@/components/product/Personalized";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { RootState } from "@/redux/store/store";
import type { ColorItem } from "@/types";

import ProductFaqSection from "@/components/product/ProductFaqSection";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import ColorPicker from "@/components/product/ColorPicker";
import QuantitySelector from "@/components/product/QuantitySelector";
import ActionButtons from "@/components/product/ActionButtons";
import ProductNotFound from "@/components/product/ProductNotFound";

import type { ProductData } from "@/types";

const TRUST_BADGES = [
  { icon: Shield, label: "Secure Payment" },
  { icon: Truck, label: "Free Shipping" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Package, label: "Gift Wrapping" },
];

interface ProductDetailsPageProps {
  details: ProductData;
}

export default function ProductDetailsPage({ details }: ProductDetailsPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(details);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string | null>(
    details?.colors?.[0]?._id || null
  );
  const [showVideo, setShowVideo] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (details && Object.keys(details).length > 0) {
      setProduct(details);
    }
  }, [details]);

  if (!product || Object.keys(product).length === 0 || !product.name) {
    return <ProductNotFound />;
  }

  const isWishlisted = useSelector((state: RootState) =>
    state?.wishlist?.wishlistItems?.find((item) => item._id === product?._id)
  );

  const handleWishlist = async () => {
    const isLoggedIn = !!getAuthToken();
    setWishlistLoading(true);

    if (isWishlisted) {
      if (isLoggedIn) {
        try {
          const response = await fetch("/api/website/wishlist/remove/" + product?._id, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ productId: product?._id }),
          });
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(removeFromWishlist({ _id: product?._id }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (error) {
          const serverErr = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(serverErr?.response?.data?.message || (error instanceof Error ? error.message : "Something went wrong"));
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(removeFromWishlist({ _id: product?._id, isGuest: true }));
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
            body: JSON.stringify({ productId: product?._id }),
          });
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(addToWishlist({ _id: product?._id, slug: product?.slug }));
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (error) {
          const serverErr = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(serverErr?.response?.data?.message || (error instanceof Error ? error.message : "Something went wrong"));
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(addToWishlist({ _id: product?._id, slug: product?.slug, isGuest: true }));
        toast.success("Added to wishlist");
        setWishlistLoading(false);
      }
    }
  };

  const handleIncrement = () =>
    setQuantity((prev) => Math.min(prev + 1, product.stock || 10));
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleBuyNow = async () => {
    const buyNowItem: Record<string, unknown> = {
      productId: product._id,
      slug: product.slug,
      quantity: quantity,
    };
    if (selectedColor) {
      buyNowItem.colorId = selectedColor;
    }
    dispatch(setBuyNowItem(buyNowItem));
    router.push("/checkout?type=direct");
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={15}
        className={
          i < Math.floor(rating || 4)
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted"
        }
        strokeWidth={1.5}
      />
    ));

  const allImages: string[] = useMemo(
    () =>
      (product.images?.length ?? 0) > 0
        ? [product.image, ...(product.images ?? [])].flatMap((img) => img ?? [])
        : [product.image].flatMap((img) => img ?? []),
    [product]
  );

  const cartObj: Record<string, unknown> = {
    productId: product._id,
    slug: product.slug,
    quantity: quantity,
  };
  // Only include colorId if a color is actually selected
  if (selectedColor) {
    cartObj.colorId = selectedColor;
  }

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } catch (error) {
        const serverErr = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(serverErr?.response?.data?.message || (error instanceof Error ? error.message : "Something went wrong"));
      } finally {
        setLoading(false);
      }
    } else {
      dispatch(addToCart({ ...cartObj, isGuest: true }));
      toast.success("Added to cart");
      setLoading(false);
    }
  };

  const discountPercentage =
    product.price && product.discount_price
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : 0;

  return (
    <main className="bg-gradient-to-b from-background via-background to-muted/30">
      {/* ── Breadcrumb area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb
          items={[
            {
              label: product.category?.[0]?.name || "Toys",
              href: `/category/${product.category?.[0]?.slug || ""}`,
            },
            ...(product.subCategory?.[0]?.name
              ? [
                  {
                    label: product.subCategory[0].name,
                    href: `/category/${product.category?.[0]?.slug || ""}/${product.subCategory[0].slug}`,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* ── Product hero section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* ── Left: Images ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ImageSlider
              images={allImages}
              productName={product.name}
              isNewArrival={product.isNewArrival ?? false}
              isMobile={isMobile}
              videoUrl={product.videoUrl}
              showVideo={showVideo}
              onShowVideo={() => setShowVideo((prev) => !prev)}
            />
          </motion.div>

          {/* ── Right: Product Info (sticky on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col lg:sticky lg:top-28 lg:self-start"
          >
            {/* Category tag */}
            {product.category?.[0]?.name && (
              <span className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full text-[11px] fw-cta uppercase tracking-wider bg-brand-100 text-brand-800 mb-3">
                <Sparkles size={12} />
                {product.category[0].name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl fw-heading text-foreground leading-tight tracking-tight mb-4">
              {product.name}
            </h1>

            {/* Rating row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="flex items-center gap-0.5">
                {renderStars(product.rating ?? 0)}
              </div>
              <span className="text-sm text-muted-foreground fw-body">
                {product.reviewCount || 0} reviews
              </span>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-4">
                {product.discount_price ? (
                  <>
                    <span
                      className="text-4xl sm:text-5xl fw-heading tracking-tight"
                      style={{
                        background: "linear-gradient(135deg, var(--brand-price-1-from), var(--brand-price-1-via), var(--brand-price-1-to))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ₹{product.discount_price.toLocaleString()}
                    </span>
                    <span className="text-xl sm:text-2xl text-muted-foreground line-through fw-body">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs fw-cta bg-brand-accent-500/10 text-brand-accent-600 border border-brand-accent-200">
                      {discountPercentage}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-4xl sm:text-5xl fw-heading text-foreground tracking-tight">
                    ₹{product.price?.toLocaleString() || "N/A"}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Short Description */}
            {(product.shortDescription || product.short_description) && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base text-muted-foreground fw-body leading-relaxed mb-7"
              >
                {product.shortDescription || product.short_description}
              </motion.p>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent mb-6" />

            {/* Specifications */}
            <ProductSpecifications product={product} />

            {/* Color Picker */}
            <ColorPicker
              colors={(product.colors ?? []) as ColorItem[]}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            {/* Quantity */}
            <QuantitySelector
              quantity={quantity}
              stock={product.stock || 10}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />

            {/* Action Buttons */}
            <ActionButtons
              loading={loading}
              wishlistLoading={wishlistLoading}
              isWishlisted={!!isWishlisted}
              stock={product.stock ?? 0}
              onAddToCart={handleAddToCart}
              onWishlist={handleWishlist}
              onBuyNow={handleBuyNow}
            />

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 grid grid-cols-4 gap-3"
            >
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 border border-border"
                >
                  <badge.icon size={16} className="text-brand-600" strokeWidth={1.5} />
                  <span className="text-[10px] text-muted-foreground fw-body text-center leading-tight">
                    {badge.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Estimate delivery */}
            {product.estimated_delivery_time && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-4 flex items-center gap-2.5 text-sm text-muted-foreground fw-body bg-muted/50 rounded-xl px-4 py-3 border border-border"
              >
                <Truck size={15} className="text-brand-600 shrink-0" strokeWidth={1.5} />
                <span>Expected delivery in <strong className="text-foreground fw-heading">{product.estimated_delivery_time}</strong></span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Personalized section ── */}
      {product?.isPersonalized && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <Personalized />
        </div>
      )}

      {/* ── Description ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-background rounded-2xl border border-border p-8 md:p-12 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-brand-500" />
            <h2 className="text-2xl sm:text-3xl fw-heading text-foreground tracking-tight">
              Description
            </h2>
          </div>
          <div className="h-px bg-gradient-to-r from-brand-200/50 via-brand-300/30 to-transparent mb-6" />
          <div className="text-foreground leading-relaxed text-base fw-body whitespace-pre-line max-w-4xl">
            {product.description}
          </div>
        </motion.div>
      </section>

      {/* ── Gift Images Gallery ── */}
      {product.giftImages && product.giftImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-8 md:p-12 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package size={24} className="text-amber-600" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl fw-heading text-foreground tracking-tight">
                Gift Presentation
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-amber-200/50 via-amber-300/30 to-transparent mb-6" />
            <p className="text-sm text-muted-foreground fw-body mb-6">
              Beautifully wrapped gift options for your loved ones
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {product.giftImages.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer shadow-md border-2 border-amber-200/50 dark:border-amber-800/30"
                >
                  <img
                    src={img}
                    alt={`${product.name} gift presentation ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Product FAQs ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <ProductFaqSection productId={product._id} />
      </div>

      {/* ── Related Products ── */}
      <div className="mb-12">
        <RelatedProducts
          id={product._id}
          subCategory={(product.subCategory ?? []).map((c) => c._id)}
          subSubCategory={(product.subSubCategory ?? []).map((c) => c._id)}
        />
      </div>

      {/* ── Reviews ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <ProductReviews productId={product._id} />
      </div>
    </main>
  );
}
