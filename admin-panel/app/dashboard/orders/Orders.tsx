"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface OrderItem {
  productId: string;
  name: string;
  images: string[];
  quantity: number;
  priceAtPurchase: number;
  isPersonalized: boolean;
  personalizedName?: string;
}

interface OrderData {
  orderId: string;
  status: string;
  createdAt: string;
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  items?: OrderItem[];
  pricing?: {
    total: number;
    subtotal?: number;
    shipping?: number;
  };
  shipping?: {
    carrier?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  payment?: {
    status?: string;
    method?: string;
  };
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  statusHistory?: Array<{ id: string; status: string; timestamp: string }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [cancelOrder, setCancelOrder] = useState<OrderData | null>(null);
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.post<{ success: boolean; data: OrderData[] }>("/api/admin/orders/all", {});
      if (response.success) {
        setOrders(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiClientError ? error.message : "Failed to load orders",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

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

  const handleShipWithShiprocket = async (order: OrderData) => {
    try {
      const response = await api.post<{ success: boolean; message?: string; data?: unknown }>(
        "/api/website/shipping/create",
        { orderId: order.orderId },
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Shipment created via Shiprocket successfully",
        });
        loadOrders();
        invalidateCache(["products"]);
        setDrawerOpen(false);
      } else {
        throw new ApiClientError(response.message || "Failed to create shipment via Shiprocket", 400);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiClientError ? error.message : "Failed to create shipment via Shiprocket",
        variant: "destructive",
      });
    }
  };

