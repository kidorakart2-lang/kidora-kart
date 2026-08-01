"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
  XCircle,
  RefreshCw,
  AlertTriangle,
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
import { useUserOrders, useCancelOrder } from "@/lib/useOrders";
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
  isPersonalized: boolean;
  personalizedName?: string;
  variantName?: string;
}

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const isWithinCancelWindow = (createdAt: string) => {
  return Date.now() - new Date(createdAt).getTime() < TWELVE_HOURS_MS;
};

interface LocalOrderData {
  _id: string;
  orderId: string;
  status: string;
  createdAt: string;
  pricing: { total: number };
  items: LocalOrderItem[];
}

export default function MyOrders() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const router = useRouter();

  const { data: orderData, isLoading } = useUserOrders({
    page,
    limit: 10,
    ...(filter !== "all" && { status: filter }),
  });
  const orders = (orderData?.orders ?? []) as LocalOrderData[];

  const cancelMutation = useCancelOrder();

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    const finalReason =
      cancelReason === "Other" ? customReason.trim() : cancelReason.trim();
    if (!finalReason) return;
    try {
      const response = await cancelMutation.mutateAsync({
        orderId: selectedOrderId,
        reason: finalReason,
      });
      if (response.success) {
        setCancelDialogOpen(false);
        setCancelReason("");
        setCustomReason("");
        setSelectedOrderId(null);
        toast.success(response.message || "Order Cancelled");
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to cancel order"
      );
    }
  };

  const openCancelDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground border-border",
    confirmed: "bg-muted text-muted-foreground border-border",
    shipped: "bg-blue-50 text-blue-700 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-muted text-muted-foreground border-border",
    payment_failed: "bg-red-100 text-red-800 border-red-300",
  };

  const filters = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "payment_failed", label: "Payment Failed" },
  ];

  return (
    <div id="orders" className="min-h-screen    md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl w-full mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-muted">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
             <h1 className="text-4xl fw-heading">My Orders</h1>
            <p className="text-muted-foreground text-sm">
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
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
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

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-foreground" />
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
                <Card className="border-border bg-background">
                  <CardContent className="py-20 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
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
                    <Card className="bg-background  backdrop-blur hover:shadow-xl transition-all duration-300 p-2 ">
                      <CardHeader className="">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Order #{order.orderId}
                            </h3>
                            <p className="text-sm text-muted-foreground">
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
                                className="w-20 h-20 cursor-pointer object-cover rounded-md border border-border"
                              />
                              <div
                                onClick={() =>
                                  router.push(
                                    `/order-track?orderId=${order.orderId}`
                                  )
                                }
                                className="flex-1 cursor-pointer"
                              >
                                <p className="font-medium text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                                {item.variantName && (
                                  <p className="text-sm text-brand-600 fw-cta">
                                    🎁 {item.variantName}
                                  </p>
                                )}
                                {/* Color display */}
                                {item.color && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    Color:{" "}
                                    <span
                                      style={{
                                        backgroundColor: item.color.code,
                                      }}
                                      className="w-3 h-3 rounded-full border border-border inline-block"
                                    />
                                    <span>{item.color.name}</span>
                                  </p>
                                )}
                                {item.isPersonalized && (
                                  <p className="text-sm text-muted-foreground font-medium">
                                    ✨ Personalized Name :{" "}
                                    {item.personalizedName}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-wrap gap-2 justify-between items-center border-t border-border bg-muted/30">
                        <div className="text-lg font-semibold text-foreground">
                          Total: ₹{order.pricing.total}
                        </div>
                        <div className="flex gap-2">
                          {order.status === "pending" &&
                            isWithinCancelWindow(order.createdAt) && (
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
                          {order.status === "payment_failed" && (
                            <Button
                              onClick={() =>
                                router.push(
                                  `/order-track?orderId=${order.orderId}`
                                )
                              }
                              size="sm"
                              className="btn-gradient"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Retry Payment
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              router.push(
                                `/order-track?orderId=${order.orderId}`
                              )
                            }
                            size="sm"
                            className="btn-gradient"
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

        {!isLoading && (
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
              className="border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="px-2 py-2 bg-foreground text-background rounded-lg flex shadow-md">
              Page {page}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= (orderData?.totalPages ?? 1)}
              variant="outline"
              className="border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md bg-background border border-border p-0 gap-0 overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 text-center sm:text-left bg-gradient-to-br from-destructive/5 to-destructive/10 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3 sm:flex-row flex-col sm:text-left text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-foreground text-xl">
                  Cancel Order?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            <div className="bg-muted border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Order Number</p>
              <p className="font-mono text-sm font-semibold text-foreground break-all">
                {selectedOrderId}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cancel-reason"
                className="text-sm font-medium text-foreground block"
              >
                Reason for cancellation <span className="text-destructive">*</span>
              </label>

              <div className="grid grid-cols-1 gap-2">
                {[
                  "Changed my mind",
                  "Found a better price",
                  "Wrong size or color",
                  "Ordered by mistake",
                  "Delivery taking too long",
                  "Other",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelReason(reason)}
                    className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                      cancelReason === reason
                        ? "border-destructive bg-destructive/5 text-destructive font-medium"
                        : "border-border hover:border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {cancelReason === "Other" && (
                <Textarea
                  id="cancel-reason"
                  placeholder="Please tell us more..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="border-border focus:border-destructive focus:ring-destructive mt-2 min-h-[80px]"
                  rows={3}
                  autoFocus
                />
              )}

              {!cancelReason && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Select a reason above to continue
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-muted/50 border-t border-border flex flex-col-reverse sm:flex-row gap-2 flex-shrink-0">
            <Button
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
                setCustomReason("");
              }}
              className="border-border text-foreground hover:bg-muted w-full sm:w-auto min-h-[44px]"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={
                (cancelReason === "Other" ? !customReason.trim() : !cancelReason.trim()) ||
                cancelMutation.isPending
              }
              className="bg-destructive hover:bg-destructive/80 active:bg-destructive/70 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all w-full sm:w-auto min-h-[48px] sm:min-h-[44px] disabled:opacity-50 disabled:hover:scale-100"
            >
              {!cancelMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
