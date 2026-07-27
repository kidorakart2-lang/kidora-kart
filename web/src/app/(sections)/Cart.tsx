"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getAuthToken } from "@/lib/cookies";
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

import CartItemRow from "@/components/cart/CartItemRow";
import CartEmptyState from "@/components/cart/CartEmptyState";
import CartSkeleton from "@/components/cart/CartSkeleton";
import OrderSummaryPanel from "@/components/cart/OrderSummaryPanel";
import LoadingOverlay from "@/components/comman/LoadingOverlay";

/* ── Types ──────────────────────────────────────────────────────────── */
export interface CartApiItem {
  _id: string;
  product: ProductData;
  quantity: number;
  color: { _id: string; code: string; name: string };
}

interface CartApiData {
  items: CartApiItem[];
  totalPrice: number;
  totalItems: number;
}

interface CartApiResponse {
  _data?: CartApiData;
}

function serverItemToSlice(item: CartApiItem): CartSliceItem {
  return {
    productId: item.product._id as string ?? "",
    slug: item.product.slug as string ?? null,
    quantity: item.quantity ?? 1,
    colorId: (item.color?._id as string) ?? null,
    isGuest: false,
  };
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

    fetch("/api/website/cart/view", {
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

    if (guestProductsLoading) return null;

    const items = reduxCartItems.map((item) => {
      // Look up fetched product data by _id (from batch response)
      const fetched = item.productId ? productMap.get(item.productId) : undefined;
      const product = fetched ?? {
        _id: item.productId,
        name: "",
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
      const color = (fetched?.colors ?? []).find((c) => c._id === item.colorId);
      return {
        _id: `${item.productId}_${item.colorId ?? ""}`,
        product: {
          _id: item.productId,
          name: product.name,
          image: product.image ?? "/placeholder.svg",
          price: product.price,
          discount_price: product.discount_price,
          slug: product.slug,
          stock: product.stock ?? 0,
          colors: fetched?.colors ?? [],
        } as ProductData,
        quantity: item.quantity,
        color: {
          _id: item.colorId ?? "",
          code: color?.code ?? "#000",
          name: color?.name ?? "",
        },
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
      const [productId, colorId] = id.split("_");
      dispatch(
        updateCartQuantity({
          productId,
          quantity: newQuantity,
          colorId: colorId || null,
        })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/website/cart/items/update/${id}`,
        {
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
      const [productId, colorId] = id.split("_");
      dispatch(
        removeFromCart({
          productId,
          colorId: colorId || null,
        })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/website/cart/items/remove/${id}`,
        {
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
  const discountAmount = 0;
  const shipping = 50;
  const estimatedTotal = subtotal + shipping - discountAmount;

  const isGuestHydrating =
    !hasServerData && reduxCartItems.length > 0 && guestProductsLoading;

  if (!effectiveCart) {
    if (isGuestHydrating) {
      return <CartSkeleton itemCount={reduxCartItems.length} />;
    }
    return <CartEmptyState />;
  }

  return (
    <>
      <main className="py-12 md:py-16 bg-gradient-to-b from-background via-background to-muted/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl fw-heading text-foreground tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground text-sm mt-2 font-light">
              {effectiveCart?._data?.totalItems || 0}{" "}
              {effectiveCart?._data?.totalItems === 1 ? "item" : "items"} in your cart
            </p>
            <div className="h-px bg-gradient-to-r from-border via-border to-transparent mt-4" />
          </div>

          {(effectiveCart?._data?.items?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {effectiveCart?._data?.items.map((item) => (
                  <CartItemRow
                    key={item._id}
                    item={item}
                    loading={loading}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Order Summary */}
              <OrderSummaryPanel
                subtotal={subtotal}
                discountAmount={discountAmount}
                shipping={shipping}
                estimatedTotal={estimatedTotal}
              />
            </div>
          )}
        </div>
      </main>

      <LoadingOverlay hidden={loading} />
    </>
  );
}
