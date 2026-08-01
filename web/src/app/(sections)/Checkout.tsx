"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  removeCartItemByProduct,
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
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import LoadingOverlay from "@/components/comman/LoadingOverlay";
import Personalized from "@/components/product/Personalized";
import { getAuthToken } from "@/lib/cookies";
import {
  detectLocation,
  isGeolocationSupported,
  hasAutoDetectRanThisSession,
  markAutoDetectRanThisSession,
  type DetectedAddress,
} from "@/lib/geolocation";
import { openLoginModal } from "@/redux/features/uiSlice";
import { removeFromCart, setBuyNowItem } from "@/redux/features/cart";
import { useProfileBootstrap } from "@/hooks/useProfileBootstrap";
import type { CheckoutFormData, OrderSummaryCartItem, ProductData } from "@/types";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import ShippingAddressForm from "@/components/checkout/ShippingAddressForm";
import GiftOptions from "@/components/checkout/GiftOptions";
import PaymentOptions from "@/components/checkout/PaymentOptions";

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

  const [alert, setAlert] = useState<{
    title: string;
    open: boolean;
    errors?: Array<{
      productId: string;
      type: string;
      message: string;
      quantity: number;
    }>;
  }>({
    title: "",
    open: false,
  });
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [couponCode] = useState(null);

  // Geolocation auto-fill state
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationFilled, setLocationFilled] = useState(false);
  const autoDetectAttemptedRef = useRef(false);
  const geolocationSupported = isGeolocationSupported();

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

  const { data: directProduct } = useProduct(directSlug);
  const { productMap } = useProductsByIds(cartIds);

  // Build enriched cart items (merge Redux state with fetched product data)
  const cartItems = useMemo(() => {
    if (purchaseType === "direct") {
      const rawItems = Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem];
      return rawItems.map((item) => {
        const fetched = directProduct ?? undefined;
        const color = fetched?.colors?.find((c) => c._id === item.colorId);
        const variant = item.variantId
          ? fetched?.variants?.find((v) => v._id === item.variantId)
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
          quantity: variant ? variant.quantity : item.quantity,
          colorId: item.colorId ?? undefined,
          colorCode: color?.code,
          colorName: color?.name,
          isPersonalized: fetched?.isPersonalized ?? false,
          variantId: item.variantId ?? undefined,
          variantName: variant?.name ?? undefined,
          variantPrice: variant?.price ?? undefined,
        };
      });
    }
    return cartItemsState.map((item) => {
      const fetched = item.productId ? productMap.get(item.productId) : undefined;
      const color = fetched?.colors?.find((c) => c._id === item.colorId);
      return {
        _id: `${item.productId}_${item.colorId ?? ""}`,
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
        variantId: undefined,
        variantName: undefined,
        variantPrice: undefined,
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
    (total, item) =>
      total +
      (item.variantPrice != null
        ? item.variantPrice
        : (item?.product?.discount_price || item?.product?.price || 0) * item.quantity),
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

  // Merge a detected address into the form — only empty fields are filled,
  // so anything the user already typed is never clobbered.
  const applyDetectedAddress = (address: DetectedAddress) => {
    setOrderData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        pincode: prev.shippingAddress.pincode || address.pincode || "",
        city: prev.shippingAddress.city || address.city || "",
        state: prev.shippingAddress.state || address.state || "",
        area: prev.shippingAddress.area || address.area || "",
        street: prev.shippingAddress.street || address.street || "",
      },
    }));
    setLocationFilled(true);
  };

  // Auto-detect for guest checkout on entry (once per session).
  // Logged-in users skip auto-detect — their profile address takes precedence —
  // but can still use the manual "Detect Location" button.
  useEffect(() => {
    const isGuest = !isLoggedIn && !getAuthToken();
    if (!isGuest) return;
    if (hasAutoDetectRanThisSession()) return;
    if (autoDetectAttemptedRef.current) return;

    const sa = orderData.shippingAddress;
    const hasAddress = sa.pincode || sa.city || sa.street || sa.area;
    if (hasAddress) return;

    autoDetectAttemptedRef.current = true;
    markAutoDetectRanThisSession();

    // Auto-detect is silent — it must not flash the manual button's
    // "Detecting..." state, so we avoid setDetectingLocation here.
    detectLocation().then((result) => {
      // Silent no-op on all failure reasons (denied / unsupported / api / outside-india)
      if (!result.ok) return;
      applyDetectedAddress(result.address);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Manual "Detect Location" — available to everyone (guests + logged-in users).
  const handleDetectLocation = async () => {
    if (detectingLocation) return;
    setDetectingLocation(true);
    const result = await detectLocation();
    setDetectingLocation(false);

    if (!result.ok) {
      if (result.reason === "denied") {
        toast.error("Location permission denied. Please enter your address manually.");
      } else if (result.reason === "outside-india") {
        toast.error("We only deliver within India. Please enter your address manually.");
      } else if (result.reason === "unsupported") {
        toast.error("Location detection is not supported on this device.");
      } else {
        toast.error("Could not detect your location. Please try again or enter it manually.");
      }
      return;
    }

    applyDetectedAddress(result.address);
    toast.success("Location detected — address filled in. Please review it before paying.");
  };

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
    if (window.Razorpay) return true;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const loaded = await new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.crossOrigin = "anonymous";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
      if (loaded || window.Razorpay) return true;
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
            quantity: item.quantity,
            ...(item.variantId ? { variantId: item.variantId } : {}),
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
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const vpMsg = err?.response?.data?.message || err?.message || "Payment verification failed. Please contact support.";
            setAlert({
              title: vpMsg,
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
      const RazorpayConstructor = window.Razorpay!;
      const paymentObject = new RazorpayConstructor(options);
      paymentObject.open();
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ productId: string; type: string; message: string; quantity: number }>;
          };
        };
        message?: string;
      };
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      const cartErrors = err?.response?.data?.errors;
      setAlert({
        title: serverMessage,
        open: true,
        ...(Array.isArray(cartErrors) && cartErrors.length > 0
          ? { errors: cartErrors }
          : {}),
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolve the product slug for an error item — prefers the enriched cart
  // item, falls back to the Buy Now selection (direct purchases).
  const getProductSlug = (productId: string): string | null => {
    const found = cartItems.find(
      (item) => item.product?._id === productId,
    );
    if (found?.product?.slug) return found.product.slug;
    if (buyNowItem?.productId === productId && buyNowItem.slug) {
      return buyNowItem.slug;
    }
    return null;
  };

  // "Back to product" — used when a Buy Now variant becomes unavailable. The
  // item lives in buyNowItem, not the cart, so the cart-only Remove action is
  // meaningless here; instead, send the user to re-pick an offer.
  const handleBackToProduct = (productId: string) => {
    const slug = getProductSlug(productId);

    // Clear the stale Buy Now selection so checkout doesn't retry the dead
    // variant if the user returns or refreshes.
    dispatch(
      setBuyNowItem({
        productId: null,
        slug: null,
        quantity: 1,
        colorId: null,
        variantId: null,
        variantName: null,
      }),
    );
    setAlert({ title: "", open: false, errors: undefined });

    // Use replace, not push: the checkout entry was cleared, so browser Back
    // must not return to a dead direct checkout.
    if (slug) {
      router.replace(`/product-details/${slug}`);
    } else {
      router.replace("/");
    }
  };

  // Handle removing an invalid item from cart
  const handleRemoveInvalidItem = async (productId: string) => {
    if (removingItems.has(productId)) return;
    setRemovingItems((prev) => new Set(prev).add(productId));

    try {
      // Find colorId from Redux cart state
      const cartItem = cartItemsState.find(
        (item) => item.productId === productId,
      );

      // Dispatch Redux remove first (instant UI update)
      dispatch(
        removeFromCart({
          productId,
          colorId: cartItem?.colorId ?? null,
        }),
      );

      // Sync with server
      await removeCartItemByProduct(productId, cartItem?.colorId ?? undefined);

      toast.success("Item removed from cart");

      // Check if all items were removed
      const remainingCount = cartItemsState.length - 1;
      if (remainingCount <= 0) {
        setAlert({ title: "", open: false });
      }
    } catch {
      toast.error("Failed to remove item. Please try again.");
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  return (
    <>
      <LoadingOverlay hidden={loading} />

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
            <ShippingAddressForm
              orderData={orderData}
              setOrderData={setOrderData}
              showAddressPrompt={showAddressPrompt}
              setShowAddressPrompt={setShowAddressPrompt}
              loadProfileAddress={loadProfileAddress}
              shippingEstimate={shippingEstimate}
              isFetching={isFetching}
              onCheckPincode={() => refetch()}
              geolocationSupported={geolocationSupported}
              detectingLocation={detectingLocation}
              locationFilled={locationFilled}
              onDetectLocation={handleDetectLocation}
              isLoggedIn={isLoggedIn}
              onEmailClick={() => {
                sessionStorage.setItem("checkoutOrderData", JSON.stringify(orderData));
                localStorage.setItem("googleLoginReturnTo", `/checkout?type=${purchaseType}`);
                setTimeout(() => {
                  dispatch(openLoginModal());
                }, 300);
              }}
            />

            {purchaseType == "direct" &&
              cartItems[0]?.product?.isPersonalized && <Personalized />}

            <GiftOptions
              isGift={orderData.isGift}
              giftMessage={orderData.giftMessage}
              giftWrap={orderData.giftWrap}
              onGiftChange={(v) => setOrderData({ ...orderData, isGift: v })}
              onMessageChange={(v) => setOrderData({ ...orderData, giftMessage: v })}
              onWrapChange={(v) => setOrderData({ ...orderData, giftWrap: v })}
            />

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

                <PaymentOptions
                  onPayOnline={() => handlePayment(false)}
                  onCashOnDelivery={() => handlePayment(true)}
                  loading={loading}
                />
            </div>
          </div>
        </div>
        </div>

        <AlertDialog open={alert.open} onOpenChange={(open) => !open && setAlert({ title: "", open: false })}>
          <AlertDialogContent className="w-[95vw] sm:max-w-md border-brand-500/30 shadow-xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                {alert.errors && alert.errors.length > 0 ? (
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                ) : null}
                <AlertDialogTitle className="text-foreground">
                  {alert.title || "Alert"}
                </AlertDialogTitle>
              </div>
            </AlertDialogHeader>

            {alert.errors && alert.errors.length > 0 ? (
              <div className="space-y-3 py-2">
                {alert.errors.some((e) => e.type === "invalid_variant") ? (
                  <p className="text-sm text-muted-foreground">
                    A selected offer is no longer available. Head back to the product page to pick another option.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The following items in your cart have issues. You can remove them and continue with the remaining items.
                  </p>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alert.errors.map((itemErr) => {
                    const isInvalidVariant = itemErr.type === "invalid_variant";
                    return (
                      <div
                        key={itemErr.productId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {itemErr.message}
                          </p>
                        </div>
                        {isInvalidVariant ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBackToProduct(itemErr.productId)}
                            className="flex-shrink-0 text-brand-600 hover:text-brand-700 border-brand-600/30 hover:border-brand-600/50"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="ml-1.5">Back to product</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveInvalidItem(itemErr.productId)}
                            disabled={removingItems.has(itemErr.productId)}
                            className="flex-shrink-0 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                          >
                            {removingItems.has(itemErr.productId) ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Remove</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.errors.some((e) => e.type === "invalid_variant")
                    ? "Choose a different offer on the product page, then try again."
                    : "After removing items, you can try placing the order again."}
                </p>
              </div>
            ) : null}

            <AlertDialogFooter className={alert.errors && alert.errors.length > 0 ? "border-t pt-4 mt-2" : ""}>
              <Button
                onClick={() => setAlert({ title: "", open: false, errors: undefined })}
                variant={alert.errors && alert.errors.length > 0 ? "outline" : "default"}
                className={
                  alert.errors && alert.errors.length > 0
                    ? ""
                    : "w-full bg-brand-600 hover:bg-brand-700 text-background"
                }
              >
                {alert.errors && alert.errors.length > 0 ? "Close" : "Okay"}
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
