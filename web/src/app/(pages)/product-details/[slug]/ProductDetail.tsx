"use client";
import { useState, useEffect, useMemo } from "react";
import { Star, Package, Truck, Shield, RotateCcw, Sparkles, Check, Gem, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

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
import VariantSelector from "@/components/product/VariantSelector";
import ActionButtons from "@/components/product/ActionButtons";
import ProductNotFound from "@/components/product/ProductNotFound";

import type { ProductData, ProductVariant } from "@/types";

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
  const [selectedSize, setSelectedSize] = useState<string | null>(
    details?.sizes?.[0]?._id || null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

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
    // A selected variant overrides quantity + price (server recomputes from DB,
    // so this is purely a display/UX hint). Base product when no variant chosen.
    const effectiveQuantity = selectedVariant ? selectedVariant.quantity : quantity;
    const buyNowItem: Record<string, unknown> = {
      productId: product._id,
      slug: product.slug,
      quantity: effectiveQuantity,
    };
    if (selectedColor) {
      buyNowItem.colorId = selectedColor;
    }
    const selectedSizeObj = product.sizes?.find((s) => s._id === selectedSize);
    if (selectedSize) {
      buyNowItem.sizeId = selectedSize;
      buyNowItem.sizeName = selectedSizeObj?.name || null;
    }
    if (selectedVariant?._id) {
      buyNowItem.variantId = selectedVariant._id;
      buyNowItem.variantName = selectedVariant.name;
    }
    dispatch(setBuyNowItem(buyNowItem));
    router.push("/checkout?type=direct");
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariantId((prev) => (prev === variant._id ? null : (variant._id ?? null)));
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.08 }}
      >
        <Star
          size={16}
          className={
            i < Math.floor(rating || 4)
              ? "fill-brand-400 text-brand-400"
              : "text-muted-foreground"
          }
        />
      </motion.div>
    ));

  const allImages: string[] = useMemo(
    () =>
      (product.images?.length ?? 0) > 0
        ? [product.image, ...(product.images ?? [])].flatMap((img) => img ?? [])
        : [product.image].flatMap((img) => img ?? []),
    [product]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const cartObj: Record<string, unknown> = {
    productId: product._id,
    slug: product.slug,
    quantity: quantity,
  };
  // Only include colorId if a color is actually selected
  if (selectedColor) {
    cartObj.colorId = selectedColor;
  }
  // Only include sizeId if a size is actually selected
  if (selectedSize) {
    cartObj.sizeId = selectedSize;
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

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  // Derive the selected variant by _id every render so a server-side refresh
  // (details change) never leaves a stale variant object on screen.
  const selectedVariant =
    product.variants?.find((v) => v._id === selectedVariantId) ?? null;

  // Per-unit price of the selected pack (for the "₹X per unit" hint).
  const selectedVariantUnit =
    selectedVariant && selectedVariant.quantity > 0
      ? Math.round((selectedVariant.price / selectedVariant.quantity) * 100) / 100
      : null;

  // Gold gradient price text (jewellery showcase)
  const goldPriceClass = {
    background: "linear-gradient(135deg, var(--brand-price-1-from), var(--brand-price-1-via), var(--brand-price-1-to))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as const;

  return (
    <main className="py-8 sm:py-12 bg-gradient-to-b from-background via-background to-muted/30">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-16">
          {/* ── Left: Images ── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="relative">
              <ImageSlider
                images={allImages}
                productName={product.name}
                isNewArrival={product.isNewArrival ?? false}
                isMobile={isMobile}
                videoUrl={product.videoUrl}
                showVideo={showVideo}
                onShowVideo={() => setShowVideo((prev) => !prev)}
              />
            </div>
          </motion.div>

          {/* ── Right: Product Info (sticky on desktop) ── */}
          <div className="flex flex-col p-2 lg:sticky lg:top-28 lg:self-start">
            {/* Breadcrumb (restored inside the info column) */}
            <motion.div variants={itemVariants}>
              <Breadcrumb
                items={[
                  {
                    label: product.category?.[0]?.name || "Jewellery",
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
            </motion.div>

            {/* Category pill */}
            {product.category?.[0]?.name && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex self-start items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] fw-cta uppercase tracking-wider bg-brand-100 text-brand-800 mb-4"
              >
                <Sparkles size={12} />
                {product.category[0].name}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl lg:text-5xl fw-heading text-foreground mb-5 leading-tight tracking-tight"
            >
              {product.name}
            </motion.h1>

            {/* Rating row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-4 mb-7"
            >
              <div className="flex items-center gap-1">
                {renderStars(product.rating ?? 0)}
              </div>
              <div className="h-4 w-px bg-muted-foreground" />
              <span className="text-sm text-muted-foreground fw-body">
                {product.reviewCount || 0} Reviews
              </span>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <div className="flex items-baseline gap-4 mb-1 flex-wrap">
                {selectedVariant ? (
                  <>
                    <span className="text-5xl fw-heading tracking-tight" style={goldPriceClass}>
                      ₹{selectedVariant.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-2xl line-through fw-body">
                      ₹{(selectedVariant.mrp ?? product.price * selectedVariant.quantity).toLocaleString()}
                    </span>
                    {selectedVariantUnit != null && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs fw-cta bg-brand-accent-500/10 text-brand-accent-600 border border-brand-accent-200">
                        ₹{selectedVariantUnit}/unit
                      </span>
                    )}
                  </>
                ) : product.discount_price ? (
                  <>
                    <span className="text-5xl fw-heading tracking-tight" style={goldPriceClass}>
                      ₹{product.discount_price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-2xl line-through fw-body">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs fw-cta bg-brand-accent-500/10 text-brand-accent-600 border border-brand-accent-200">
                      {discountPercentage}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-5xl fw-heading text-foreground tracking-tight">
                    ₹{product.price?.toLocaleString() || "N/A"}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Short Description */}
            {(product.shortDescription || product.short_description) && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base text-muted-foreground fw-body leading-relaxed mb-6"
              >
                {product.shortDescription || product.short_description}
              </motion.p>
            )}

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent mb-6"
            />

            {/* Color Picker */}
            <ColorPicker
              colors={(product.colors ?? []) as ColorItem[]}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            {/* Size Picker */}
            {(product.sizes?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="w-1 h-4 rounded-full bg-brand-500" />
                  <h3 className="text-sm uppercase tracking-[0.2em] text-muted-foreground fw-heading">
                    Size
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes?.map((size) => (
                    <motion.button
                      key={size._id}
                      type="button"
                      onClick={() => setSelectedSize(size._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        selectedSize === size._id
                          ? "border-brand-600 bg-brand-50 text-brand-700 fw-heading"
                          : "border-border text-muted-foreground hover:border-brand-300 fw-body"
                      }`}
                    >
                      {size.name}
                      {selectedSize === size._id && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 inline-flex"
                        >
                          <Check size={14} className="text-brand-600" />
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quantity (restored — locked when a pack variant is selected) */}
            <QuantitySelector
              quantity={selectedVariant ? selectedVariant.quantity : quantity}
              stock={product.stock || 10}
              locked={!!selectedVariant}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />

            {/* Action Buttons (with Special Offers → Buy Now variants) */}
            <ActionButtons
              loading={loading}
              wishlistLoading={wishlistLoading}
              isWishlisted={!!isWishlisted}
              stock={product.stock ?? 0}
              onAddToCart={handleAddToCart}
              onWishlist={handleWishlist}
              onBuyNow={handleBuyNow}
              topChildren={
                hasVariants && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="mb-6"
                  >
                    <p className="text-sm fw-heading text-foreground mb-3">
                      Special Offers <span className="text-xs font-normal text-muted-foreground">— applies to Buy Now</span>
                    </p>
                    <VariantSelector
                      variants={product.variants ?? []}
                      selectedVariant={selectedVariant}
                      productStock={product.stock ?? 0}
                      onSelect={handleSelectVariant}
                    />
                  </motion.div>
                )
              }
            />

            {/* Specifications (restored below the buttons) */}
            <ProductSpecifications product={product} />

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
                className="mt-5 flex items-center gap-3 text-base text-muted-foreground fw-body"
              >
                <Truck size={18} className="text-brand-600 shrink-0" strokeWidth={1.5} />
                <span>
                  Expected delivery in{" "}
                  <strong className="text-foreground fw-heading">{product.estimated_delivery_time}</strong>
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Personalized section ── */}
        {product?.isPersonalized && (
          <div className="mb-12">
            <Personalized />
          </div>
        )}

        {/* ── Description (restored glow-orb card) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-background/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-white/80 relative overflow-hidden rounded-2xl">
            <motion.div
              aria-hidden
              animate={reduceMotion ? undefined : {
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-brand-100/20 to-brand-200/20 rounded-full blur-3xl"
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Gem size={22} className="text-brand-600" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-3xl fw-heading text-foreground tracking-tight">
                  Description
                </h2>
              </div>

              <div className="h-px bg-gradient-to-r from-brand-200/50 via-brand-300/50 to-transparent mb-6" />

              <div className="text-foreground leading-loose text-base fw-body whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Gift Images Gallery (restored warm card) ── */}
        {product.giftImages && product.giftImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-brand-50/80 to-brand-accent-50/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-brand-100/80 relative overflow-hidden rounded-2xl">
              <motion.div
                aria-hidden
                animate={reduceMotion ? undefined : {
                  rotate: [0, 360],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                  scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-brand-200/20 to-brand-accent-200/20 rounded-full blur-3xl"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Gift size={24} className="text-brand-600" strokeWidth={1.5} />
                  </motion.div>
                  <h2 className="text-3xl fw-heading text-foreground tracking-tight">
                    Gift Presentation
                  </h2>
                </div>

                <div className="h-px bg-gradient-to-r from-brand-200/50 via-brand-300/50 to-transparent mb-6" />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {product.giftImages.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer shadow-md border-2 border-white/60"
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
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Product FAQs ── */}
        <div className="mb-12">
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
        <ProductReviews productId={product._id} />
      </motion.div>
    </main>
  );
}
