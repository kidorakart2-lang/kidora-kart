"use client";
import { cache, useEffect, useState } from "react";
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
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";
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
import type { CheckoutFormData, OrderSummaryCartItem } from "@/types";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function Checkout() {
  const searchParams = useSearchParams();
  const [alert, setAlert] = useState({
    title: "",
    open: false,
  });
  const [couponCode, setCouponCode] = useState(null);

  const logo = useSelector((state: RootState) => state.logo.logo);
  const purchaseType = searchParams.get("type") || "cart";
  const buyNowItem = useSelector((state: RootState) => state.cart.buyNowItem);
  const cartItemsState = useSelector((state: RootState) => state.cart.cartItems);

  const cartItems =
    purchaseType === "direct"
      ? Array.isArray(buyNowItem)
        ? buyNowItem
        : [buyNowItem]
      : cartItemsState;

  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: RootState) => state.auth.details);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLogin);

  useEffect(() => {
    if (!purchaseType) {
      router.push("/checkout?type=cart");
    }
  }, [purchaseType]);

  const totalAmount = cartItems?.reduce(
    (total, item) => total + item?.product?.discount_price * item.quantity,
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
        pincode: user?.address?.pincode || "",
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

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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

      const orderPayload = {
        purchaseType,
        ...orderData,
        ...(purchaseType == "direct" && { items: cartItems }),
        isCodAdvance,
      };

      const createOrderResponse = await createOrder(orderPayload);
      const { orderId } = createOrderResponse.order;

      const razorpayResponse = await createRazorpayOrder(orderId, isCodAdvance);
      const { razorpayOrderId, amount, currency, keyId } = razorpayResponse;

      const res = await loadRazorpayScript();
      if (!res) {
        setAlert({
          title:
            "Razorpay failed to load. Please check your internet connection.",
          open: true,
        });
        return;
      }

      const options = {
        key: keyId,
        amount: amount * 100, // Amount in paise
        currency: currency,
        name: "Jewellery walla",
        description: `Order #${orderId}`,
        image: logo || "/images/logo.webp", // Your logo
        order_id: razorpayOrderId,
        prefill: {
          name: orderData.shippingAddress.fullName,
          email: orderData.shippingAddress.email,
          contact: orderData.shippingAddress.phone,
        },
        theme: {
          color: "#dfbf0eff",
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

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text ">
          Complete Your Order
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Billing */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  Shipping Information
                </h2>
              </div>

              {/* Saved Address Prompt */}
              {showAddressPrompt && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-amber-900">
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
                      className="flex-1 sm:flex-none border-amber-300 hover:bg-amber-100"
                    >
                      Keep Current
                    </Button>
                    <Button
                      size="sm"
                      onClick={loadProfileAddress}
                      className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Use Profile Address
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">+91</span>
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
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Pincode *
                  </label>
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    maxLength={6}
                    required
                  />
                </div>

                {/* Street */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>

                {/* Area */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
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
                          className="cursor-pointer border-b-1 border-gray-300"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {purchaseType == "direct" &&
              cartItems[0]?.product?.isPersonalized && <Personalized />}

            {/* Gift Options */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                  2
                </span>
                Gift Options
              </h2>

              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="is-gift"
                    type="checkbox"
                    checked={orderData.isGift}
                    onChange={(e) =>
                      setOrderData({ ...orderData, isGift: e.target.checked })
                    }
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="is-gift"
                    className="text-sm font-medium text-gray-700"
                  >
                    This is a gift
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add a gift message and gift wrap to your order
                  </p>

                  {orderData.isGift && (
                    <div className="mt-4 space-y-4 pl-1">
                      <div>
                        <label
                          htmlFor="gift-message"
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
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
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="gift-wrap"
                            className="text-sm font-medium text-gray-700"
                          >
                            Add Gift Wrap (₹50)
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                  3
                </span>
                Additional Information
              </h2>

              <div className="space-y-4">
                {/* Order Notes */}
                <div>
                  <label
                    htmlFor="order-notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <OrederSummery
                  cartItems={cartItems as OrderSummaryCartItem[]}
                  type={purchaseType}
                  orderData={orderData}
                  coupon={couponCode}
                />

                {/* Payment Button */}
                <div className="mt-6">
                  <HoldToConfirmButton
                    loading={loading}
                    onConfirm={handlePayment}
                    duration={1200}
                    label="Pay Online With Razorpay"
                    confirmLabel="Loading Payment..."
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all"
                  />

                  {
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full mt-4 py-5 px-6 rounded-xl font-semibold  transition-all border-2 border-amber-500"
                          variant="outline"
                        >
                          Purchase With Cash On delivery
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Do you want to Continue?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Purchase The Item With Cash ON delivery , Please
                            Click On Continue To Complete Order
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePayment(true)}
                            disabled={loading}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  }
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 38 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                        fill="#FF5F00"
                      />
                      <path
                        d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z"
                        fill="#EB001B"
                      />
                      <path
                        d="M35 1H17v22h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"
                        fill="#F79E1B"
                      />
                    </svg>
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 38 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                        fill="#1976D2"
                      />
                      <path
                        d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z"
                        fill="#03A9F4"
                      />
                      <path
                        d="M35 1H17v22h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"
                        fill="#4CAF50"
                      />
                      <path
                        d="M35 1H17v22h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"
                        fill="#F44336"
                      />
                      <path
                        d="M35 1H17v22h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"
                        fill="#FFC107"
                      />
                    </svg>
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 38 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                        fill="#5C2D91"
                      />
                      <path
                        d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z"
                        fill="#7B3F84"
                      />
                      <path
                        d="M35 1H17v22h18c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"
                        fill="#00AAE4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-4 flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Secure Payment</p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Genuine Products</p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 00.9-1.45l-1.33-2.67A3 3 0 0010.5 9h3.5a1 1 0 00.9-1.45l-1.33-2.67A3 3 0 0012.5 3H3z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Free Shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={alert.open}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{alert.title || "Alert"}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                onClick={() => setAlert({ title: "", open: false })}
                className="w-full"
              >
                Okay
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