  const handleMarkToShipped = async (order: OrderData) => {
    try {
      const response = await api.post<{ success: boolean; message?: string }>(
        "/api/admin/orders/mark-to-shipped",
        { orderId: order.orderId },
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Order marked to shipped successfully",
        });
        loadOrders();
        invalidateCache(["products"]);
      } else {
        throw new ApiClientError(response.message || "Failed to mark order to shipped", 400);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiClientError ? error.message : "Failed to mark order to shipped",
        variant: "destructive",
      });
    }
  };

  const handleMarkToDelivered = async (order: OrderData) => {
    try {
      const response = await api.post<{ success: boolean; message?: string }>(
        "/api/admin/orders/deliever/order",
        { orderId: order.orderId },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Order marked to delivered successfully",
        });
        loadOrders();
        invalidateCache(["products"]);
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof ApiClientError ? error.message : "Failed to mark order to delivered",
        variant: "destructive",
      });
    }
  };
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

  const confirmCancelOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cancelOrder) {
      toast({
        title: "Error",
        description: "Order not found",
        variant: "destructive",
      });
      return;
    }
    const form = e.currentTarget;
    const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement)?.value;
    if (reason === "") {
      toast({
        title: "Error",
        description: "Reason is required",
        variant: "destructive",
      });
      return;
    }
    try {
      const responseData = await api.post<{ success: boolean; message?: string }>(
        "/api/admin/orders/cancel-by-admin",
        {
          orderId: cancelOrder.orderId,
          reason,
        },
      );
      if (responseData.success) {
        toast({
          title: "Success",
          description: responseData.message || "Order cancelled successfully",
        });
        loadOrders();
        invalidateCache(["products"]);
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiClientError ? error.message : "Failed to cancel order",
        variant: "destructive",
      });
    }
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
          className="transition-all duration-200 hover:scale-105"
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
            <ExportButtons data={orders as unknown as Record<string, unknown>[]} filename="orders" />
          </div>

          {loading ? (
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
              columns={columns as unknown as Column<OrderData>[]}
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
        className=" md:!w-[60vw] md:!max-w-[1800px] !w-full !max-w-full"
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
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
              Confirm Cancellation
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
        title="Order Actions"
        className=" md:!w-[60vw] md:!max-w-[1800px] !w-full !max-w-full"
      >
        <Badge variant="default" className="font-mono capitalize text-md mb-4">
          {selectedOrder?.status}
        </Badge>
        {selectedOrder?.status === "confirmed" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => selectedOrder && handleShipWithShiprocket(selectedOrder)}
            className="transition-all duration-200 hover:scale-105 w-full bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="h-4 w-4 mr-2" />
            Ship with Shiprocket
          </Button>
        )}
        {selectedOrder?.status !== "shipped" && selectedOrder?.status !== "confirmed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedOrder && handleMarkToShipped(selectedOrder)}
            className="transition-all duration-200 hover:scale-105 w-full"
          >
            <Truck className="h-4 w-4 mr-2" />
            Mark To Shipped
          </Button>
        )}
        {selectedOrder?.status !== "delivered" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelOrder}
            className="transition-all duration-200 hover:scale-105 w-full mt-4"
          >
            Cancel This Order
          </Button>
        )}
        {selectedOrder?.status === "shipped" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => selectedOrder && handleMarkToDelivered(selectedOrder)}
            className="transition-all duration-200 hover:scale-105 w-full mt-4"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark To Delivered
          </Button>
        )}

        {/* order details */}
        {selectedOrder && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-t pt-2">
                <p className="font-medium">Order ID:</p>
                <p className="text-muted-foreground">
                  {selectedOrder?.orderId}
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Customer:</p>
                <p className="text-muted-foreground">
                  {selectedOrder?.shippingAddress?.fullName}
                </p>
                <p className="text-muted-foreground">
                  {selectedOrder?.shippingAddress?.email}
                </p>
                <p className="text-muted-foreground">
                  {selectedOrder?.shippingAddress?.phone}
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Is It A Gift:</p>
                <p className="text-muted-foreground">
                  {selectedOrder?.isGift ? "Yes" : "No"}
                </p>
                {selectedOrder?.isGift && (
                  <div>
                    <p className="font-medium">Gift Message:</p>
                    <p className="text-muted-foreground">
                      {selectedOrder?.giftMessage}
                    </p>
                  </div>
                )}
                {selectedOrder.isGift && selectedOrder.giftWrap && (
                  <div>
                    <p className="font-medium">Gift Wrap:</p>
                    <p className="text-muted-foreground">
                      {selectedOrder?.giftWrap ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Subtotal:</p>
                <p className="text-muted-foreground">
                  ₹{selectedOrder?.pricing?.subtotal?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Shipping Charge:</p>
                <p className="text-muted-foreground">
                  ₹{selectedOrder?.pricing?.shipping?.toFixed(2) ?? "0.00"}
                </p>
                {selectedOrder?.shipping?.carrier && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Courier: {selectedOrder.shipping.carrier}
                    {selectedOrder.shipping.estimatedDelivery && (
                      <span className="ml-2">
                        EDD: {new Date(selectedOrder.shipping.estimatedDelivery).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </p>
                )}
                {selectedOrder?.shipping?.trackingNumber && (
                  <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md">
                    <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      AWB / Tracking ID
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-mono text-indigo-900 font-bold">
                        {selectedOrder.shipping.trackingNumber}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const awb = selectedOrder?.shipping?.trackingNumber;
                          if (awb) {
                            navigator.clipboard.writeText(awb)
                              .then(() => toast({ title: "AWB copied to clipboard" }))
                              .catch(() => toast({ title: "Failed to copy", variant: "destructive" }));
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      <a
                        href={`https://shiprocket.in/tracking/${selectedOrder.shipping.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-indigo-800"
                      >
                        Track on Shiprocket →
                      </a>
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Total:</p>
                <p className="text-muted-foreground">
                  ₹{selectedOrder?.pricing?.total?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <div className="border-t pt-2">
                <p className="font-medium">Status:</p>
                <p className="text-muted-foreground">{selectedOrder?.status}</p>
              </div>
            </div>
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedOrder?.items?.map((item) => (
                  <div key={item.productId} className="flex ">
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                    <div className="bg-card p-2 flex-col  shadow-md flex gap-1">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-sm font-medium truncate flex items-center">
                        <IndianRupee size={12} />{" "}
                        {item.priceAtPurchase.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium truncate">
                        Personalized: {item.isPersonalized ? "Yes" : "No"}
                      </p>
                      {item.isPersonalized && (
                        <p className="text-sm font-medium truncate">
                          Personalized Name:{" "}
                          <span className="text-primary text-underline">
                            {item.personalizedName}
                          </span>
                        </p>
                      )}
                      <p className="text-sm font-medium truncate">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* payment */}
            <div className="mt-4 space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-t pt-2">
                  <p className="font-medium">Payment Method:</p>
                  <p className="text-muted-foreground">
                    {selectedOrder?.payment?.method}
                  </p>
                </div>
                <div className="border-t pt-2">
                  <p className="font-medium">Payment Status:</p>
                  <p className="text-muted-foreground">
                    {selectedOrder?.payment?.status}
                  </p>
                </div>
              </div>
            </div>
            {/* status history */}
            <div className="mt-4 space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Status History</h2>
              <div className="grid grid-cols-1  gap-4">
                {selectedOrder?.statusHistory?.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between"
                  >
                    <p className="font-medium">{status.status}</p>
                    <p className="text-muted-foreground">
                      {new Date(status.timestamp).toDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
