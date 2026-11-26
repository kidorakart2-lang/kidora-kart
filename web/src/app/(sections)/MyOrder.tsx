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
    pending: "bg-[var(--brand-cream)] text-[var(--brand-ink)]/70 border-[var(--brand-gold)]/25",
    confirmed: "bg-[var(--brand-rose)]/25 text-[var(--brand-plum)] border-[var(--brand-mauve)]/35",
    shipped: "bg-[var(--brand-rose)]/25 text-[var(--brand-plum)] border-[var(--brand-mauve)]/35",
    delivered: "bg-[var(--brand-gold)]/15 text-[var(--brand-gold-dark)] border-[var(--brand-gold)]/45",
    cancelled: "bg-destructive/5 text-destructive border-destructive/25",
    payment_failed: "bg-destructive/5 text-destructive border-destructive/25",
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
    <div id="orders" className="min-h-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl w-full mx-auto"
      >
        <div className="mb-8 flex items-center gap-4 border-b border-[var(--brand-gold)]/20 pb-6">
          <div className="grid size-12 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10">
            <Package className="h-5 w-5 text-[var(--brand-gold-dark)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="eyebrow mb-1 text-[10px]"><span className="mr-1.5">✦</span>Purchase history</p>
            <h1 className="display-heading text-3xl">My Orders</h1>
            <p className="mt-1 text-[11.5px] text-[var(--brand-ink)]/65">
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
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--brand-gold-dark)]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/65">
              Filter by status
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`rounded-full border px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.12em] transition-all duration-300 ${
                  filter === filterOption.value
                    ? "border-[var(--brand-plum)] bg-[var(--brand-plum)] text-[var(--brand-cream)]"
                    : "border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)]/70 hover:border-[var(--brand-gold)]/60 hover:text-[var(--brand-ink)]"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-gold-dark)]" />
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
                <Card className="border-[var(--brand-gold)]/25 bg-white">
                  <CardContent className="py-20 text-center">
                    <Package className="mx-auto mb-4 h-12 w-12 text-[var(--brand-gold)]/60" strokeWidth={1.2} />
                    <p className="display-heading text-lg text-[var(--brand-ink)]/70">
                      No orders found yet
                    </p>
                    <p className="mt-1 text-[11.5px] text-[var(--brand-ink)]/65">
                      Your purchases will appear here once you place an order.
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
                    <Card className="border-[var(--brand-gold)]/25 bg-white p-1 transition-shadow duration-300 hover:shadow-md">
                      <CardHeader className="">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="display-heading text-lg">
                              Order #{order.orderId}
                            </h3>
                            <p className="text-[11.5px] text-[var(--brand-ink)]/65">
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
                                                          } capitalize text-[10px] tracking-[0.1em] font-medium`}
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
                                className="size-20 cursor-pointer rounded-lg border border-[var(--brand-gold)]/20 object-cover"
                              />
                              <div
                                onClick={() =>
                                  router.push(
                                    `/order-track?orderId=${order.orderId}`
                                  )
                                }
                                className="flex-1 cursor-pointer"
                              >
                                <p className="display-heading text-[14px] italic text-[var(--brand-ink)]">
                                  {item.name}
                                </p>
                                <p className="text-[11.5px] text-[var(--brand-ink)]/65">
                                  Quantity: {item.quantity}
                                </p>
                                {item.variantName && (
                                  <p className="text-[11.5px] text-[var(--brand-gold-dark)]">
                                    ✦ {item.variantName}
                                  </p>
                                )}
                                {/* Color display */}
                                {item.color && (
                                  <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--brand-ink)]/65">
                                    Colour:{" "}
                                    <span
                                      style={{
                                        backgroundColor: item.color.code,
                                      }}
                                      className="inline-block size-3 rounded-full border border-[var(--brand-gold)]/40"
                                    />
                                    <span>{item.color.name}</span>
                                  </p>
                                )}
                                {item.isPersonalized && (
                                  <p className="mt-1 inline-block rounded border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-2 py-0.5 text-[11px] text-[var(--brand-ink)]/65">
                                    Personalised: {item.personalizedName}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/50">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[9.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/65">Total</span>
                          <span className="display-heading text-lg text-[var(--brand-plum)]">₹{order.pricing.total}</span>
                        </div>
                        <div className="flex gap-2">
                          {order.status === "pending" &&
                            isWithinCancelWindow(order.createdAt) && (
                            <Button
                              onClick={() => openCancelDialog(order.orderId)}
                              variant="outline"
                              size="sm"
                              className="rounded-full border-destructive/30 bg-transparent text-[10px] uppercase tracking-[0.12em] text-destructive hover:bg-destructive/5"
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
                              className="btn-gold !text-[10px] uppercase tracking-[0.14em]"
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
                            className="btn-gold !text-[10px] uppercase tracking-[0.14em]"
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
              className="rounded-full border-[var(--brand-gold)]/35 bg-transparent text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65 hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="rounded-full bg-[var(--brand-plum)] px-4 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-cream)]">
              Page {page}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= (orderData?.totalPages ?? 1)}
              variant="outline"
              className="rounded-full border-[var(--brand-gold)]/35 bg-transparent text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65 hover:bg-white disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="flex h-[95vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white p-0 sm:h-auto sm:max-h-[90vh]">
          <DialogHeader className="flex-shrink-0 border-b border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/60 px-6 pb-4 pt-6 text-center sm:text-left">
            <div className="flex items-center gap-3 sm:flex-row flex-col sm:text-left text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="display-heading text-xl">
                  Cancel Order?
                </DialogTitle>
                <DialogDescription className="mt-1 text-[11.5px] text-[var(--brand-ink)]/65">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            <div className="rounded-lg border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)] p-3">
              <p className="mb-1 text-[9.5px] uppercase tracking-[0.16em] text-[var(--brand-ink)]/65">Order Number</p>
              <p className="break-all font-mono text-[12px] text-[var(--brand-ink)]">
                {selectedOrderId}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cancel-reason"
                className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65"
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
                        : "border-[var(--brand-gold)]/25 bg-white text-[var(--brand-ink)]/70 hover:border-[var(--brand-gold)]/50 hover:bg-[var(--brand-cream)]"
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
                  className="mt-2 min-h-[80px] border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)] focus:border-destructive focus:ring-destructive"
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

          <DialogFooter className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/50 px-6 py-4 sm:flex-row">
            <Button
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
                setCustomReason("");
              }}
              className="min-h-[44px] w-full rounded-full border-[var(--brand-gold)]/35 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65 hover:bg-white sm:w-auto"
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
