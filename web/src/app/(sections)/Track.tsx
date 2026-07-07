"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getOrderById, retryPayment, verifyPayment } from "@/lib/orderService";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingUi } from "./Cart";
import { motion } from "motion/react";
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  XCircle,
  Gift,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderTrackingResponse } from "@/types";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState<string>("");
  const [orderDetails, setOrderDetails] = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setOrderId(searchParams?.get("orderId") || "");
  }, [searchParams]);

  const loadRazorpayScript = async (): Promise<boolean> => {
    for (let i = 0; i < 2; i++) {
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      const loaded = await new Promise<boolean>((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });
      if (loaded || (window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  };

  const handleRetryPayment = async () => {
    setRetryLoading(true);
    try {
      const orderIdVal = orderDetails?.order?.orderId;
      if (!orderIdVal) return;

      const retryRes = await retryPayment(orderIdVal);
      if (!retryRes.success) {
        toast.error(retryRes.message || "Failed to retry payment");
        setRetryLoading(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = retryRes;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway could not be loaded. Please try again or use a different payment method.");
        setRetryLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: currency,
        name: "Jewellery walla",
        description: `Order #${orderIdVal}`,
        order_id: razorpayOrderId,
        prefill: {
          name: orderDetails?.order?.shippingAddress?.fullName,
          email: orderDetails?.order?.shippingAddress?.email,
          contact: orderDetails?.order?.shippingAddress?.phone,
        },
        theme: { color: "#dfbf0eff" },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          setRetryLoading(true);
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderIdVal,
            });
            if (verifyRes.success) {
              toast.success("Payment successful!");
              fetchOrder();
            } else {
              toast.error(verifyRes.message || "Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setRetryLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRetryLoading(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const paymentObject = new RazorpayConstructor(options);
      paymentObject.open();
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
      setRetryLoading(false);
    }
  };

  const handleTrackOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (orderNumber.trim()) {
      setOrderId(orderNumber);
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId) as OrderTrackingResponse & { success?: boolean };
      if (data?.success === false) {
        setOrderDetails(null);
      } else {
        setOrderDetails(data);
      }
    } catch {
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5" />;
      case "shipped":
        return <Truck className="w-5 h-5" />;
      case "delivered":
        return <Package className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      case "payment_failed":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean, isCompleted: boolean) => {
    if (status === "cancelled") {
      return "bg-destructive text-destructive-foreground";
    }
    if (status === "payment_failed") {
      return "bg-destructive text-destructive-foreground";
    }
    if (isActive) {
      return "bg-brand-500 text-background";
    }
    if (isCompleted) {
      return "bg-emerald-500 text-background";
    }
    return "bg-muted text-muted-foreground";
  };

  const getProgressWidth = (status: string) => {
    if (status === "cancelled") return "0%";
    if (status === "pending") return "0%";
    if (status === "confirmed") return "33%";
    if (status === "shipped") return "66%";
    if (status === "delivered") return "100%";
    return "0%";
  };
  console.log(orderDetails);

  if (loading) {
    return <LoadingUi hidden={loading} />;
  }

  if (!orderDetails) {
    return (
      <div className="min-h-[50vh] p-4 md:p-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find an order with that ID. Please check and try again.
          </p>
          <Button onClick={() => setOrderId("")} className="btn-gradient">
            Try Another Order
          </Button>
        </motion.div>
      </div>
    );
  }

  const isCancelled =
    orderDetails?.order?.status === "cancelled" ||
    orderDetails?.order?.status === "refunded";
  const isDelivered = orderDetails?.order?.status === "delivered";
  const isPaymentFailed = orderDetails?.order?.status === "payment_failed";

  return (
    <div className="min-h-[50vh] p-4 md:p-10">
      {orderId == "" || !orderId ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground font-sans mb-6">
            Enter your order details to see its current status. <br />
            <span className="text-brand-500 text-sm">
              or You Can Check your order status in Profile
            </span>
          </p>

          <div className="bg-background rounded-xl shadow-md p-6 mb-10">
            <div className="mb-4">
              <Label className="block text-muted-foreground font-medium mb-1">
                Order Number
              </Label>
              <Input
                type="text"
                placeholder="ORD-1234567890-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              onClick={handleTrackOrder}
              className="btn-gradient font-semibold px-6 py-2 rounded-lg"
            >
              Track Order
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Order Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl shadow-lg overflow-hidden ${
              isCancelled
                ? "bg-gradient-to-r from-destructive to-destructive/80"
                : isDelivered
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : isPaymentFailed
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-gradient-to-r from-brand-500 to-brand-600"
            } p-6 text-background`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Order #{orderDetails?.order?.orderId}
                </h1>
                <p className="text-background/90 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Placed on{" "}
                  {new Date(orderDetails?.order?.createdAt ?? "").toLocaleDateString(
                    "en-IN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
              {isCancelled && (
                <div className="bg-background/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Order Cancelled
                  </p>
                </div>
              )}
              {isDelivered && (
                <div className="bg-background/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Delivered Successfully
                  </p>
                </div>
              )}
              {isPaymentFailed && (
                <div className="bg-background/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Payment Failed
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="bg-background rounded-xl shadow-lg overflow-hidden">
            {/* Order Status Timeline */}
            {!isCancelled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`p-6 border-b ${isPaymentFailed ? "opacity-50" : ""}`}
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Order Status
                </h2>
                <div className="relative">
                  {/* Desktop Timeline */}
                  <div className="hidden md:block">
                    <div className="flex items-center justify-between mb-8 relative">
                      {/* Progress Line */}
                      <div className="absolute top-5 left-0 right-0 h-1 bg-muted mx-5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: getProgressWidth(
                              orderDetails?.order?.status ?? "pending"
                            ),
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-emerald-500"
                        />
                      </div>

                      {/* Status Points */}
                      {["pending", "confirmed", "shipped", "delivered"].map(
                        (status, index) => {
                          const statusItem =
                            orderDetails?.order?.statusHistory.find(
                              (s) => s.status === status
                            );
                          const isActive = !!(
                            statusItem &&
                            statusItem.status === orderDetails?.order?.status
                          );
                          const isCompleted =
                            orderDetails?.order?.statusHistory.some(
                              (s) => s.status === status
                            ) ?? false;

                          return (
                            <motion.div
                              key={status}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex flex-col items-center relative z-10"
                            >
                              <motion.div
                                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${getStatusColor(
                                  status,
                                  isActive,
                                  isCompleted
                                )}`}
                              >
                                {getStatusIcon(status)}
                              </motion.div>
                              <span className="text-sm font-medium mt-2 capitalize">
                                {status}
                              </span>
                              {statusItem && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {new Date(
                                    statusItem.timestamp
                                  ).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Mobile Timeline */}
                  <div className="md:hidden space-y-4">
                    {["pending", "confirmed", "shipped", "delivered"].map(
                      (status, index) => {
                        const statusItem =
                          orderDetails?.order?.statusHistory.find(
                            (s) => s.status === status
                          );
                        const isActive = !!(
                          statusItem &&
                          statusItem.status === orderDetails?.order?.status
                        );
                        const isCompleted =
                          orderDetails?.order?.statusHistory.some(
                            (s) => s.status === status
                          ) ?? false;

                        return (
                          <motion.div
                            key={status}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-center gap-4"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(
                                status,
                                isActive,
                                isCompleted
                              )}`}
                            >
                              {getStatusIcon(status)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium capitalize">{status}</p>
                              {statusItem && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    statusItem.timestamp
                                  ).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cancelled Status */}
            {isCancelled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 border-b bg-destructive/10"
              >
                <div className="flex items-center gap-4 text-destructive">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Order Cancelled</h3>
                    <p className="text-sm text-destructive">
                      This order was cancelled on{" "}
                      {new Date(
                        orderDetails?.order?.statusHistory?.find(
                          (s) => s.status === "cancelled"
                        )?.timestamp || orderDetails?.order?.updatedAt
                      ).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Failed */}
            {isPaymentFailed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mx-6 mt-6"
              >
                <div className="p-6 bg-destructive/5 border-2 border-destructive/20 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-destructive mb-1">
                        Payment Failed
                      </h3>
                      <p className="text-sm text-destructive/80 mb-4">
                        Your payment for this order was unsuccessful. You can retry the payment to complete your order.
                      </p>
                      <Button
                        onClick={handleRetryPayment}
                        disabled={retryLoading}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        {retryLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Delivered Badge */}
            {isDelivered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-50 border-l-4 border-emerald-500 mx-6 mt-6 rounded-r-lg"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">
                      Delivered On:
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {new Date(
                      orderDetails?.order?.statusHistory?.find(
                        (s) => s.status === "delivered"
                      )?.timestamp ?? ""
                    ).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 border-b"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-4">
                {orderDetails?.order?.items?.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 p-2 bg-muted rounded-lg hover:bg-muted transition"
                  >
                    <Link href={`/product-details/${item.productId.slug}`}>
                      <div className="w-24 h-24 bg-background rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                        <Image
                          src={item.images?.[0] || "/placeholder.jpg"}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-lg font-semibold text-brand-600">
                          ₹{item.priceAtPurchase.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <span className="">Color :</span>{" "}
                        <span
                          style={{
                            backgroundColor: `${item?.colorId?.code}`,
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            display: "inline-block",
                            marginRight: "5px",
                          }}
                        ></span>{" "}
                        {item?.colorId?.name}
                      </p>
                      {item?.sizeId && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="">Size :</span> {item?.sizeId?.name}
                        </p>
                      )}
                      {item.isPersonalized && item.personalizedName && (
                        <p className="text-sm text-muted-foreground mt-2 bg-brand-50 px-2 py-1 rounded inline-block">
                          <span className="font-medium">Personalized:</span>{" "}
                          <span className="text-brand-600">
                            {item.personalizedName}
                          </span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {orderDetails?.order?.isGift && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-brand-accent-50 border-l-4 border-brand-accent-400 rounded-r-lg"
                >
                  <div className="flex items-start gap-2">
                    <Gift className="w-5 h-5 text-brand-accent-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-brand-accent-900">Gift Order</p>
                      {orderDetails?.order?.giftMessage && (
                        <p className="text-sm text-brand-accent-700 mt-1">
                          <span className="font-medium">Message:</span>{" "}
                          {orderDetails?.order?.giftMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            {/* payment method */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-6 border-b bg-muted"
            >
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Details</span>
                  <span className="font-medium">
                    {orderDetails?.order?.payment?.method}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Status</span>
                  <span className="font-medium">
                    {orderDetails?.order?.payment?.status}
                  </span>
                </div>
                {orderDetails?.order?.payment?.codAdvance && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment In Advane</span>
                    <span className="font-medium">
                      ₹{orderDetails?.order?.pricing?.advance}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
            {/* Refund Status */}
            {orderDetails?.order?.status === "cancelled" &&
              orderDetails?.order?.cancellation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background p-4 rounded-lg shadow-sm border border-border mb-6"
                >
                  <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    Order Cancellation Details
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cancellation Reason:
                      </span>
                      <span className="font-medium">
                        {orderDetails.order.cancellation.reason ||
                          "Not specified"}
                      </span>
                    </div>
                    {/* {orderDetails.order.cancellation.cancelledBy !== "customer" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cancelled By:</span>
                        <span className="font-medium capitalize">
                          {orderDetails.order.cancellation.cancelledBy}
                        </span>
                      </div>
                    )} */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled On:</span>
                      <span className="font-medium">
                        {new Date(
                          orderDetails.order.cancellation.cancelledAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    {orderDetails.order.cancellation.refundStatus && (
                      <>
                        <div className="border-t border-border my-3"></div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Refund Status:</span>
                          <span
                            className={`font-medium ${
                              orderDetails.order.cancellation.refundStatus ===
                              "completed"
                                ? "text-emerald-600"
                                : orderDetails.order.cancellation
                                    .refundStatus === "failed"
                                ? "text-destructive"
                                : "text-brand-600"
                            }`}
                          >
                            {orderDetails.order.cancellation.refundStatus
                              .charAt(0)
                              .toUpperCase() +
                              orderDetails.order.cancellation.refundStatus.slice(
                                1
                              )}
                          </span>
                        </div>

                        {orderDetails.order.cancellation.refundAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Refund Amount:
                            </span>
                            <span className="font-medium">
                              ₹
                              {orderDetails.order.cancellation.refundAmount.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        )}

                        {orderDetails.order.cancellation.refundedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Refund Processed On:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                orderDetails.order.cancellation.refundedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {orderDetails.order.cancellation.refundError && (
                          <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded">
                            <span className="font-medium">Refund Error:</span>{" "}
                            {orderDetails.order.cancellation.refundError}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-6 border-b bg-muted"
            >
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ₹
                    {orderDetails?.order?.pricing?.subtotal?.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium">
                    ₹
                    {orderDetails?.order?.pricing?.shipping?.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
                {orderDetails?.order?.pricing?.discount?.amount != null &&
                  orderDetails.order.pricing.discount.amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">
                      -₹
                      {orderDetails?.order?.pricing?.discount?.amount?.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                )}
                {orderDetails?.order?.payment?.codAdvance && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Amount Left</span>
                    <span className="font-medium">
                      ₹
                      {orderDetails?.order?.pricing.total -
                        orderDetails?.order?.pricing.advance}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-border">
                  <span>Total</span>
                  <span className="text-brand-600">
                    ₹
                    {orderDetails?.order?.pricing?.total?.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </h2>
                  <div className="bg-muted p-4 rounded-lg">
                    <address className="not-italic text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">
                        {orderDetails?.order?.shippingAddress?.fullName}
                      </p>
                      <p>{orderDetails?.order?.shippingAddress?.street}</p>
                      <p>{orderDetails?.order?.shippingAddress?.area}</p>
                      <p>
                        {orderDetails?.order?.shippingAddress?.city},{" "}
                        {orderDetails?.order?.shippingAddress?.state}
                      </p>
                      <p>
                        India - {orderDetails?.order?.shippingAddress?.pincode}
                      </p>
                      <p className="mt-3 pt-3 border-t border-border">
                        <span className="font-medium">Phone:</span>{" "}
                        {orderDetails?.order?.shippingAddress?.phone}
                      </p>
                    </address>
                  </div>
                </div>

                {!isDelivered && !isCancelled && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Delivery Information
                    </h2>
                    <div className="space-y-3">
                      {orderDetails?.order?.shippingAddress?.instructions && (
                        <div className="bg-brand-50 p-4 rounded-lg border-l-4 border-brand-400">
                          <p className="text-sm font-medium text-brand-900 mb-1">
                            Delivery Instructions
                          </p>
                          <p className="text-sm text-brand-700">
                            {orderDetails?.order?.shippingAddress?.instructions}
                          </p>
                        </div>
                      )}

                      <div className="bg-brand-50 p-4 rounded-lg border-l-4 border-brand-400">
                        <p className="text-sm font-medium text-brand-900 mb-1">
                          Package ID
                        </p>
                        <p className="text-sm text-brand-700 font-mono">
                          {orderDetails?.order?.packageId}
                        </p>
                      </div>


                    </div>
                  </div>
                )}

{/* Customer's own order note */}
{orderDetails?.order?.notes?.customer && (
  <div className="bg-brand-accent-50 p-4 rounded-lg border-l-4 border-brand-accent-400">
    <p className="text-sm font-medium text-brand-accent-900 mb-1">
      Your Note
    </p>
    <p className="text-sm text-brand-accent-700">
      {orderDetails?.order?.notes?.customer}
    </p>
  </div>
)}
              </div>
            </motion.div>
          </div>

          {/* Track Another Order Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-background rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Track Another Order</h2>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="text"
                placeholder="Enter Order Number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="flex-1 min-w-[200px] border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button
                onClick={handleTrackOrder}
                className="bg-brand-500 hover:bg-brand-600 text-background font-semibold px-6 py-2 rounded-lg transition"
              >
                Track Order
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
