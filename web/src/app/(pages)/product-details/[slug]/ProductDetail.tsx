"use client";
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import ProductReviews from "@/components/product/product-reviews";
import ImageSlider from "@/components/product/image-slider";
import { getAuthToken } from "@/lib/getAuthToken";
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
  const [selectedColor, setSelectedColor] = useState(
    details?.colors?.[0]?._id || ""
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
          const response = await fetch(
            process.env.NEXT_PUBLIC_API_URL +
              "api/website/wishlist/remove/" +
              product?._id,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({
                productId: product?._id,
              }),
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              removeFromWishlist({
                _id: product?._id,
              })
            );
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Something went wrong";
          toast.error(msg);
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(
          removeFromWishlist({
            _id: product?._id,
            isGuest: true,
          })
        );
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
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({
                productId: product?._id,
              }),
            }
          );
          const responseData = await response.json();
          if (response.ok || responseData._status) {
            dispatch(
              addToWishlist({
                _id: product?._id,
                slug: product?.slug,
              })
            );
            toast.success(responseData._message);
          } else {
            toast.error(responseData._message);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Something went wrong";
          toast.error(msg);
        } finally {
          setWishlistLoading(false);
        }
      } else {
        dispatch(
          addToWishlist({
            _id: product?._id,
            slug: product?.slug,
            isGuest: true,
          })
        );
        toast.success("Added to wishlist");
        setWishlistLoading(false);
      }
    }
  };

  const handleIncrement = () =>
    setQuantity((prev) => Math.min(prev + 1, product.stock || 10));
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleBuyNow = async () => {
    const buyNowItem = {
      productId: product._id,
      slug: product.slug,
      quantity: quantity,
      colorId: selectedColor,
    };
    dispatch(setBuyNowItem(buyNowItem));
    router.push("/checkout?type=direct");
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1 }}
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

  const allImages: string[] =
    (product.images?.length ?? 0) > 0
      ? [product.image, ...(product.images ?? [])].flatMap((img) => img ?? [])
      : [product.image].flatMap((img) => img ?? []);

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

  const cartObj = {
    productId: product._id,
    slug: product.slug,
    quantity: quantity,
    colorId: selectedColor,
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLoggedIn = !!getAuthToken();

    setLoading(true);

    if (isLoggedIn) {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "api/website/cart/add",
          {
            method: "POST",
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
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Something went wrong";
        toast.error(msg);
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
    <main className="py-8 sm:py-12 ">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
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

          <div className="flex flex-col p-2">
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
                        href: `/category/${product.category?.[0]?.slug || ""}/${
                          product.subCategory[0].slug
                        }`,
                      },
                    ]
                  : []),
              ]}
            />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl lg:text-5xl font-[350] text-foreground mb-6 leading-tight tracking-tight"
            >
              {product.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="flex items-center gap-1">
                {renderStars(product.rating ?? 0)}
              </div>
              <div className="h-4 w-px bg-muted-foreground" />
              <span className="text-sm text-muted-foreground font-[350]">
                {product.reviewCount} Reviews
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-10"
            >
              <div className="flex items-baseline gap-4 mb-1">
                {product.discount_price ? (
                  <>
                    <span className="text-5xl font-[350] text-foreground tracking-tight">
                      ₹{product.discount_price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-2xl line-through font-light">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-5xl font-light text-foreground">
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
                transition={{ delay: 0.45 }}
                className="text-base text-muted-foreground font-[350] leading-relaxed mb-6"
              >
                {product.shortDescription || product.short_description}
              </motion.p>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            <ProductSpecifications product={product} />

            <ColorPicker
              colors={(product.colors ?? []) as ColorItem[]}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            <QuantitySelector
              quantity={quantity}
              stock={product.stock || 10}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />

            <ActionButtons
              loading={loading}
              wishlistLoading={wishlistLoading}
              isWishlisted={!!isWishlisted}
              stock={product.stock ?? 0}
              onAddToCart={handleAddToCart}
              onWishlist={handleWishlist}
              onBuyNow={handleBuyNow}
            />

            {product.estimated_delivery_time && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center gap-3 text-base text-muted-foreground font-light"
              >
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span>
                  Expected delivery in {product.estimated_delivery_time}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {product?.isPersonalized && <Personalized />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-background/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-white/80 relative overflow-hidden">
            <motion.div
              animate={{
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
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-light text-foreground tracking-tight">
                  Description For The Product
                </h2>
              </div>

              <div className="h-px bg-gradient-to-r from-brand-200/50 via-brand-300/50 to-transparent mb-2" />

              <div className="text-foreground leading-loose text-base font-[350] whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </motion.div>

        <ProductFaqSection productId={product._id} />
        <RelatedProducts
          id={product._id}
          subCategory={(product.subCategory ?? []).map((c) => c._id)}
          subSubCategory={(product.subSubCategory ?? []).map((c) => c._id)}
        />
        <ProductReviews productId={product._id} />
      </motion.div>
    </main>
  );
}
