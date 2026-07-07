"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Package,
  ShoppingBag,
  ArrowRight,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  Gift,
  Mail,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/lib/orderService";
import { OrderData, OrderItem } from "@/types/order";

function ConfettiBurst() {
  const colors = [
    "bg-brand-500",
    "bg-brand-accent-500",
    "bg-green-500",
    "bg-brand-500",
    "bg-brand-accent-700",
    "bg-brand-accent-500",
    "bg-brand-400",
  ];
  const particles = Array.from({ length: 30 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const color = colors[i % colors.length];
        const x = 40 + Math.random() * 20;
        const delay = Math.random() * 0.5;
        const duration = 1 + Math.random() * 1.5;
        const size = 4 + Math.random() * 8;
        const rotation = Math.random() * 360;

        return (
          <motion.div
            key={i}
            className={`absolute ${color} rounded-sm`}
            style={{
              width: size,
              height: size * 0.6,
              left: `${x}%`,
              top: "50%",
              rotate: rotation,
            }}
            initial={{ y: 0, opacity: 1 }}
            animate={{
              y: -100 - Math.random() * 200,
              x: (Math.random() - 0.5) * 120,
              opacity: 0,
              rotate: rotation + 360 + Math.random() * 720,
            }}
            transition={{
              duration,
              delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        );
      })}
    </div>
  );
}

