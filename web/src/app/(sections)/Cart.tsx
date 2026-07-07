"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken } from "@/lib/getAuthToken";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  updateFullCart,
  updateQuantity as updateCartQuantity,
  removeFromCart,
} from "@/redux/features/cart";
import { useProductsByIds } from "@/lib/useProduct";
import type { ProductData } from "@/types";
import type { RootState } from "@/redux/store/store";
import type { CartSliceItem } from "@/redux/features/cart";

function serverItemToSlice(item: CartApiItem): CartSliceItem {
  return {
    productId: item.product._id as string ?? "",
    slug: item.product.slug as string ?? null,
    quantity: item.quantity ?? 1,
    colorId: (item.color?._id as string) ?? null,
    sizeId: (item.size?._id as string) ?? null,
    isGuest: false,
  };
}

interface CartApiItem {
  _id: string;
  product: ProductData;
  quantity: number;
  color: { _id: string; code: string; name: string };
  size?: { _id: string; name: string };
}

interface CartApiData {
  items: CartApiItem[];
  totalPrice: number;
  totalItems: number;
}

interface CartApiResponse {
  _data?: CartApiData;
}

export default function Cart({ cart }: { cart: CartApiResponse | null }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxCartItems = useSelector(
    (state: RootState) => state.cart?.cartItems ?? []
  );
  const [fetchedCart, setFetchedCart] = useState<CartApiResponse | null>(null);
  const fetchKey = useRef(false);

  // Collect unique product IDs from Redux cart items for guest batch fetch
  const guestIds = useMemo(() => {
    const hasServerData = !!(cart?._data?.items?.length || fetchedCart?._data?.items?.length);
    if (hasServerData || reduxCartItems.length === 0) return [];
    return [...new Set(reduxCartItems.map((item) => item.productId).filter(Boolean))];
  }, [cart, fetchedCart, reduxCartItems]);

  const { productMap, isLoading: guestProductsLoading } = useProductsByIds(guestIds);

  useEffect(() => {
    // If server cart data provided via SSR prop, dispatch immediately
    if (cart?._data?.items?.length) {
      dispatch(updateFullCart({
        items: cart._data.items.map(serverItemToSlice),
        totalPrice: cart._data.totalPrice,
        totalItems: cart._data.totalItems,
      }));
      return;
    }

    if (fetchKey.current) return;
    fetchKey.current = true;

    const token = getAuthToken();
    if (!token) return;

    fetch(process.env.NEXT_PUBLIC_API_URL + "api/website/cart/view", {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?._data?.items?.length) {
          setFetchedCart(data);
          dispatch(updateFullCart({
            items: data._data.items.map(serverItemToSlice),
            totalPrice: data._data.totalPrice,
            totalItems: data._data.totalItems,
          }));
        }
      })
      .catch(() => {});
  }, [cart, dispatch]);

  const effectiveCart: CartApiResponse | null = useMemo(() => {
    if (cart?._data?.items?.length) return cart;
    if (fetchedCart?._data?.items?.length) return fetchedCart;

    if (reduxCartItems.length === 0) return null;

    const items = reduxCartItems.map((item) => {
      // Look up fetched product data by _id (from batch response)
      const fetched = item.productId ? productMap.get(item.productId) : undefined;
      const product = fetched ?? {
        _id: item.productId,
        name: "Loading...",
        image: "/placeholder.svg",
        price: 0,
        slug: item.slug ?? "",
        stock: 0,
      } as ProductData;

      const colors = (fetched?.colors ?? []) as Array<{
        _id: string;
        name: string;
        code: string;
      }>;
      const sizes = (fetched?.sizes ?? []) as Array<{
        _id: string;
        name: string;
      }>;
      const color = colors.find((c) => c._id === item.colorId);
      const size = sizes.find((s) => s._id === item.sizeId);
      return {
        _id: `${item.productId}_${item.colorId ?? ""}_${item.sizeId ?? ""}`,
        product: {
          _id: item.productId,
          name: product.name,
          image: product.image ?? "/placeholder.svg",
          price: product.price,
          discount_price: product.discount_price,
          slug: product.slug,
          stock: product.stock ?? 0,
          colors: fetched?.colors ?? [],
          sizes: fetched?.sizes ?? [],
        } as ProductData,
        quantity: item.quantity,
        color: {
          _id: item.colorId ?? "",
          code: color?.code ?? "#000",
          name: color?.name ?? "",
        },
        size: size ? { _id: size._id, name: size.name } : undefined,
      } as CartApiItem;
    });

    const totalPrice = items.reduce(
      (sum, i) =>
        sum + (i.product.discount_price || i.product.price) * i.quantity,
      0
    );

    return {
      _data: {
        items,
        totalPrice,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      },
    };
  }, [cart, fetchedCart, reduxCartItems]);

  const hasServerData = !!(cart?._data?.items?.length || fetchedCart?._data?.items?.length);
  const isGuestView = !hasServerData && reduxCartItems.length > 0;

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (isGuestView) {
      const [productId, colorId, sizeId] = id.split("_");
      dispatch(
        updateCartQuantity({
          productId,
          quantity: newQuantity,
          colorId: colorId || null,
          sizeId: sizeId || null,
        })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `api/website/cart/items/update/${id}`,
        {
          credentials: "include",
          body: JSON.stringify({
            quantity: newQuantity,
          }),
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          method: "put",
        }
      );
      const updatedCart = await response.json();
      if (!response.ok || !updatedCart._status) {
        toast.error(updatedCart._message || "Failed to update cart");
      }
      router.push("/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    if (isGuestView) {
      const [productId, colorId, sizeId] = id.split("_");
      dispatch(
        removeFromCart({
          productId,
          colorId: colorId || null,
          sizeId: sizeId || null,
        })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `api/website/cart/items/remove/${id}`,
        {
          credentials: "include",
          body: JSON.stringify({ itemId: id }),
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          method: "put",
        }
      );
      const updatedCart = await response.json();
      if (!response.ok || !updatedCart._status) {
        toast.error(updatedCart._message || "Failed to remove item from cart");
      }
      router.push("/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove item from cart");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = effectiveCart?._data?.totalPrice || 0;
  const discountAmount = subtotal * 0;
  const finalSubtotal = subtotal - discountAmount;
  const shipping = finalSubtotal > 1000 ? 0 : 50;
  const estimatedTotal = finalSubtotal + shipping;

  if (!effectiveCart) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16">
        <div className="text-center space-y-8 max-w-md px-4">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <AnimatedCart />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-brand-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              Your Cart is Empty
            </h2>
            <p className="text-muted-foreground text-base">
              Discover our exquisite jewelry collection and add items to your
              cart
            </p>
          </div>

          <button
            onClick={() => router.push("/category/new-arrival")}
            className="inline-flex items-center gap-2 btn-gradient font-medium py-3 px-8 
                     rounded-full transition-all duration-300 shadow-sm transform hover:scale-105"
          >
            <ShoppingBag size={18} />
            Start Shopping
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="py-12 md:py-16 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
                Your Selection
              </span>
              <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-4 tracking-wide">
              Shopping Cart
            </h1>

            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-brand-600"></div>
              <div className="w-3 h-3 bg-brand-600 rounded-full"></div>
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-brand-600"></div>
            </div>

            <p className="text-muted-foreground text-base">
              {effectiveCart?._data?.totalItems || 0}{" "}
              {effectiveCart?._data?.totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {(effectiveCart?._data?.items?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {effectiveCart?._data?.items.map((item) => (
                  <div
                    key={item._id}
                    className="group bg-background rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl 
                             transition-all duration-300 border border-border hover:border-brand-200 
                             relative overflow-hidden"
                  >
                    {/* Hover Gradient */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-transparent 
                                  group-hover:from-brand-50/50 transition-all duration-500 pointer-events-none"
                    />

                    <div className="flex gap-4 sm:gap-6 relative z-10">
                      {/* Product Image */}
                      <Link
                        href={`/product-details/${item.product.slug}`}
                        className="flex-shrink-0"
                      >
                        <div
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-border 
                                      group-hover:border-brand-300 transition-all duration-300 bg-gradient-to-br from-brand-50 to-slate-50"
                        >
                          <Image
                            src={item.product.image ?? "/placeholder.svg"}
                            alt={item.product.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-4">
                            <Link
                              href={`/product-details/${item.product.slug}`}
                            >
                              <h3
                                className="text-base sm:text-lg font-semibold text-foreground mb-2 
                                           group-hover:text-brand-700 transition-colors line-clamp-2"
                              >
                                {item.product.name}
                              </h3>
                            </Link>

                            {/* Color */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-muted-foreground">
                                Color:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  style={{ backgroundColor: item.color.code }}
                                  className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                                />
                                <span className="text-sm font-medium text-muted-foreground">
                                  {item.color.name}
                                </span>
                              </div>
                            </div>

                            {/* Size */}
                            {item.size && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">
                                  Size:
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                  {item.size.name}
                                </span>
                              </div>
                            )}

                            {/* Price */}
                            <p className="text-xl sm:text-2xl font-bold text-brand-600">
                              ₹
                              {(
                                item.product.discount_price ||
                                item.product.price
                              ).toFixed(2)}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item._id)}
                            className="flex-shrink-0 w-9 h-9 rounded-full bg-muted hover:bg-brand-accent-50 
                                     border border-border hover:border-brand-accent-300 flex items-center justify-center 
                                     transition-all duration-300 group/btn hover:scale-110"
                            aria-label="Remove item"
                          >
                            <Trash2
                              size={16}
                              className="text-muted-foreground group-hover/btn:text-brand-accent-500 transition-colors"
                            />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-muted rounded-full p-1 border border-border">
                            <button
                              disabled={loading || item.quantity === 1}
                              onClick={() =>
                                updateQuantity(item._id, item.quantity - 1)
                              }
                              className="w-8 h-8 rounded-full hover:bg-background border border-transparent 
                                       hover:border-border flex items-center justify-center transition-all 
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Minus size={14} className="text-muted-foreground" />
                            </button>
                            <span className="w-10 text-center font-semibold text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              disabled={
                                loading || item.quantity === item.product.stock
                              }
                              onClick={() =>
                                updateQuantity(item._id, item.quantity + 1)
                              }
                              className="w-8 h-8 rounded-full hover:bg-background border border-transparent 
                                       hover:border-border flex items-center justify-center transition-all 
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.product.stock} in stock
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Shine */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent 
                                  via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-xl border border-border sticky top-24">
                  <div className="flex items-center gap-2 mb-6">
                    <ShoppingBag className="w-5 h-5 text-brand-600" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Order Summary
                    </h2>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 py-6 border-y border-border">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-semibold text-foreground">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-semibold">
                          -₹{discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Sparkles size={14} />
                            Free
                          </span>
                        ) : (
                          <span className="text-foreground">
                            ₹{shipping.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>

                    {finalSubtotal < 1000 && (
                      <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
                        <p className="text-xs text-brand-800">
                          Add ₹{(1000 - finalSubtotal).toFixed(2)} more for free
                          shipping!
                        </p>
                        <div className="mt-2 bg-background rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-brand-400 to-brand-600 h-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (finalSubtotal / 950) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-6">
                    <span className="text-lg font-semibold text-foreground">
                      Estimated Total
                    </span>
                    <span className="text-2xl font-bold text-brand-600">
                      ₹{estimatedTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <Link href="/checkout?type=cart">
                      <button
                        className="w-full btn-gradient font-semibold 
                                       py-4 rounded-xl transition-all duration-300 shadow-sm transform hover:scale-[1.02]
                                       flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout
                        <ArrowRight size={18} />
                      </button>
                    </Link>

                    <Link href="/">
                      <button
                        className="w-full mt-4  bg-background border-2 border-border hover:border-brand-400 
                                       text-muted-foreground hover:text-brand-700 font-medium py-4 rounded-xl 
                                       transition-all duration-300 hover:bg-brand-50"
                      >
                        Continue Shopping
                      </button>
                    </Link>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-emerald-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-emerald-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>BIS Hallmark Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <LoadingUi hidden={loading} />
    </>
  );
}

export const LoadingUi = ({ hidden }: { hidden: boolean }) => {
  return (
    <div
      className={
        !hidden
          ? "hidden"
          : "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1800]"
      }
    >
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Updating ...</p>
      </div>
    </div>
  );
};

const AnimatedCart = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-2 border-brand-300 animate-ping"
        style={{ animationDuration: "2s" }}
      />
      <div className="absolute inset-4 rounded-full border-2 border-brand-400 animate-pulse" />
      <ShoppingCart
        className="w-16 h-16 text-brand-500 relative z-10"
        strokeWidth={1.5}
      />
    </div>
  );
};
