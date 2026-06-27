"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getUserOrders, cancelOrder } from "@/lib/orderService";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LocalOrderItem {
  _id: string;
  productId: { slug: string };
  images: string[];
  name: string;
  quantity: number;
  priceAtPurchase: number;
  color?: { code: string; name: string };
  sizeId?: { name: string };
  isPersonalized: boolean;
  personalizedName?: string;
}

interface LocalOrderData {
  _id: string;
  orderId: string;
  status: string;
  createdAt: string;
  pricing: { total: number };
  items: LocalOrderItem[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<LocalOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, [filter, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(filter !== "all" && { status: filter }),
      };
      const response = await getUserOrders(params);
      setOrders(response.orders);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim() || !selectedOrderId) return;
    setBtnLoading(true);
    try {
      const response = await cancelOrder(selectedOrderId, cancelReason);
      if (response.success) {
        setCancelDialogOpen(false);
        setCancelReason("");
        setSelectedOrderId(null);
        loadOrders();
        toast.success(response.message || "Order Cancelled");
      } else {
        toast.error(
          ` ${
            response.message ||
            response.response.data.message ||
            "Failed to cancel order"
          }`
        );
      }
      setBtnLoading(false);
    } catch (error: unknown) {
      const err = error as { response?: { message?: string }; message?: string };
      toast.error(
        err?.response?.message || err?.message || "Failed to cancel order"
      );
      setBtnLoading(false);
    }
    setBtnLoading(false);
  };

  const openCancelDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    shipped: "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const filters = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div id="orders" className="min-h-screen    md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl w-full mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl shadow-lg">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold ">My Orders</h1>
            <p className="text-amber-700/70 text-sm">
              Track and manage your purchases
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              Filter by status
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
              <Button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                variant={filter === filterOption.value ? "default" : "outline"}
                size="sm"
              >
                {filterOption.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${page}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {orders.length === 0 ? (
                <Card className="border-amber-200 bg-white/80 backdrop-blur">
                  <CardContent className="py-20 text-center">
                    <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <p className="text-amber-700 font-medium">
                      No orders found yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white  backdrop-blur hover:shadow-xl transition-all duration-300 p-2 ">
                      <CardHeader className="">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-amber-900">
                              Order #{order.orderId}
                            </h3>
                            <p className="text-sm text-amber-600">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${
                              statusColors[order.status]
                            } capitalize font-medium`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className=" pt-2 md:pt-6 px-0">
                        <div className="space-y-4">
                          {order.items.map((item, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ x: 4 }}
                              className="flex gap-4 p-3 rounded-lg "
                            >
                              <Image
                                onClick={() =>
                                  router.push(
                                    `/order-track?orderId=${order.orderId}`
                                  )
                                }
                                src={item.images[0]}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-20 h-20 cursor-pointer object-cover rounded-md border-2 border-amber-200"
                              />
                              <div
                                onClick={() =>
                                  router.push(
                                    `/order-track?orderId=${order.orderId}`
                                  )
                                }
                                className="flex-1 cursor-pointer"
                              >
                                <p className="font-medium text-amber-900">
                                  {item.name}
                                </p>
                                <p className="text-sm text-amber-600">
                                  Quantity: {item.quantity}
                                </p>
                                {/* Color display */}
                                {item.color && (
                                  <p className="text-sm text-amber-600 flex items-center gap-1">
                                    Color:{" "}
                                    <span
                                      style={{
                                        backgroundColor: item.color.code,
                                      }}
                                      className="w-3 h-3 rounded-full border border-amber-300 inline-block"
                                    />
                                    <span>{item.color.name}</span>
                                  </p>
                                )}
                                {/* Size display */}
                                {item.sizeId && (
                                  <p className="text-sm text-amber-600">
                                    Size: {item.sizeId.name}
                                  </p>
                                )}
                                {item.isPersonalized && (
                                  <p className="text-sm text-orange-600 font-medium">
                                    ✨ Personalized Name :{" "}
                                    {item.personalizedName}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-wrap gap-2 justify-between items-center border-t border-amber-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                        <div className="text-lg font-bold text-amber-900">
                          Total: ₹{order.pricing.total}
                        </div>
                        <div className="flex gap-2">
                          {(order.status === "pending" ||
                            order.status === "confirmed") && (
                            <Button
                              onClick={() => openCancelDialog(order.orderId)}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              router.push(
                                `/order-track?orderId=${order.orderId}`
                              )
                            }
                            size="sm"
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-4 mt-8"
          >
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="px-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex shadow-md">
              Page {page}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="h-[95vh] w-screen max-w-screen md:max-w-md z-[1300] border-amber-200 bg-gradient-to-br from-white to-amber-50">
          <DialogHeader>
            <DialogTitle className="text-amber-900">Cancel Order</DialogTitle>
            <DialogDescription className="text-amber-700">
              Please provide a reason for cancelling this order.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter cancellation reason..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={btnLoading}
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
              }}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={!cancelReason.trim() || btnLoading}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
            >
              {!btnLoading ? (
                <div className="flex items-center">
                  <span className="mr-2">
                    <XCircle className="w-4 h-4" />
                  </span>
                  Confirm Cancellation
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Cancelling
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
