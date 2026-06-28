"use client";
import { Heart, ShoppingCart, Eye, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/getAuthToken";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/features/cart";
import { useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/redux/features/wishlist";
import { openLoginModal } from "@/redux/features/uiSlice";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";

export default function ProductCard({ data }: { data: ProductData }) {
  const cartItem = useSelector((state: RootState) =>
    state.cart.cartItems.find((item) => item.productId === data?._id)
  );

  const cartObj = {
    productId: data?._id,
    quantity:
      cartItem && typeof cartItem.quantity === "number" ? cartItem.quantity : 1,
    colorId: data?.colors?.[0]?._id,
    sizeId: data?.sizes?.[0]?._id || null,
    product: {
      _id: data?._id,
      name: data?.name,
      image: data?.image,
      price: data?.price,
      discount_price: data?.discount_price,
      slug: data?.slug,
      stock: data?.stock,
      colors: data?.colors,
      sizes: data?.sizes,
    },
  };

  const [loading, setLoading] = useState(false);
  const [src, setSrc] = useState<string | undefined>(data?.image);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = useSelector((state: RootState) =>
    state.wishlist.wishlistItems.find((item) => item._id === data?._id)
  );

  const [slideDirection, setSlideDirection] = useState(1);
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
    if (hovered && data?.images && data?.images.length > 0) {
      setSlideDirection(1);
      setSrc(data?.images[0]);
    } else if (!hovered) {
      setSlideDirection(-1);
      setSrc(data?.image);
    }
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
                name: data?.name,
                image: data?.image,
                price: data?.price,
                discount_price: data?.discount_price,
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
            name: data?.name,
            image: data?.image,
            price: data?.price,
            discount_price: data?.discount_price,
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

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  const imageSlideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -20 : 20,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <motion.article
      className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-amber-200"
      itemScope
      itemType="https://schema.org/Product"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
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

      {/* Gradient Overlay on Hover */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent 
                    group-hover:from-black/10 transition-all duration-500 pointer-events-none z-[1]"
      ></div>

      {/* Top Actions Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
        {/* Discount Badge */}
        <AnimatePresence>
          {discountPercentage > 0 && (
            <motion.div
              className="bg-gradient-to-br from-rose-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              role="status"
              aria-label={`${discountPercentage} percent discount`}
            >
              <Sparkles className="w-3 h-3" />
              {discountPercentage}% OFF
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wishlist Button */}
        <motion.button
          disabled={wishlistLoading}
          aria-label={
            isWishlisted
              ? `Remove ${data.name} from wishlist`
              : `Add ${data.name} to wishlist`
          }
           aria-pressed={!!isWishlisted}
          className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 
                   hover:bg-white hover:border-amber-400 flex items-center justify-center 
                   transition-all duration-300 shadow-lg hover:shadow-xl
                   ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleWishlistToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="button"
        >
          <Heart
            size={18}
            fill={isWishlisted ? "currentColor" : "none"}
            className={`transition-colors ${
              isWishlisted ? "text-rose-500" : "text-slate-600"
            }`}
            aria-hidden="true"
          />
        </motion.button>
      </div>

      {/* Image Container */}
      <Link
        href={`/product-details/${data.slug}`}
        aria-label={`View details for ${data.name}`}
        title={data.name}
      >
        <div
          className="relative h-64 sm:h-72 bg-gradient-to-br from-amber-50 to-slate-50 overflow-hidden"
          onMouseEnter={() => handleImageHover(true)}
          onMouseLeave={() => handleImageHover(false)}
        >
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            <motion.div
              custom={slideDirection}
              variants={imageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <Image
                width={500}
                height={500}
                src={src ?? ""}
                alt={`${data.name} - Product image`}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-700"
                itemProp="image"
                title={data.name}
              />
            </motion.div>
          </AnimatePresence>

          {/* Quick View Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/10  flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isHovered ? 1 : 0.8,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-full px-6 py-3 flex items-center gap-2 shadow-xl"
            >
              <Eye className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-slate-800">
                Quick View
              </span>
            </motion.div>
          </motion.div>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-5">
        {/* Category */}
        {data.subCategory && data.subCategory.length > 0 && (
          <motion.p
            className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-2 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
            <span itemProp="category">
              {data.subCategory.map((cat) => cat.name).join(", ")}
            </span>
          </motion.p>
        )}

        {/* Product Name */}
        <Link href={`/product-details/${data.slug}`}>
          <motion.h3
            className="text-base sm:text-lg font-semibold text-slate-900 mb-3 line-clamp-2 
                     group-hover:text-amber-700 transition-colors cursor-pointer leading-tight"
            itemProp="name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {data.name}
          </motion.h3>
        </Link>

        {/* Pricing */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          role="group"
          aria-label="Product pricing"
        >
          <div className="flex items-baseline gap-2 mb-1">
            {displayCurrentPrice && (
              <span
                className="text-2xl font-bold text-slate-900"
                itemProp="price"
                aria-label={`Current price: ${displayCurrentPrice} rupees`}
              >
                ₹{displayCurrentPrice}
              </span>
            )}
            {displayPrice && displayPrice !== displayCurrentPrice && (
              <span
                className="text-sm text-slate-400 line-through"
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
        </motion.div>

        {/* Add to Cart Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          role="group"
          aria-label="Product actions"
        >
          <Button
            disabled={loading || data.stock === 0}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 
                     text-white py-6 rounded-xl text-sm font-semibold uppercase tracking-wider
                     flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                     hover:shadow-amber-500/30 transition-all duration-300 
                     transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
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
        </motion.div>
      </div>

      {/* Bottom Shine Effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      ></div>
    </motion.article>
  );
}
