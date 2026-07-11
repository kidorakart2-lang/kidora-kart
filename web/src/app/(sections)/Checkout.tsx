"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  createOrder,
  createRazorpayOrder,
  verifyCod,
  verifyPayment,
} from "@/lib/orderService";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store/store";
import OrederSummery from "@/components/comman/OrederSummery";
import { useProductsByIds, useProduct } from "@/lib/useProduct";
import { useShippingEstimate } from "@/lib/useShippingEstimate";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SwipeButton } from "@/components/ui/swipe-button";
import { LoadingUi } from "./Cart";
import Personalized from "@/components/product/Personalized";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAuthToken } from "@/lib/getAuthToken";
import { openLoginModal } from "@/redux/features/uiSlice";
import { useProfileBootstrap } from "@/hooks/useProfileBootstrap";
import type { CheckoutFormData, OrderSummaryCartItem, ProductData } from "@/types";
import { ArrowLeft, Shield, Truck, RotateCcw, Loader2, MapPin } from "lucide-react";
import { INDIAN_STATES, siteConfig } from "@/lib/utils";

// Generates a fresh UUID v4 per checkout attempt.
// An idempotency key MUST represent one specific checkout attempt — never derive
// it from userId, productId, or any business data, otherwise two legitimate
// repeat purchases collide on the same key and the server returns the old order.
const generateIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function Checkout() {
  const searchParams = useSearchParams();

  // Ensure profile data is loaded if a valid cookie exists
  useProfileBootstrap();

  const [alert, setAlert] = useState({
    title: "",
    open: false,
  });
  const [couponCode, setCouponCode] = useState(null);

  const logo = useSelector((state: RootState) => state.logo.logo);
  const purchaseType = searchParams.get("type") || "cart";
  const buyNowItem = useSelector((state: RootState) => state.cart.buyNowItem);
  const cartItemsState = useSelector((state: RootState) => state.cart.cartItems);

  // Fetch product details for buy-now and cart items via TanStack Query
  const directSlug = purchaseType === "direct" ? buyNowItem.slug : null;
  const cartIds = useMemo(() => {
    if (purchaseType !== "cart") return [];
    return [...new Set(cartItemsState.map((item) => item.productId).filter(Boolean))];
  }, [purchaseType, cartItemsState]);

  const { data: directProduct, isLoading: directLoading } = useProduct(directSlug);
  const { productMap, isLoading: cartLoading } = useProductsByIds(cartIds);

  // Build enriched cart items (merge Redux state with fetched product data)
  const cartItems = useMemo(() => {
    if (purchaseType === "direct") {
      const rawItems = Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem];
      return rawItems.map((item) => {
        const fetched = directProduct ?? undefined;
        const color = fetched?.colors?.find((c) => c._id === item.colorId);
        const size = item.sizeId
          ? fetched?.sizes?.find((s) => s._id === item.sizeId)
          : undefined;
        return {
          _id: item.productId,
          product: (fetched ?? {
            _id: item.productId,
            name: "Loading...",
            image: "/placeholder.svg",
            price: 0,
            slug: item.slug ?? "",
            stock: 0,
          }) as ProductData,
          quantity: item.quantity,
          colorId: item.colorId ?? undefined,
          sizeId: item.sizeId || undefined,
          colorCode: color?.code,
          colorName: color?.name,
          sizeName: size?.name,
          isPersonalized: fetched?.isPersonalized ?? false,
        };
      });
    }
    return cartItemsState.map((item) => {
      const fetched = item.productId ? productMap.get(item.productId) : undefined;
      const color = fetched?.colors?.find((c) => c._id === item.colorId);
      const size = item.sizeId
        ? fetched?.sizes?.find((s) => s._id === item.sizeId)
        : undefined;
      return {
        _id: `${item.productId}_${item.colorId ?? ""}_${item.sizeId ?? ""}`,
        product: (fetched ?? {
          _id: item.productId,
          name: "Loading...",
          image: "/placeholder.svg",
          price: 0,
          slug: item.slug ?? "",
          stock: 0,
        }) as ProductData,
        quantity: item.quantity,
        color: color ? { _id: color._id, code: color.code ?? "#000", name: color.name } : undefined,
        size: size ? { _id: size._id, name: size.name } : undefined,
      };
    });
  }, [purchaseType, buyNowItem, cartItemsState, directProduct, productMap]);

  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  // Stable across a single payment attempt so retries of the same request reuse
  // it (server returns the cached order). Resetting happens at the next page
  // mount / new checkout — which is exactly "a new attempt", per spec.
  const idempotencyKeyRef = useRef<string>("");
  const user = useSelector((state: RootState) => state.auth.details);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLogin);

  useEffect(() => {
    if (!purchaseType) {
      router.push("/checkout?type=cart");
    }
  }, [purchaseType]);

  const totalAmount = cartItems?.reduce(
    (total, item) => total + (item?.product?.discount_price || item?.product?.price || 0) * item.quantity,
    0,
  );

  // Load saved shipping data from sessionStorage (for guests only)
  const getInitialOrderData = (): CheckoutFormData => {
    // For guests, try to load from sessionStorage
    if (typeof window !== "undefined" && !getAuthToken()) {
      const savedData = sessionStorage.getItem("checkoutOrderData");
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
    return {
      shippingAddress: {
        fullName: user?.name || "",
        phone: user?.mobile || "",
        email: user?.email || "",
        street: user?.address?.street || "",
        area: user?.address?.area || "",
        city: user?.address?.city || "",
        state: user?.address?.state || "",
        pincode: String(user?.address?.pincode ?? ""),
        instructions: user?.address?.instructions || "",
      },
      notes: "",
      isGift: false,
      giftMessage: "",
      giftWrap: false,
      couponCode: "",
      isPersonalizedName:
        purchaseType == "direct"
          ? sessionStorage.getItem("personalizedName") || ""
          : "",
    };
  };

  const [orderData, setOrderData] = useState(getInitialOrderData);

  // Save orderData to sessionStorage whenever it changes (for guests only)
  useEffect(() => {
    if (typeof window !== "undefined" && !getAuthToken()) {
      sessionStorage.setItem("checkoutOrderData", JSON.stringify(orderData));
    }
  }, [orderData]);

  const [showAddressPrompt, setShowAddressPrompt] = useState(false);

  // Build stable items array for the shipping estimate query
  const estimateItems = useMemo(
    () =>
      cartItems
        .filter((item) => !!item.product?._id)
        .map((item) => ({
          productId: item.product!._id,
          quantity: item.quantity || 1,
        })),
    [cartItems],
  );

  // React Query handles caching, dedup, auto-fetch on pincode change,
  // AbortController cleanup, and background refetching.
  const {
    data: shippingEstimate,
    isFetching,
    refetch,
  } = useShippingEstimate(
    orderData.shippingAddress.pincode,
    estimateItems,
  );

  // Helper to load address from profile
  const loadProfileAddress = () => {
    if (!user) return;
    setOrderData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        fullName: user.name || "",
        phone: user.mobile || "",
        email: user.email || "",
        street: user.address?.street || "",
        area: user.address?.area || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        pincode: user.address?.pincode || "",
        instructions: user.address?.instructions || "",
      },
    }));
    setShowAddressPrompt(false);
  };

  // Update from user data when user logs in
  useEffect(() => {
    if (user && isLoggedIn) {
      // Clear guest session data when user logs in
      sessionStorage.removeItem("checkoutOrderData");

      const hasSavedAddress =
        user.address &&
        (user.address.street || user.address.city || user.address.pincode);
      const currentAddress = orderData.shippingAddress;
      // Check if critical address fields are filled in the form
      const formHasData =
        currentAddress.street || currentAddress.city || currentAddress.pincode;

      if (hasSavedAddress && formHasData) {
        setShowAddressPrompt(true);
        // Ensure email is set even if we don't overwrite address
        setOrderData((prev) => ({
          ...prev,
          shippingAddress: {
            ...prev.shippingAddress,
            email: prev.shippingAddress.email || user.email || "",
          },
        }));
      } else {
        // Auto-fill everything if no conflict
        setOrderData((prev) => ({
          ...prev,
          shippingAddress: {
            fullName: prev.shippingAddress.fullName || user.name || "",
            phone: prev.shippingAddress.phone || user.mobile || "",
            email: user.email || "",
            street: prev.shippingAddress.street || user.address?.street || "",
            area: prev.shippingAddress.area || user.address?.area || "",
            city: prev.shippingAddress.city || user.address?.city || "",
            state: prev.shippingAddress.state || user.address?.state || "",
            pincode:
              prev.shippingAddress.pincode || user.address?.pincode || "",
            instructions:
              prev.shippingAddress.instructions ||
              user.address?.instructions ||
              "",
          },
        }));
      }
    }
  }, [user, isLoggedIn]);

  // Handle guest checkout - open login modal and store mobile for callback
  const handleGuestCheckout = () => {
    // Save current order data to sessionStorage before navigating
    sessionStorage.setItem("checkoutOrderData", JSON.stringify(orderData));

    // Store mobile number in localStorage for google callback to use
    if (orderData.shippingAddress.phone) {
      localStorage.setItem("checkoutMobile", orderData.shippingAddress.phone);
    }
    // Store return URL to come back after login
    localStorage.setItem(
      "googleLoginReturnTo",
      `/checkout?type=${purchaseType}`,
    );
    // Open login modal with delay to prevent dialog conflict (if coming from COD dialog)
    setTimeout(() => {
      dispatch(openLoginModal());
    }, 300);
  };

  // Load Razorpay script with retry
  const loadRazorpayScript = async (retries = 2): Promise<boolean> => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const loaded = await new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.crossOrigin = "anonymous";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
      if (loaded || (window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  };

  // Handle payment
  const handlePayment = async (isCodAdvance = false) => {
    try {
      const isGuest = !isLoggedIn && !getAuthToken();

      if (testError(orderData, isGuest)) {
        setTimeout(() => {
          setAlert({
            title: `Please Fill ${testError(orderData, isGuest)}`,
            open: true,
          });
        }, 300);
        return;
      }

      // Check if user is logged in, if not, open login modal
      if (isGuest) {
        handleGuestCheckout();
        return; // User will be redirected back after login
      }

      setLoading(true);

      // Mint exactly one idempotency key per checkout attempt.
      // If the user swipes again for a different purchase (new component mount,
      // new page load), a fresh key is generated — no collision with the old one.
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = generateIdempotencyKey();
      }

      const orderPayload = {
        purchaseType,
        ...orderData,
        ...(purchaseType == "direct" && {
        items: (Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem]).map(
          (item) => ({
            productId: item.productId,
            colorId: item.colorId ?? undefined,
            sizeId: item.sizeId || undefined,
            quantity: item.quantity,
          }),
        ),
      }),
        isCodAdvance,
        idempotencyKey: idempotencyKeyRef.current,
        shippingCharge: shippingEstimate?.estimatedCharge,
        shippingCourier: shippingEstimate?.courierName,
        shippingEtd: shippingEstimate?.etd,
      };

      const createOrderResponse = await createOrder(orderPayload);
      const { orderId } = createOrderResponse.order;

      const razorpayResponse = await createRazorpayOrder(orderId, isCodAdvance);
      const { razorpayOrderId, amount, currency, keyId } = razorpayResponse;

      const res = await loadRazorpayScript();
      if (!res) {
        setAlert({
          title:
            "Payment gateway could not be loaded. Please try again or use a different payment method.",
          open: true,
        });
        return;
      }

      const options = {
        key: keyId,
        amount: amount * 100, // Amount in paise
        currency: currency,
        name: "Kidora Kart",
        description: `Order #${orderId}`,
        image: logo || "/images/logo.webp", // Your logo
        order_id: razorpayOrderId,
        prefill: {
          name: orderData.shippingAddress.fullName,
          email: orderData.shippingAddress.email,
          contact: orderData.shippingAddress.phone,
        },
        theme: {
          color: typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || '#f59e0b' : '#f59e0b',
        },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // Step 5: Verify payment on backend
          setLoading(true);
          try {
            const verifyResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });

            if (verifyResponse.success) {
              setLoading(false);
              // Redirect to order success page
              router.push(
                `/order-success?orderId=${orderId}&otp=${verifyResponse.order.deliveryOTP}&packageId=${verifyResponse.order.packageId}`,
              );
            } else {
              setAlert({
                title:
                  verifyResponse.message ||
                  "Payment verification failed. Please contact support.",
                open: true,
              });
            }
          } catch (error) {
            setAlert({
              title: "Payment verification failed. Please contact support.",
              open: true,
            });
            setLoading(false);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setAlert({
              title: "Payment cancelled",
              open: true,
            });
            setLoading(false);
          },
        },
      };

      // Step 6: Open Razorpay checkout
      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const paymentObject = new RazorpayConstructor(options);
      paymentObject.open();
    } catch (error) {
      setAlert({
        title: "Something went wrong. Please try again.",
        open: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingUi hidden={loading} />

      <div className="min-h-screen bg-gradient-to-b from-background to-brand-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-10">
           <h1 className="text-3xl md:text-4xl fw-heading text-foreground tracking-tight">
            Checkout
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-light">
            Complete your purchase by filling in the details below
          </p>
          <div className="h-px bg-gradient-to-r from-brand-200 via-brand-400/50 to-transparent mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                    1
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Shipping Information
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter your delivery address</p>
                  </div>
                </div>
              </div>

              {/* Saved Address Prompt */}
              {showAddressPrompt && (
                <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-brand-900">
                    <p className="font-medium">Saved address found</p>
                    <p>
                      Would you like to use the address saved in your profile?
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddressPrompt(false)}
                      className="flex-1 sm:flex-none border-brand-300 hover:bg-brand-100"
                    >
                      Keep Current
                    </Button>
                    <Button
                      size="sm"
                      onClick={loadProfileAddress}
                      className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-background"
                    >
                      Use Profile Address
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={orderData.shippingAddress.fullName}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          fullName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email *
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={orderData.shippingAddress.email}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground text-sm">{siteConfig.contact.countryCode}</span>
                    </div>
                    <input
                      type="tel"
                      value={orderData.shippingAddress.phone}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) {
                          setOrderData({
                            ...orderData,
                            shippingAddress: {
                              ...orderData.shippingAddress,
                              phone: value,
                            },
                          });
                        }
                      }}
                      className="w-full pl-12 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Pincode *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={orderData.shippingAddress.pincode}
                      onChange={(e) => {
                        // Only allow numbers and limit to 6 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOrderData({
                          ...orderData,
                          shippingAddress: {
                            ...orderData.shippingAddress,
                            pincode: value,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit pincode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={orderData.shippingAddress.pincode.length !== 6}
                      className="shrink-0 border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-1" />
                          Checking
                        </>
                      ) : (
                        <>
                          <MapPin size={14} className="mr-1" />
                          Check
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Shipping Estimate Card / Loading Skeleton */}
                {isFetching && !shippingEstimate ? (
                  /* Skeleton while first fetch is in progress */
                  <div className="col-span-full -mt-2">
                    <div className="border border-border rounded-xl p-4 animate-pulse">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded bg-muted-foreground/20" />
                          <div className="h-4 w-28 rounded bg-muted-foreground/20" />
                        </div>
                        <div className="h-5 w-36 rounded-full bg-muted-foreground/20" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                        <div className="w-3 h-3 rounded bg-muted-foreground/20" />
                        <div className="h-3 w-40 rounded bg-muted-foreground/20" />
                      </div>
                    </div>
                  </div>
                ) : shippingEstimate ? (
                  <div className="col-span-full -mt-2">
                    <div className={`bg-brand-50 border border-brand-200 rounded-xl p-4 transition-all hover:shadow-sm ${isFetching ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <Truck className="w-4 h-4 text-brand-600" />
                          <span className="text-sm font-semibold text-brand-900">
                            ₹{shippingEstimate.estimatedCharge} shipping
                          </span>
                        </div>
                        {shippingEstimate.etd && (
                          <span className="text-xs text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full font-medium">
                            Est. delivery {shippingEstimate.etd}
                          </span>
                        )}
                      </div>
                      {shippingEstimate.courierName && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-brand-200/60">
                          <MapPin className="w-3 h-3 text-brand-500" />
                          <span className="text-xs text-brand-600">
                            {shippingEstimate.courierName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Street */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Street (House No, Building) *
                  </label>
                  <input
                    type="text"
                    value={orderData.shippingAddress.street}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    required
                  />
                </div>

                {/* Area */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Area *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Near Central Park"
                    value={orderData.shippingAddress.area}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          area: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    City *
                  </label>
                  <input
                    type="text"
                    value={orderData.shippingAddress.city}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          city: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    required
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    State *
                  </label>
                  <Select
                    value={orderData.shippingAddress.state}
                    onValueChange={(value) => {
                      setOrderData({
                        ...orderData,
                        shippingAddress: {
                          ...orderData.shippingAddress,
                          state: value,
                        },
                      });
                    }}
                    name="state"
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem
                          key={state}
                          value={state}
                          className="cursor-pointer border-b-1 border-border"
                        >
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  placeholder="Any special delivery instructions?"
                  rows={2}
                  value={orderData.shippingAddress.instructions}
                  onChange={(e) =>
                    setOrderData({
                      ...orderData,
                      shippingAddress: {
                        ...orderData.shippingAddress,
                        instructions: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {purchaseType == "direct" &&
              cartItems[0]?.product?.isPersonalized && <Personalized />}

            {/* Gift Options */}
            <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-7">
                <span className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                  2
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Gift Options
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Make your order extra special</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="is-gift"
                    type="checkbox"
                    checked={orderData.isGift}
                    onChange={(e) =>
                      setOrderData({ ...orderData, isGift: e.target.checked })
                    }
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="is-gift"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    This is a gift
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a gift message and gift wrap to your order
                  </p>

                  {orderData.isGift && (
                    <div className="mt-4 space-y-4 pl-1">
                      <div>
                        <label
                          htmlFor="gift-message"
                          className="block text-sm font-medium text-muted-foreground mb-1"
                        >
                          Gift Message (Optional)
                        </label>
                        <textarea
                          id="gift-message"
                          rows={2}
                          placeholder="Write a personal message..."
                          value={orderData.giftMessage}
                          onChange={(e) =>
                            setOrderData({
                              ...orderData,
                              giftMessage: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                        />
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            id="gift-wrap"
                            type="checkbox"
                            checked={orderData.giftWrap}
                            onChange={(e) =>
                              setOrderData({
                                ...orderData,
                                giftWrap: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-border rounded"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="gift-wrap"
                            className="text-sm font-medium text-muted-foreground"
                          >
                            Add Gift Wrap (₹50)
                          </label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Premium gift wrapping with a personalized message
                            card
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-7">
                <span className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                  3
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Additional Information
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Order notes and preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Order Notes */}
                <div>
                  <label
                    htmlFor="order-notes"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Order Notes (Optional)
                  </label>
                  <textarea
                    id="order-notes"
                    rows={2}
                    placeholder="Notes about your order, e.g. special delivery instructions"
                    value={orderData.notes}
                    onChange={(e) =>
                      setOrderData({ ...orderData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <h2 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-brand-600" />
                  Order Summary
                </h2>

                <OrederSummery
                  cartItems={cartItems as OrderSummaryCartItem[]}
                  type={purchaseType}
                  orderData={orderData}
                  coupon={couponCode}
                  shippingEstimate={shippingEstimate}
                />

                {/* Payment Options */}
                <div className="mt-8 space-y-4">
                  {/* Razorpay */}
                  <div className="space-y-2">
                    <SwipeButton
                      onSwipeComplete={handlePayment}
                      text="Pay Online"
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                      <Shield size={10} />
                      Secured by Razorpay
                    </p>
                  </div>

                  {/* Cash on Delivery Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full py-5 px-6 rounded-xl fw-cta transition-all border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50/50 text-foreground"
                        variant="outline"
                      >
                        Cash on Delivery
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-brand-500/30 shadow-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">
                          Confirm Cash on Delivery
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll pay when your order arrives. Please ensure your shipping address is correct.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-brand-500/30 text-foreground hover:bg-brand-500/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePayment(true)}
                          disabled={loading}
                          className="bg-brand-600 hover:bg-brand-700 text-background"
                        >
                          Confirm Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Payment Methods Icons */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {/* Visa */}
                    <img
                      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/visa.svg"
                      alt="Visa"
                      className="h-6 w-auto opacity-60 transition-all hover:opacity-100"
                      loading="lazy"
                    />
                    {/* Mastercard */}
                    <img
                      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mastercard.svg"
                      alt="Mastercard"
                      className="h-6 w-auto opacity-60 transition-all hover:opacity-100"
                      loading="lazy"
                    />
                    {/* RuPay */}
                    <svg viewBox="0 0 60 36" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" aria-label="RuPay" role="img">
                      <rect width="60" height="36" rx="6" fill="#094183" />
                      <text x="30" y="23" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold">RuPay</text>
                    </svg>
                    {/* Google Pay */}
                    <img
                      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlepay.svg"
                      alt="Google Pay"
                      className="h-6 w-auto opacity-60 transition-all hover:opacity-100"
                      loading="lazy"
                    />
                    {/* PhonePe */}
                    <img
                      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/phonepe.svg"
                      alt="PhonePe"
                      className="h-6 w-auto opacity-60 transition-all hover:opacity-100"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="bg-background rounded-xl p-5 shadow-sm border border-brand-100">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Shield, label: "Secure Payment", color: "text-green-600", bg: "bg-green-100" },
                    { icon: RotateCcw, label: "Easy Returns", color: "text-brand-600", bg: "bg-brand-100" },
                    { icon: Truck, label: "Fast Shipping", color: "text-brand-600", bg: "bg-brand-100" },
                  ].map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className="text-center">
                      <div className={`w-10 h-10 mx-auto ${bg} rounded-full flex items-center justify-center ${color} mb-1.5`}>
                        <Icon size={18} />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={alert.open}>
          <AlertDialogContent className="max-w-sm border-brand-500/30 shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{alert.title || "Alert"}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                onClick={() => setAlert({ title: "", open: false })}
                className="w-full bg-brand-600 hover:bg-brand-700 text-background"
              >
                Okay
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </div>
    </>
  );
}

const testError = (orderData: CheckoutFormData, isGuest = false) => {
  const { shippingAddress } = orderData;

  // For guest checkout, email is not required as it comes from Google Sign-In
  const requiredFields = isGuest
    ? {
        fullName: "Full Name",
        phone: "Phone Number",
        street: "Street Address",
        area: "Area/Locality",
        city: "City",
        state: "State",
        pincode: "Pincode",
      }
    : {
        fullName: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        street: "Street Address",
        area: "Area/Locality",
        city: "City",
        state: "State",
        pincode: "Pincode",
      };

  for (const [field, fieldName] of Object.entries(requiredFields) as [keyof typeof requiredFields, string][]) {
    const value = shippingAddress[field];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      toast.error(`Please enter your ${fieldName}`);
      return field;
    }
  }

  // Validate email format (only if provided or not guest)
  if (shippingAddress.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      toast.error("Please enter a valid Email Address");
      return "email";
    }
  }

  // Validate Indian phone number (10 digits, optionally starting with +91 or 91)
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const cleanPhone = String(shippingAddress.phone).replace(/[\s-]/g, "");
  if (!phoneRegex.test(cleanPhone)) {
    toast.error("Please enter a valid 10-digit Indian Phone Number");
    return "phone";
  }

  // Validate Indian pincode (6 digits)
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(String(shippingAddress.pincode))) {
    toast.error("Please enter a valid 6-digit Pincode");
    return "pincode";
  }

  return "";
};
