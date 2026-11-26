"use client";
import { useState, useEffect, useMemo } from "react";
import { Star, Package, Truck, Shield, RotateCcw, Share2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  { icon: Shield, label: "Secure Payment", desc: "100% protected" },
  { icon: Truck, label: "Free Shipping", desc: "On every order" },
  { icon: RotateCcw, label: "Easy Returns", desc: "15 day returns" },
  { icon: Package, label: "Gift Wrapping", desc: "Complimentary" },
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
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
      <Star
        key={i}
        size={14}
        className={
          i < Math.floor(rating || 0)
            ? "fill-[var(--brand-gold)] text-[var(--brand-gold)]"
            : "fill-[var(--brand-surface)] text-[var(--brand-surface)]"
        }
        strokeWidth={1.5}
      />
    ));

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

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

  return (
    <main className="bg-[var(--brand-cream)]/40">
      {/* ── Breadcrumb area ── */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
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
      </div>

      {/* ── Editorial product header ── */}
      <header className="mx-auto max-w-7xl px-4 pb-7 pt-5 text-center sm:px-6 lg:px-8 lg:pt-7">
        {product.category?.[0]?.name && (
          <p className="eyebrow">{product.category[0].name}</p>
        )}

        <h1 className="display-heading mx-auto mt-3 max-w-4xl text-[2.25rem] leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]">
          {product.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12.5px] text-[var(--brand-ink)]/70">
          <span className="inline-flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              {renderStars(product.rating ?? 0)}
            </span>
            <span>
              {product.rating ? Number(product.rating).toFixed(1) : "0.0"} ·{" "}
              {product.reviewCount || 0}{" "}
              {product.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </span>
          <span className="hidden size-1 rounded-full bg-[var(--brand-gold)]/60 sm:block" />
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
            SKU {product.sku || product._id.slice(-6)}
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--brand-plum)]"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </header>

      {/* ── Product hero section ── */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
          {/* ── Left: Images ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="min-w-0"
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

          {/* ── Right: Purchase panel (sticky on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex min-w-0 flex-col lg:sticky lg:top-28 lg:self-start"
          >
            <div className="rounded-[4px] border border-[var(--brand-gold)]/25 bg-white p-5 shadow-[0_30px_70px_-52px_rgba(74,37,66,0.55)] sm:p-6 lg:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--brand-gold-dark)]">
                  The piece
                </p>
                <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] ${(product.stock ?? 0) > 0 ? "text-[#4c6b4f]" : "text-[var(--brand-mauve)]"}`}>
                  <span className={`size-1.5 rounded-full ${(product.stock ?? 0) > 0 ? "bg-[#6f8f6f]" : "bg-[var(--brand-mauve)]"}`} />
                  {(product.stock ?? 0) > 0 ? "Ready to ship" : "Sold out"}
                </span>
              </div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-4">
                {selectedVariant ? (
                  <>
                    <span
                      className="display-heading text-3xl tracking-tight text-[var(--brand-plum)] sm:text-4xl"
                    >
                      ₹{selectedVariant.price.toLocaleString()}
                    </span>
                    <span className="text-xl sm:text-2xl text-muted-foreground line-through fw-body">
                      ₹{(
                        (selectedVariant.mrp ?? product.price * selectedVariant.quantity)
                      ).toLocaleString()}
                    </span>
                    {selectedVariantUnit != null && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs fw-cta bg-brand-accent-500/10 text-brand-accent-600 border border-brand-accent-200">
                        ₹{selectedVariantUnit}/unit
                      </span>
                    )}
                  </>
                ) : product.discount_price ? (
                  <>
                    <span
                      className="display-heading text-3xl tracking-tight text-[var(--brand-plum)] sm:text-4xl"
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
              <p className="mt-2 text-[10.5px] text-[var(--brand-ink)]/65">
                Inclusive of all taxes · Free shipping across India
              </p>
            </motion.div>

            {/* Low-stock urgency */}
            {typeof product.stock === "number" &&
              product.stock > 0 &&
              product.stock <= 10 && (
                <div className="mb-6">
                  <p className="mb-2 text-xs text-[var(--brand-ink)]/70">
                    Only{" "}
                    <strong className="fw-heading text-[var(--brand-plum)]">
                      {product.stock} items
                    </strong>{" "}
                    left in stock
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--brand-surface)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-mauve)]"
                      style={{
                        width: `${Math.max(8, Math.min(100, (product.stock / 10) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

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

            <div className="hairline mb-6" />

            {/* Color Picker */}
            <ColorPicker
              colors={(product.colors ?? []) as ColorItem[]}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            {/* TODO: QuantitySelector - may be used in future for custom quantity selection */}
            {/*
            <QuantitySelector
              quantity={selectedVariant ? selectedVariant.quantity : quantity}
              stock={product.stock || 10}
              locked={!!selectedVariant}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
            */}

            {/* Action Buttons */}
            <ActionButtons
              loading={loading}
              wishlistLoading={wishlistLoading}
              isWishlisted={!!isWishlisted}
              stock={product.stock ?? 0}
              quantity={selectedVariant ? selectedVariant.quantity : quantity}
              quantityLocked={!!selectedVariant}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
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

            {product.estimated_delivery_time && (
              <div className="mt-5 flex items-center gap-2.5 rounded-[3px] border border-[var(--brand-gold)]/20 bg-[var(--brand-section-bg)]/70 px-4 py-3 text-[12.5px] text-[var(--brand-ink)]/75">
                <Truck size={15} className="shrink-0 text-[var(--brand-gold-dark)]" strokeWidth={1.5} />
                <span>
                  Expected delivery in{" "}
                  <strong className="fw-heading text-[var(--brand-ink)]">
                    {product.estimated_delivery_time}
                  </strong>
                </span>
              </div>
            )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Assurance strip ── */}
      <section className="border-y border-[var(--brand-gold)]/20 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-7 sm:px-6 md:grid-cols-4 lg:px-8">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-cream)] text-[var(--brand-gold-dark)]">
                <badge.icon size={16} strokeWidth={1.4} />
              </span>
              <span>
                <span className="block text-[12px] leading-tight text-[var(--brand-ink)]">
                  {badge.label}
                </span>
                <span className="mt-1 block text-[10.5px] leading-snug text-[var(--brand-ink)]/65">
                  {badge.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Personalized section ── */}
      {product?.isPersonalized && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <Personalized />
        </div>
      )}

      {/* ── The details ── */}
      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <p className="eyebrow">
              <span className="mr-2">✦</span>
              The details
            </p>
            <h2 className="display-heading mt-3 text-3xl leading-tight sm:text-4xl">
              Considered in every detail.
            </h2>
            <ProductSpecifications product={product} />

            <div className="mt-5 border-t border-[var(--brand-gold)]/20 pt-4 text-[11.5px]">
              <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[var(--brand-ink)]/65">
                Categories
              </p>
              <p className="text-[var(--brand-ink)]/80">
                {[
                  ...(product.category ?? []).map((c) => c.name),
                  ...(product.subCategory ?? []).map((c) => c.name),
                ].join(", ") || "Jewellery"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--brand-ink)]/65">
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--brand-plum)]"
              >
                <MessageCircle size={12} /> Contact Us
              </Link>
              <Link
                href="/our-policy?query=shipping"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--brand-plum)]"
              >
                <Truck size={12} /> Shipping Info
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--brand-plum)]"
              >
                <Share2 size={12} /> Share
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-end justify-between gap-4 border-b border-[var(--brand-gold)]/25 pb-4">
              <div>
                <p className="eyebrow">Good to know</p>
                <h3 className="display-heading mt-2 text-2xl sm:text-3xl">
                  Care, delivery &amp; returns
                </h3>
              </div>
              <span className="mb-1 text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                {product.sku || "Ratnavya"}
              </span>
            </div>

            <Accordion
              type="single"
              collapsible
              defaultValue="description"
              className="w-full"
            >
              <AccordionItem value="description" className="border-b border-[var(--brand-gold)]/20">
                <AccordionTrigger className="py-5 text-[11.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)] hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line pb-6 pr-4 text-[13.5px] leading-relaxed text-[var(--brand-ink)]/70">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-b border-[var(--brand-gold)]/20">
                <AccordionTrigger className="py-5 text-[11.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)] hover:no-underline">
                  Shipping
                </AccordionTrigger>
                <AccordionContent className="pb-6 pr-4 text-[13.5px] leading-relaxed text-[var(--brand-ink)]/70">
                  Free shipping on every order across India. Dispatched within 1–2
                  business days; delivery usually takes 3–7 working days. You will
                  receive tracking details as soon as the parcel leaves our studio.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="packaging" className="border-b border-[var(--brand-gold)]/20">
                <AccordionTrigger className="py-5 text-[11.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)] hover:no-underline">
                  Packaging
                </AccordionTrigger>
                <AccordionContent className="pb-6 pr-4 text-[13.5px] leading-relaxed text-[var(--brand-ink)]/70">
                  Each piece arrives in a signature keepsake box with a soft pouch,
                  ready to gift. Complimentary gift wrapping is available on request.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns" className="border-b-0">
                <AccordionTrigger className="py-5 text-[11.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)] hover:no-underline">
                  Returns &amp; Cancellations
                </AccordionTrigger>
                <AccordionContent className="pb-6 pr-4 text-[13.5px] leading-relaxed text-[var(--brand-ink)]/70">
                  Easy 15-day returns on unworn pieces in original packaging.
                  Cancellations are accepted before the order is dispatched — just
                  reach out to our care team.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ── Gift Images Gallery ── */}
      {product.giftImages && product.giftImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-background rounded-2xl border border-border p-8 md:p-12 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package size={24} className="text-brand-600" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl fw-heading text-foreground tracking-tight">
                Gift Presentation
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-brand-200/50 via-brand-300/30 to-transparent mb-6" />
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
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer shadow-md border-2 border-border"
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
