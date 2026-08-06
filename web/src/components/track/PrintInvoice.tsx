"use client";

import { Package } from "lucide-react";
import type { OrderTrackingResponse } from "@/types";

interface PrintInvoiceProps {
  order?: OrderTrackingResponse["order"];
}

export default function PrintInvoice({ order }: PrintInvoiceProps) {
  if (!order) return null;

  return (
    <div className="print-only bg-white" id="print-invoice">
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-1">Jewellery Walla</h1>
        <p className="text-sm text-gray-600">Order Invoice</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Order Number</p>
            <p className="font-semibold">{order.orderId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Order Date</p>
            <p className="font-semibold">{new Date(order.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>

      {order.shipping?.trackingNumber && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-rose-600" />
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">AWB / Tracking ID</p>
              <p className="text-lg font-bold text-rose-900">{order.shipping.trackingNumber}</p>
            </div>
          </div>
          {order.shipping.carrier && <p className="text-xs text-rose-700 mt-1">Courier: {order.shipping.carrier}</p>}
        </div>
      )}

      <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-rose-600" />
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Package ID</p>
            <p className="text-lg font-bold text-rose-900">{order.packageId}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">Shipping Address</h3>
        <div className="text-sm space-y-1">
          <p className="font-semibold">{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.street}</p>
          <p>{order.shippingAddress?.area}</p>
          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
          <p>India</p>
          <p className="pt-2">Phone: {order.shippingAddress?.phone}</p>
          <p>Email: {order.shippingAddress?.email}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">Order Items</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300">
              <th className="text-left py-3 px-2 font-semibold">Product</th>
              <th className="text-center py-3 px-2 font-semibold">Qty</th>
              <th className="text-right py-3 px-2 font-semibold">Price</th>
              <th className="text-right py-3 px-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-3 px-2">
                  <p className="font-medium">{item.name}</p>
                  {item.variantName && <p className="text-xs font-semibold text-gray-700">{item.variantName}</p>}
                  <p className="text-xs text-gray-500">Color: {item.colorId?.name}</p>
                  {item.sizeId && (
                    <p className="text-xs text-gray-500">Size: {typeof item.sizeId === "string" ? item.sizeId : item.sizeId?.name}</p>
                  )}
                  {item.isPersonalized && item.personalizedName && <p className="text-xs text-gray-500">Personalized: {item.personalizedName}</p>}
                </td>
                <td className="py-3 px-2 text-center">{item.quantity}</td>
                <td className="py-3 px-2 text-right">₹{item.priceAtPurchase?.toLocaleString("en-IN")}</td>
                <td className="py-3 px-2 text-right font-semibold">₹{(item.subtotal ?? item.priceAtPurchase * item.quantity)?.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-80">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">₹{order.pricing?.subtotal?.toLocaleString("en-IN")}</span></div>
            {(order.pricing?.discount?.amount ?? 0) > 0 && (
              <div className="flex justify-between py-2"><span className="text-gray-600">Discount:</span><span className="font-semibold text-amber-600">-₹{order.pricing?.discount?.amount?.toLocaleString("en-IN")}</span></div>
            )}
            <div className="flex justify-between py-2"><span className="text-gray-600">Shipping:</span><span className="font-semibold">{(order.pricing?.shipping ?? 0) > 0 ? `₹${order.pricing?.shipping?.toLocaleString("en-IN")}` : "FREE"}</span></div>
            <div className="flex justify-between py-3 border-t-2 border-gray-300 text-base"><span className="font-bold">Total:</span><span className="font-bold text-lg">₹{order.pricing?.total?.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>

      <div className="mb-6 text-sm text-gray-600">
        <p>Payment Method: {order.payment?.method === "COD" ? "Cash on Delivery" : order.payment?.method}</p>
        <p>Payment Status: <span className="capitalize">{order.payment?.status?.replace("_", " ")}</span></p>
      </div>

      {order.notes?.customer && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400">
          <h4 className="font-semibold text-sm mb-2">Customer Note:</h4>
          <p className="text-sm text-gray-700">{order.notes.customer}</p>
        </div>
      )}

      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <div className="text-center space-y-2">
          <p className="font-semibold">Thank you for your order!</p>
          <p className="text-sm text-gray-600">Questions? Contact us at {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@jewellerywalla.com"}</p>
          <p className="text-xs text-gray-500 mt-4">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}
