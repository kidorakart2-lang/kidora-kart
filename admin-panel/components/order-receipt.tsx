"use client";
import { Button } from "@/components/ui/button";
import { X, Printer, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface OrderAddress {
  fullName?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface OrderItem {
  name: string;
  images?: string[];
  quantity: number;
  priceAtPurchase: number;
  colorId?: { name?: string; _id?: string };
  sizeId?: { name?: string; _id?: string };
  isPersonalized?: boolean;
  personalizedName?: string;
}

interface OrderPricing {
  subtotal?: number;
  discount?: { amount?: number };
  shipping?: number;
  total?: number;
}

interface Order {
  orderId: string;
  packageId?: string;
  createdAt: string;
  shippingAddress?: OrderAddress;
  payment?: {
    method?: string;
    status?: string;
    razorpay?: {
      payment_id?: string;
    };
  };
  status: string;
  items?: OrderItem[];
  pricing?: OrderPricing;
  notes?: {
    customer?: string;
  };
}

interface OrderReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function OrderReceipt({ isOpen, onClose, order }: OrderReceiptProps) {
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Invoice-${order?.orderId}`;
    window.print();
    document.title = originalTitle;
  };

  if (!isOpen || !order) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in print:hidden",
        )}
        onClick={onClose}
      />

      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] w-full max-w-4xl max-h-[calc(100vh-5rem)] overflow-auto animate-in zoom-in-95 fade-in duration-200 print:static print:max-h-none print:max-w-full print:overflow-visible print:translate-x-0 print:translate-y-0 print:w-full print:h-auto">
        <div className="bg-white border border-gray-200 shadow-2xl print:border-0 print:shadow-none print:m-0">
          {/* Header with buttons - Hidden on print */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden bg-gray-50">
            <h2 className="text-lg font-semibold">Order Receipt</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
                className="transition-all duration-200 hover:scale-110"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-8 print:p-4" id="receipt-content">
            {/* Company Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold mb-1">Jewellery Wala</h1>
              <p className="text-sm text-gray-600">Order Invoice</p>
            </div>

            {/* Order Info Bar */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 print:bg-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Order Number
                  </p>
                  <p className="font-semibold text-sm">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Order Date
                  </p>
                  <p className="font-semibold text-sm">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Package ID - Prominent Display */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">
                    Package ID
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {order.packageId}
                  </p>
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="grid grid-cols-2 gap-6 mb-6 print:grid-cols-2">
              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">
                  Shipping Address
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">
                    {order.shippingAddress?.fullName}
                  </p>
                  <p>{order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.area}</p>
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.pincode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                  <p className="pt-2">
                    Phone: {order.shippingAddress?.phone}
                  </p>
                  <p>Email: {order.shippingAddress?.email}</p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">
                Order Items
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-y border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-2 font-semibold">
                      Product
                    </th>
                    <th className="text-center py-3 px-2 font-semibold">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-4 px-2">
                        <div className="flex gap-3 items-start">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 print:h-12 print:w-12">
                            <Image
                              src={item.images?.[0] || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.colorId &&
                              typeof item.colorId === "object" &&
                              item.colorId.name && (
                                <p className="text-xs text-gray-600">
                                  Color: {item.colorId.name}
                                </p>
                              )}
                            {item.sizeId && (
                              <p className="text-xs text-gray-600">
                                Size: {item.sizeId.name}
                              </p>
                            )}
                            {item.isPersonalized && item.personalizedName && (
                              <p className="text-xs text-gray-600">
                                Personalized: {item.personalizedName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">{item.quantity}</td>
                      <td className="py-4 px-2 text-right">
                        ₹{item.priceAtPurchase?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-2 text-right font-semibold">
                        ₹
                        {(
                          item.priceAtPurchase * item.quantity
                        )?.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{order.pricing?.subtotal?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {(order.pricing?.discount?.amount ?? 0) > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-semibold text-green-600">
                        -₹
                        {order.pricing?.discount?.amount?.toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  )}
                  {(order.pricing?.shipping ?? 0) > 0 ? (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">
                        ₹{order.pricing?.shipping?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t-2 border-gray-300 text-base">
                    <span className="font-bold">Order Total:</span>
                    <span className="font-bold text-lg">
                      ₹{order.pricing?.total?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            {order.notes?.customer && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h4 className="font-semibold text-sm mb-2">
                  Customer Note:
                </h4>
                <p className="text-sm text-gray-700">
                  {order.notes.customer}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <div className="text-center space-y-2">
                <p className="font-semibold">Thank you for your order!</p>
                <p className="text-sm text-gray-600">
                  Questions about your order? Contact us at support@jewellerywalla.com
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  This is a computer-generated invoice and does not require a
                  signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          .fixed:has(#receipt-content),
          .fixed:has(#receipt-content) *,
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }

          .fixed:has(#receipt-content) {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #receipt-content {
            padding: 0.5cm !important;
            margin: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .bg-gray-50,
          .bg-blue-50 {
            page-break-inside: avoid;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
}
