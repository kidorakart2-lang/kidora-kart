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
} from "lucide-react";
import { Drawer } from "@/components/drawer";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import Image from "next/image";
import axios from "axios";
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

export default function Orders() {
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
    const token = Cookies.get("adminToken");
    const data = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + "api/admin/orders/all",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );
    const response = await data.json();
    if (response.ok || response.success) {
      setOrders(response.data);
    } else {
      toast({
        title: "Error",
        description: "Failed to load orders",
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

  const handleMarkToShipped = async (order: OrderData) => {
    try {
      const token = Cookies.get("adminToken");
      const data = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "api/website/orders/mark-to-shipped",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId: order.orderId }),
        }
      );
      const response = await data.json();
      if (response.ok || response.success) {
        toast({
          title: "Success",
          description: "Order marked to shipped successfully",
        });
        loadOrders();
      } else {
        throw new Error(response.message || "Failed to mark order to shipped");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark order to shipped",
        variant: "destructive",
      });
    }
  };

  const handleMarkToDelivered = async (order: OrderData) => {
    try {
      const token = Cookies.get("adminToken");
      const { data } = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "api/admin/orders/deliever/order",
        { orderId: order.orderId },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Order marked to delivered successfully",
        });
        loadOrders();
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error && "response" in error ? (error as { response: { data?: { message?: string } } }).response.data?.message : "Failed to mark order to delivered";
      toast({
        title: "Error",
        description: errMsg,
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
      const token = Cookies.get("adminToken");
      const { data: responseData } = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "api/website/orders/cancel-by-admin",
        {
          orderId: cancelOrder.orderId,
          reason,
        },
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (responseData.success) {
        toast({
          title: "Success",
          description: responseData.message || "Order cancelled successfully",
        });
        loadOrders();
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
        description: error instanceof Error ? error.message : "Failed to cancel order",
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
          {item.pricing?.total.toFixed(2)}
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Track and manage customer orders
          </p>
        </div>
        <ExportButtons data={orders as unknown as Record<string, unknown>[]} filename="orders" />
      </div>

      <DataTable
        selectOption={statusOptions}
        data={orders}
        dateOption={true}
        columns={columns as unknown as Column<OrderData>[]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search orders..."
      />
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
              className="block text-sm font-medium text-gray-700"
            >
              Reason for Cancellation
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="reason"
              id="reason"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Please provide a reason for cancelling this order..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
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
        {selectedOrder?.status !== "shipped" && (
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
                <p className="font-medium">Total:</p>
                <p className="text-muted-foreground">
                  {selectedOrder?.pricing?.total.toFixed(2)}
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
                      onClick={() => console.log(selectedOrder)}
                      src={item.images[0]}
                      alt={item.name}
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                    <div className="bg-white p-2 flex-col  shadow-md flex gap-1">
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
                          <span className="text-amber-500 text-underline">
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
    </div>
  );
}
