"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  ShoppingBag,
  AlertCircle,
  Package,
  Check,
  Gem,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import ProductReviews from "@/components/product/product-reviews";
import ImageSlider from "@/components/product/image-slider";
import { getAuthToken } from "@/lib/getAuthToken";
import { useDispatch } from "react-redux";
import { addToCart, setBuyNowItem } from "@/redux/features/cart";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { openLoginModal, openRequirementModal } from "@/redux/features/uiSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import RelatedProducts from "@/components/product/RelatedProducts";
import Breadcrumb from "./Breadcrumb";
import Personalized from "@/components/product/Personalized";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import type { RootState } from "@/redux/store/store";
import type { ColorItem } from "@/types";

interface ProductFaqItem {
  _id: string;
  question: string;
  answer: string;
  product: string;
}

function ProductFaqSection({ productId }: { productId: string }) {
  const [faqs, setFaqs] = useState<ProductFaqItem[]>([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "api/website/product-faq")
      .then((r) => r.json())
      .then((data) => {
        const all: ProductFaqItem[] = data._data ?? [];
        setFaqs(all.filter((f) => f.product === productId));
      })
      .catch(() => {});
  }, [productId]);

  if (faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const jsonLdString = useMemo(() => JSON.stringify(jsonLd), [jsonLd]);

  return (
    <section className="mb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <div className="bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-white/80">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq._id}
              className="group border border-gray-200 rounded-lg overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-gray-800 font-[450] text-base hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <svg
                  className="w-4 h-4 text-gray-500 shrink-0 group-open:rotate-180 transition-transform"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-gray-600 text-base font-[350] leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

interface SizeItem {
  _id: string;
  name: string;
}

interface CategoryItem {
  name: string;
  slug?: string;
}

interface ProductDetailData {
  _id: string;
  name: string;
  price: number;
  discount_price?: number;
  image?: string;
  images?: string[];
  stock: number;
  slug: string;
  description?: string;
  short_description?: string;
  rating?: number;
  reviewCount?: number;
  material?: { name: string }[];
  colors?: ColorItem[];
  sizes?: SizeItem[];
  category?: CategoryItem[];
  subCategory?: CategoryItem[];
  subSubCategory?: CategoryItem[];
  isNewArrival?: boolean;
  isPersonalized?: boolean;
  estimated_delivery_time?: string;
  purity?: string;
}

interface ProductDetailsPageProps {
  details: ProductDetailData;
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
  const [selectedSize, setSelectedSize] = useState(
    details?.sizes?.[0]?._id || null
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (details && Object.keys(details).length > 0) {
      setProduct(details);
    }
  }, [details]);

  if (!product || Object.keys(product).length === 0 || !product.name) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center py-12 px-4 gradient-golden"
      >
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6 shadow-lg"
          >
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            Product Not Found
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            We couldn't find the product you're looking for. It might have been
            removed or is temporarily unavailable.
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Back to Home
          </motion.button>
        </div>
      </motion.div>
    );
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
                name: product?.name,
                image: product?.image,
                price: product?.price,
                discount_price: product?.discount_price,
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
            name: product?.name,
            image: product?.image,
            price: product?.price,
            discount_price: product?.discount_price,
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
    const selectedColorObj = product.colors?.find(
      (c) => c._id === selectedColor
    );
    const selectedSizeObj = product.sizes?.find((s) => s._id === selectedSize);

    const buyNowItem = {
      productId: product._id,
      quantity: quantity,
      colorId: selectedColor,
      sizeId: selectedSize,
      colorCode: selectedColorObj?.code || null,
      colorName: selectedColorObj?.name || null,
      sizeName: selectedSizeObj?.name || null,
      product: product,
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
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
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
    quantity: quantity,
    colorId: selectedColor,
    sizeId: selectedSize,
    product: {
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      discount_price: product.discount_price,
      slug: product.slug,
      stock: product.stock,
      colors: product.colors,
      sizes: product.sizes,
    },
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
            <ImageSlider
              images={allImages}
              productName={product.name}
              isNewArrival={product.isNewArrival ?? false}
              isMobile={isMobile}
            />
          </motion.div>

          <div className="flex flex-col p-2">
            <Breadcrumb
              items={[
                {
                  label: product.category?.[0]?.name || "Jewelry",
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
              className="text-4xl lg:text-5xl font-[350] text-gray-900 mb-6 leading-tight tracking-tight"
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
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-sm text-gray-500 font-[350]">
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
                    <span className="text-5xl font-[350] text-gray-900 tracking-tight">
                      ₹{product.discount_price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-2xl line-through font-light">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-5xl font-light text-gray-900">
                    ₹{product.price?.toLocaleString() || "N/A"}
                  </span>
                )}
              </div>
            </motion.div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-7"
            >
              <h3 className="text-base uppercase tracking-widest text-gray-800 mb-3 font-[450]">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {(product.material?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-base text-gray-800 mb-1 font-[350]">
                      Material -
                    </div>
                    <div className="text-base text-gray-900 font-[350]">
                      {product.material?.map((m) => m.name).join(", ")}
                    </div>
                  </div>
                )}
                {product.purity && (
                  <div>
                    <div className="text-base text-gray-800 mb-1 font-[350]">
                      Purity -
                    </div>
                    <div className="text-base text-gray-900 font-[350]">
                      {product.purity}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {(product.colors?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-10"
              >
                <h3 className="text-base uppercase tracking-widest text-gray-800 mb-3 font-[450]">
                  Color
                </h3>
                <div className="flex gap-3">
                  {product.colors?.map((color) => (
                    <motion.button
                      key={color._id}
                      type="button"
                      onClick={() => setSelectedColor(color._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-12 h-12 rounded-full transition-all ${
                        selectedColor === color._id
                          ? "ring-2 ring-amber-600 ring-offset-2"
                          : "ring-1 ring-gray-200"
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{ backgroundColor: color.code }}
                      />
                      {selectedColor === color._id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Check size={12} className="text-amber-600" />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {(product.sizes?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="mb-10"
              >
                <h3 className="text-base uppercase tracking-widest text-gray-800 mb-3 font-[450]">
                  Size
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes?.map((size) => (
                    <motion.button
                      key={size._id}
                      type="button"
                      onClick={() => setSelectedSize(size._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full border font-light text-sm transition-all ${
                        selectedSize === size._id
                          ? "border-amber-600 bg-amber-50 text-amber-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {size.name}
                      {selectedSize === size._id && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 inline-flex"
                        >
                          <Check size={14} className="text-amber-600" />
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-7"
            >
              <h3 className="text-base uppercase tracking-widest text-gray-800 mb-5 font-[350]">
                Quantity
              </h3>
              <div className="inline-flex items-center border border-gray-200 rounded-full overflow-hidden">
                <motion.button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  whileHover={{ backgroundColor: "rgba(251, 191, 36, 0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </motion.button>
                <div className="w-12 h-10 flex items-center justify-center text-gray-900 font-light border-x border-gray-200">
                  {quantity}
                </div>
                <motion.button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= (product.stock || 10)}
                  whileHover={{ backgroundColor: "rgba(251, 191, 36, 0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3 mt-auto"
            >
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.stock || loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-white border border-gray-300 text-gray-900 py-4 px-6 rounded-full font-light flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 transition-all text-sm uppercase tracking-wider"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <ShoppingCart size={18} />
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  disabled={wishlistLoading}
                  onClick={handleWishlist}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-14 h-14 flex items-center justify-center rounded-full border transition-all ${
                    isWishlisted
                      ? "text-red-500 border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400 text-gray-600"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </motion.button>
              </div>

              <motion.button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.stock}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-4 px-6 rounded-full font-light flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm uppercase tracking-wider"
              >
                <span>Buy Now</span>
                <ShoppingCart size={18} />
              </motion.button>
            </motion.div>

            {product.estimated_delivery_time && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center gap-3 text-base text-gray-500 font-light"
              >
                <Truck size={16} className="text-amber-600" />
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
          <div className="bg-white/60 backdrop-blur-xl  shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-white/80 relative overflow-hidden">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-100/20 to-orange-100/20 rounded-full blur-3xl"
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
                  <Gem size={24} className="text-amber-600" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                  Description For The Product
                </h2>
              </div>

              <div className="h-px bg-gradient-to-r from-amber-200/50 via-amber-300/50 to-transparent mb-2" />

              <div className="text-gray-800 leading-loose text-base font-[350] whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </motion.div>

        <ProductFaqSection productId={product._id} />
        <RelatedProducts
          id={product._id}
          subCategory={(product.subCategory ?? []).map((c) => c.slug ?? c.name)}
          subSubCategory={(product.subSubCategory ?? []).map((c) => c.slug ?? c.name)}
        />
        <ProductReviews productId={product._id} />
      </motion.div>
    </main>
  );
}
