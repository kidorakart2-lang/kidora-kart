"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, RefreshCcw, AlertTriangle } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";

interface MismatchedOrder {
  orderId: string;
  razorpay: {
    paymentId: string;
    amount: string;
    status: string;
    createdAt: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
}

export default function PendingPaymentFix() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mismatchedOrders, setMismatchedOrders] = useState<MismatchedOrder[]>(
    [],
  );
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const checkPendingPayments = async () => {
    try {
      setLoading(true);
      setSearched(false);
      const data = await api.post<{ mismatches: MismatchedOrder[] }>(
        "/api/admin/orders/verify-pending-payments",
        { time: 48 },
      );

      setMismatchedOrders(data.mismatches || []);
      setSearched(true);
      if (data.mismatches?.length === 0) {
        toast({
          title: "All Good",
          description:
            "No mismatched pending payments found in the last 48 hours.",
        });
      } else {
        toast({
          title: "Issues Found",
          description: `Found ${data.mismatches?.length || 0} orders with payment issues.`,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof ApiClientError ? error.message : "Failed to check pending payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixOrder = async (order: MismatchedOrder) => {
    try {
      setVerifying(true);
      await api.post("/api/admin/orders/confirm-pending-payment", {
        orderId: order.orderId,
        paymentId: order.razorpay.paymentId,
        paymentDate: order.razorpay.createdAt,
      });

      toast({
        title: "Success",
        description: `Order ${order.orderId} fixed and confirmed! Email sent to user.`,
      });
      setMismatchedOrders((prev) =>
        prev.filter((o) => o.orderId !== order.orderId),
      );
    } catch (error: unknown) {
      toast({
        title: "Failed to Fix",
        description:
          error instanceof ApiClientError ? error.message : "Could not update order status",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Payment Verification
            </CardTitle>
            <CardDescription>
              Check for orders where payment was successful but status is stuck
              on &apos;pending&apos;.
            </CardDescription>
          </div>
          <Button
            onClick={checkPendingPayments}
            disabled={loading}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Check Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {mismatchedOrders.length > 0 && (
        <CardContent>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Razorpay Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mismatchedOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">
                      {order.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.user?.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>₹{order.razorpay.amount}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white shadow hover:bg-green-500/80">
                        {order.razorpay.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => fixOrder(order)}
                        disabled={verifying}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {verifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Fix & Confirm
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
      {searched && mismatchedOrders.length === 0 && !loading && (
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            No mismatched orders found in the last 48 hours.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