function OrderItemsList({ items }: { items: OrderItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {items.slice(0, 3).map((item, i) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 + i * 0.08 }}
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          onClick={() =>
            setExpandedId(expandedId === item._id ? null : item._id)
          }
        >
          <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
            {item.images?.[0] && (
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>Qty: {item.quantity}</span>
              {item.sizeId?.name && <span>Size: {item.sizeId.name}</span>}
              {item.colorId?.name && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-border inline-block"
                    style={{ backgroundColor: item.colorId.code }}
                  />
                  {item.colorId.name}
                </span>
              )}
            </div>
            {item.isPersonalized && item.personalizedName && (
              <Badge
                variant="outline"
                className="mt-1 text-[10px] h-5 px-1.5 text-brand-700 border-brand-200 bg-brand-50/50"
              >
                <Gift className="w-2.5 h-2.5 mr-1" />
                {item.personalizedName}
              </Badge>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-foreground">
              ₹{item.priceAtPurchase * item.quantity}
            </p>
            <p className="text-[10px] text-muted-foreground">
              ₹{item.priceAtPurchase} ea
            </p>
          </div>
        </motion.div>
      ))}
      {items.length > 3 && (
        <button
          onClick={() => setExpandedId("all")}
          className="w-full text-center text-xs text-brand-600 hover:text-brand-700 font-medium py-1.5 hover:bg-brand-50/50 rounded-lg transition-colors"
        >
          +{items.length - 3} more items
        </button>
      )}
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const steps = [
    { key: "placed", label: "Placed", icon: Check },
    { key: "confirmed", label: "Confirmed", icon: Check },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Check },
  ];

  const statusOrder = [
    "placed",
    "confirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];
  const currentIndex = statusOrder.indexOf(status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {steps.map((step, i) => {
        const isCompleted = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? "bg-brand-500 text-background shadow-md shadow-brand-500/30"
                    : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-4 ring-brand-500/20" : ""}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <p
                className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                  isCompleted ? "text-brand-700" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-1.5rem] transition-colors duration-500 ${
                  i < activeIndex ? "bg-brand-400" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function estimatedDelivery(createdAt: string) {
  try {
    const orderDate = new Date(createdAt);
    const estimated = new Date(orderDate);
    estimated.setDate(estimated.getDate() + 5 + Math.floor(Math.random() * 3));
    return estimated.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "5-7 business days";
  }
}

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const packageId = searchParams.get("packageId");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [playAudio, setPlayAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (order) {
      setPlayAudio(true);
    }
  }, [order]);

  useEffect(() => {
    if (!audioRef.current) return;
    const playAudioNow = async () => {
      try {
        await audioRef.current?.play();
      } catch (err) {
      }
    };

    playAudioNow();

    const handleFirstInteraction = () => {
      playAudioNow();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [playAudio]);

  const loadOrder = async (id: string) => {
    try {
      const response = await getOrderById(id);
      setOrder(response.order);
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/80 via-background to-brand-50/30">
      {playAudio && (
        <audio
          ref={audioRef}
          autoPlay
          loop={false}
          onEnded={() => audioRef.current?.pause()}
        >
          <source src="/order.mp3" type="audio/mp3" />
        </audio>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-2xl">
        {/* Success Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex mb-5">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-50 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20">
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(217, 119, 6, 0.5)",
                    "0 0 0 18px rgba(217, 119, 6, 0)",
                    "0 0 0 0 rgba(217, 119, 6, 0)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Check className="w-11 h-11 text-background" strokeWidth={3.5} />
                </motion.div>
              </motion.div>
            </div>
            <ConfettiBurst />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-2"
          >
            Order Placed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-3"
          >
            Thank you for your purchase
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="bg-brand-500/10 text-brand-700 border-brand-200/50 px-3 py-1 text-xs font-mono">
              #{orderId}
            </Badge>
          </motion.div>
        </motion.div>



        {/* Order Timeline */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg shadow-brand-500/5 transition-all hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-foreground text-sm">
                    Order Progress
                  </h3>
                </div>
                <OrderTimeline status={order.status} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Package ID */}
        {packageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg shadow-brand-500/5 bg-gradient-to-br from-brand-50/80 via-brand-50/30 to-white overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5">
              <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-600" />
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/30">
                    <Package className="w-5 h-5 text-background" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Package ID
                    </p>
                    <p className="text-lg font-mono font-bold text-brand-700 tracking-wide">
                      {packageId}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-brand-500/5 text-brand-600 border-brand-200/50 text-[10px]"
                  >
                    Trackable
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Summary */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg shadow-brand-500/5 transition-all hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-brand-600" />
                    <h3 className="font-semibold text-foreground text-sm">
                      Your Items
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <OrderItemsList items={order.items} />

                <Separator className="my-4" />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-muted-foreground">
                      ₹{order.pricing.subtotal}
                    </span>
                  </div>
                  {order.pricing.discount?.amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Discount</span>
                      <span className="text-emerald-600">
                        -₹{order.pricing.discount.amount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
<span className="text-muted-foreground">
                      {order.pricing.shipping > 0
                        ? `₹${order.pricing.shipping}`
                        : "Free"}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-xl text-foreground">
                      ₹{order.pricing.total}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    Payment:{" "}
                    <span className="font-medium text-muted-foreground">
                      {order.payment.method === "COD"
                        ? "Cash on Delivery"
                        : order.payment.method}
                    </span>
                  </span>
                  {order.payment.codAdvance && order.pricing.advance > 0 && (
                    <span className="ml-auto text-brand-600 font-medium">
                      Advance: ₹{order.pricing.advance}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Delivery Address */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg shadow-brand-500/5 transition-all hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-foreground text-sm">
                    Delivery Address
                  </h3>
                  <span className="ml-auto text-xs text-brand-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est: {estimatedDelivery(order.createdAt)}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="font-medium text-foreground text-sm">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.shippingAddress.street},{" "}
                    {order.shippingAddress.area}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state} -{" "}
                    {order.shippingAddress.pincode}
                  </p>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {order.shippingAddress.phone}
                    </span>
                    {order.shippingAddress.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {order.shippingAddress.email}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gift Message */}
        {order?.isGift && order?.giftMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg shadow-brand-500/5 bg-gradient-to-br from-brand-accent-50/50 to-white transition-all hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-brand-accent-600" />
                  <h3 className="font-semibold text-foreground text-sm">
                    Gift Message
                  </h3>
                </div>
                <div className="bg-background/80 rounded-lg p-4 border border-brand-accent-200/50 italic text-muted-foreground text-sm">
                  &ldquo;{order.giftMessage}&rdquo;
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={() => (window.location.href = "/profile?tab=orders")}
            variant="outline"
            className="h-12 text-base font-medium group border-brand-300 text-brand-700 hover:bg-brand-50"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            View My Orders
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="gradientOutline"
            className="h-12 text-base font-medium"
          >
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
