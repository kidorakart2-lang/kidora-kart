"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export-buttons";
import { OrderReceipt } from "@/components/order-receipt";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  Printer,
  IndianRupee,
  ArrowLeftRight,
  ShoppingCart,
  Copy,
} from "lucide-react";
import { Drawer } from "@/components/drawer";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { api, ApiClientError } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import RefundedOrdersAdmin from "@/components/RefundedOrdersAdmin";
import PendingPaymentFix from "@/components/PendingPaymentFix";
import SyncStuckPayments from "@/components/SyncStuckPayments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderData } from "@/lib/types";

export default function OrdersPage() {
  const [cancelOrder, setCancelOrder] = useState<OrderData | null>(null);
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, isError, error } = useQuery<OrderData[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.post<{ success: boolean; data: OrderData[] }>("/api/admin/orders/all", {});
      if (!res.success) throw new ApiClientError("Failed to load orders", 500);
      return res.data;
    },
  });

  const handleEdit = (order: OrderData) => {
    setDrawerOpen(true);
    setSelectedOrder(order);
  };
  const handleDelete = (_id: number) => {
    toast({
      title: "Order deletion not supported",
      description: "Use cancel action instead",
    });
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load orders"
          message={error instanceof Error ? error.message : "Could not fetch orders from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}
        />
      </div>
    );
  }

  // ── Mutations ──
  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    invalidateCache(["products"]);
  };

  const markShippedMutation = useMutation({
    mutationFn: (orderId: string) => api.post<{ success: boolean; message?: string }>("/api/admin/orders/mark-to-shipped", { orderId }),
    onSuccess: (response) => {
      if (!response.success) throw new ApiClientError((response as any).message || "Failed to mark shipped", 400);
      toast({ title: "Success", description: "Order marked to shipped successfully" });
      invalidateOrders();
    },
    onError: (error: Error) => toast({ title: "Error", description: error instanceof ApiClientError ? error.message : "Failed to mark shipped", variant: "destructive" }),
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (orderId: string) => api.post<{ success: boolean; message?: string }>("/api/admin/orders/deliever/order", { orderId }),
    onSuccess: (response) => {
      if (!response.success) throw new ApiClientError((response as any).message || "Failed to mark delivered", 400);
      toast({ title: "Success", description: response.message || "Order marked to delivered successfully" });
      invalidateOrders();
      setDrawerOpen(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error instanceof ApiClientError ? error.message : "Failed to mark delivered", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.post<{ success: boolean; message?: string }>("/api/admin/orders/cancel-by-admin", { orderId, reason }),
    onSuccess: (response) => {
      if (!response.success) throw new ApiClientError(response.message || "Failed to cancel order", 400);
      toast({ title: "Success", description: response.message || "Order cancelled successfully" });
      invalidateOrders();
      setCancelOrderOpen(false);
      setCancelOrder(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error instanceof ApiClientError ? error.message : "Failed to cancel order", variant: "destructive" });
    },
  });

  const handleMarkToShipped = (order: OrderData) => markShippedMutation.mutate(order.orderId);
  const handleMarkToDelivered = (order: OrderData) => markDeliveredMutation.mutate(order.orderId);
  const handlePrint = (order: OrderData) => {
    setSelectedOrder(order);
    setReceiptOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleCancelOrder = () => {
    setCancelOrder(selectedOrder);
    setDrawerOpen(false);
    setCancelOrderOpen(true);
  };

  const confirmCancelOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cancelOrder) { toast({ title: "Error", description: "Order not found", variant: "destructive" }); return; }
    const form = e.currentTarget;
    const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement)?.value;
    if (!reason) { toast({ title: "Error", description: "Reason is required", variant: "destructive" }); return; }
    cancelMutation.mutate({ orderId: cancelOrder.orderId, reason });
  };

  const columns = [
    {
      key: "id",
      label: "Order ID",
      render: (item: OrderData) => (
        <span className="font-mono font-semibold">#{item.orderId}</span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (item: OrderData) => (
        <span className="font-medium">
          {item?.shippingAddress?.fullName || ""}
        </span>
      ),
    },
    {
      key: "items",
      label: "Total Items",
      render: (item: OrderData) => (
        <Badge variant="secondary" className="font-mono">
          {item?.items?.length}
        </Badge>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (item: OrderData) => (
        <span className="font-semibold flex items-center">
          <IndianRupee size={12} />
          {item.pricing?.total?.toFixed(2) ?? "0.00"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: OrderData) => (
        <Badge
          variant={getStatusColor(item.status)}
          className="capitalize gap-1"
        >
          {getStatusIcon(item.status)}
          {item.status}
        </Badge>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (item: OrderData) => (
        <span className="text-sm text-muted-foreground">
          {item?.payment?.status}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: OrderData) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.createdAt).toDateString()}
        </span>
      ),
    },
    {
      key: "billing",
      label: "Billing",
      render: (item: OrderData) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint(item)}
          className="transition-all duration-200"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="space-y-6">
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Track and manage customer orders</p>
          </div>
        </div>

        <PendingPaymentFix />
        <SyncStuckPayments />

        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Refunds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <ExportButtons data={orders} filename="orders" />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                          <TableCell key={h}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <DataTable
              selectOption={statusOptions}
              data={orders}
              dateOption={true}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              searchPlaceholder="Search orders..."
              emptyTitle="No orders yet"
              emptyDescription="Orders will appear here once customers start placing them."
            />
          )}
      <Drawer
        isOpen={cancelOrderOpen}
        onClose={() => {
          setCancelOrderOpen(false);
          setCancelOrder(null);
        }}
        title="Cancel Order"
        className="md:!w-[60vw] md:!max-w-[1800px] !w-full !max-w-full"
      >
        <form onSubmit={confirmCancelOrder} className="space-y-4 p-4">
          <div className="space-y-2">
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-foreground"
            >
              Reason for Cancellation
              <span className="text-destructive ml-1">*</span>
            </label>
            <textarea
              name="reason"
              id="reason"
              rows={5}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Please provide a reason for cancelling this order..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This information will be shared with the customer.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCancelOrderOpen(false);
                setCancelOrder(null);
              }}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" className="px-6 py-2">
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOrder(null);
        }}
        title={`Order #${selectedOrder?.orderId ?? ""}`}
        className="md:!w-[50vw] md:!max-w-[800px] !w-full !max-w-full"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Status + Quick Actions */}
            <div className="flex items-center justify-between">
              <Badge variant={getStatusColor(selectedOrder.status)} className="capitalize gap-1.5 text-sm px-3 py-1">
                {getStatusIcon(selectedOrder.status)}
                {selectedOrder.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(selectedOrder.status === "pending" || selectedOrder.status === "confirmed") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkToShipped(selectedOrder)}
                  className="flex-1 min-w-[140px]"
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  Mark Shipped
                </Button>
              )}
              {selectedOrder.status === "shipped" && (
                <Button
                  size="sm"
                  onClick={() => handleMarkToDelivered(selectedOrder)}
                  className="flex-1 min-w-[140px]"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Mark Delivered
                </Button>
              )}
              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelOrder}
                  className="min-w-[120px]"
                >
                  Cancel Order
                </Button>
              )}
            </div>

            {/* Customer Info */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
              <p className="text-sm font-semibold">{selectedOrder.shippingAddress?.fullName}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress?.email}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress?.phone}</p>
              {selectedOrder.isGift && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  <p className="text-xs font-medium text-foreground">Gift Message</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedOrder.giftMessage}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
              {selectedOrder.items?.map((item, index) => {
                const productKey =
                  typeof item.productId === "object" && item.productId !== null
                    ? (item.productId as { _id?: string })?._id ?? ""
                    : String(item.productId ?? "");
                const sizeKey =
                  typeof item.sizeId === "object" && item.sizeId !== null
                    ? (item.sizeId as { _id?: string })?._id ?? ""
                    : String(item.sizeId ?? "");
                return (
                <div
                  key={`${productKey}-${sizeKey}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  {item.images?.[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="rounded-md object-cover"
                  />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-primary font-medium">
                        {item.variantName}
                      </p>
                    )}
                    {item.sizeId && typeof item.sizeId === "object" && item.sizeId.name && (
                      <p className="text-xs text-muted-foreground">Size: {item.sizeId.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.priceAtPurchase.toFixed(2)}
                    </p>
                    {item.isPersonalized && (
                      <p className="text-xs text-primary">
                        Custom: {item.personalizedName}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    ₹{(item.subtotal ?? item.quantity * item.priceAtPurchase).toFixed(2)}
                  </p>
                </div>
                );
              })}
            </div>

            {/* Pricing */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pricing</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{selectedOrder.pricing?.subtotal?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{selectedOrder.pricing?.shipping?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="flex items-center">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {selectedOrder.pricing?.total?.toFixed(2) ?? "0.00"}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{selectedOrder.payment?.method ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedOrder.payment?.status === "paid" ? "default" : "secondary"} className="text-xs capitalize">
                  {selectedOrder.payment?.status ?? "—"}
                </Badge>
              </div>
            </div>

            {/* Shipping / Tracking */}
            {selectedOrder.shipping?.trackingNumber && (
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shipping</p>
                {selectedOrder.shipping.carrier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Courier</span>
                    <span className="font-medium">{selectedOrder.shipping.carrier}</span>
                  </div>
                )}
                {selectedOrder.shipping.estimatedDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span>{new Date(selectedOrder.shipping.estimatedDelivery).toLocaleDateString("en-IN")}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-md">
                  <div>
                    <p className="text-xs text-muted-foreground">AWB / Tracking</p>
                    <p className="text-sm font-mono font-bold">{selectedOrder.shipping.trackingNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.shipping!.trackingNumber!)
                        .then(() => toast({ title: "AWB copied" }))
                        .catch(() => toast({ title: "Failed to copy", variant: "destructive" }));
                    }}
                    className="text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                  >
                    <Copy className="h-3 w-3 inline mr-1" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Status History */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</p>
                <div className="space-y-2">
                  {selectedOrder.statusHistory.map((s, idx) => (
                    <div key={s.status + idx} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{s.status}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(s.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
      <OrderReceipt
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={selectedOrder}
      />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundedOrdersAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
