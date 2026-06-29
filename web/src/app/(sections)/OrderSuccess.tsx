"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Package,
  ShoppingBag,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrderById } from "@/lib/orderService";
import { OrderData } from "@/types/order";

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const deliveryOTP = searchParams.get("otp");
  const packageId = searchParams.get("packageId");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [playAudio, setPlayAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  // Handle audio playback — play only after order data resolves (P18)
  useEffect(() => {
    if (order) {
      setPlayAudio(true);
    }
  }, [order]);

  useEffect(() => {
    if (!audioRef.current) return;
    // Some browsers require user interaction before playing audio
    const playAudioNow = async () => {
      try {
        await audioRef.current?.play();
      } catch (err) {
      }
    };

    // Try to play immediately
    playAudioNow();

    // Some browsers require user interaction first
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-green-600 via-white to-gray-50">
      {/* audio: lazy loaded (P18) */}
      {playAudio && (
        <audio
          ref={audioRef}
          autoPlay
          loop={false}
          onEnded={() => audioRef.current?.pause()}
        >
          <source src="/order.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      )}
      {/* Top Green Section with Pattern */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-green-600 to-green-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-4 border-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-32 h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 left-1/3 w-24 h-24 border-4 border-white rounded-full"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Icon with Green Background */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.8,
          }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(34, 197, 94, 0.7)",
                    "0 0 0 20px rgba(34, 197, 94, 0)",
                    "0 0 0 0 rgba(34, 197, 94, 0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              >
                <Check className="w-14 h-14 text-white" strokeWidth={4} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Order Successful!
          </h1>
          <p className="text-green-100 text-lg mb-3">
            Your order has been placed
          </p>
          <Badge className="bg-white/20 backdrop-blur text-white border-white/30 px-4 py-1.5 text-sm">
            Order ID: {orderId}
          </Badge>
        </motion.div>

        {/* OTP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4"
        >
          <Card className="border-0 mt-10 shadow-xl bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Delivery OTP
              </CardTitle>
              <CardDescription className="text-sm">
                Share this with delivery person
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              <motion.div
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 text-5xl font-bold text-center py-5 rounded-xl mb-4 tracking-widest"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {deliveryOTP || "----"}
              </motion.div>
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-green-600" />
                  <span>Email sent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Package ID Card */}
        {packageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-4"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Package ID
                    </h3>
                    <p className="text-xl font-mono font-bold text-orange-700">
                      {packageId}
                    </p>
                  </div>
                </div>
                <div className="bg-orange-100 border-l-4 border-orange-500 p-3 rounded">
                  <p className="text-xs text-orange-800">
                    <span className="font-semibold">Important:</span> Verify
                    this Package ID on your delivery package before accepting
                  </p>
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
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Items</span>
                    <span className="font-semibold text-gray-800">
                      {order.items.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="font-bold text-xl text-gray-900">
                      ₹{order.pricing.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                      {order.status}
                    </Badge>
                  </div>
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
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg h-12 text-base font-medium group"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            View My Orders
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base font-medium bg-white"
          >
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
