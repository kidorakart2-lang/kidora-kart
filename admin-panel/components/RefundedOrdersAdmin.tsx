import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { AlertDialogUse } from "@/components/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefundOrderCard } from "@/components/refund/RefundOrderCard";
import type { RefundOrder, CategorizedOrders, OrdersSummary } from "@/lib/types";

const BASE_URL = "/api/admin/orders";

const RefundedOrdersAdmin = () => {
  const [orders, setOrders] = useState<CategorizedOrders>({
    pending: [],
    initiated: [],
    completed: [],
    failed: [],
    mismatched: [],
  });
  const [summary, setSummary] = useState<OrdersSummary>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("mismatched");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    resolve?: (value: boolean) => void;
  }>({ open: false, title: "", description: "" });

  const confirm = useCallback(
    (title: string, description: string, confirmText?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmDialog({ open: true, title, description, confirmText, resolve });
      });
    },
    [],
  );

  const syncAllFromRazorpay = async () => {
    const confirmed = await confirm(
      "Sync Refund Statuses",
      "This will sync all pending/initiated refund statuses from Razorpay. Continue?",
      "Sync",
    );
    if (!confirmed) return;

    try {
      setSyncing(true);
      const response = await fetch(`${BASE_URL}/admin/refund/sync`, {
        method: "POST",
        credentials: "include",
      });
      const text = await response.text();
      const responseData: { success?: boolean; message?: string; data?: { total?: number; updated?: number; alreadyUpToDate?: number; failed?: unknown[] } } = JSON.parse(text);

      if (responseData.success) {
        const syncData = responseData.data;
        toast({
          title: "Sync Completed",
          description:
            `Total: ${syncData?.total ?? 0} | ` +
            `Updated: ${syncData?.updated ?? 0} | ` +
            `Already up-to-date: ${syncData?.alreadyUpToDate ?? 0} | ` +
            `Failed: ${syncData?.failed?.length ?? 0}`,
        });
        await fetchRefundedOrders();
      } else {
        toast({
          title: "Sync failed",
          description: responseData.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error during sync",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRefundedOrders();
  }, []);

  const fetchRefundedOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/admin/refunded`, {
        method: "GET",
        credentials: "include",
      });
      const text = await response.text();
      let responseData: { success?: boolean; message?: string; data?: { categorized?: CategorizedOrders; summary?: OrdersSummary } };
      try {
        responseData = JSON.parse(text);
      } catch {
        setError(`Server returned ${response.status}: ${text.slice(0, 200)}`);
        return;
      }

      if (responseData.success) {
        const data = responseData.data;
        if (data?.categorized) setOrders(data.categorized);
        if (data?.summary) setSummary(data.summary);
      } else {
        setError(responseData.message || "Failed to fetch orders");
      }
    } catch (err: unknown) {
      setError("Network error: " + (err instanceof Error ? err.message : "Unknown error"));
      console.error("Error fetching refunded orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndUpdateRefundStatus = async (
    orderId: string,
    _newStatus: string | null,
    suggestedStatus: string | null = null,
    order: RefundOrder | null = null,
  ) => {
    try {
      const statusToUse = suggestedStatus || _newStatus || "completed";
      setUpdating((prev) => ({ ...prev, [orderId]: true }));

      const verifyResponse = await fetch(`${BASE_URL}/admin/refund/verify/${orderId}`, {
        method: "GET",
        credentials: "include",
      });
      const verifyText = await verifyResponse.text();
      let verifyResult: {
        success?: boolean;
        error?: string;
        message?: string;
        data?: {
          razorpayStatus?: { status?: string; mappedStatus?: string; amount?: number; refundId?: string };
        };
      };
      try {
        verifyResult = JSON.parse(verifyText);
      } catch {
        toast({
          title: "Server error",
          description: `Server returned ${verifyResponse.status}: ${verifyText.slice(0, 200)}`,
          variant: "destructive",
        });
        setUpdating((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      if (!verifyResult.success) {
        const skipVerification = await confirm(
          "Razorpay Verification Failed",
          `Unable to verify with Razorpay:\n${verifyResult.error || verifyResult.message}\n\nDo you want to proceed WITHOUT Razorpay verification?`,
          "Skip Verification",
        );
        if (!skipVerification) {
          setUpdating((prev) => ({ ...prev, [orderId]: false }));
          return;
        }
        return await updateRefundStatusDirectly(orderId, statusToUse, order, true);
      }

      const razorpayStatus = verifyResult.data?.razorpayStatus ?? {};
      let confirmDescription =
        `Current DB Status: ${order?.cancellation?.refundStatus || "Unknown"}\n` +
        `Razorpay Status: ${razorpayStatus.status} (${razorpayStatus.mappedStatus})\n` +
        `Refund Amount: ₹${razorpayStatus.amount}\n` +
        `Refund ID: ${razorpayStatus.refundId}\n\n`;

      let confirmTitle = "Razorpay Verification Results";
      let confirmText = `Update to ${statusToUse}`;

      if (razorpayStatus.mappedStatus !== statusToUse) {
        confirmTitle += " — Status Mismatch!";
        confirmText = `Proceed anyway to ${statusToUse}`;
        confirmDescription +=
          `WARNING: You're trying to update to "${statusToUse}" but Razorpay shows "${razorpayStatus.mappedStatus}"!\n\n` +
          `Recommended: Update to "${razorpayStatus.mappedStatus}" instead.\n\n` +
          `Do you want to proceed with "${statusToUse}" anyway?`;
      } else {
        confirmDescription += `Status matches Razorpay records. Proceed with updating?`;
      }

      const isConfirmed = await confirm(confirmTitle, confirmDescription, confirmText);
      if (!isConfirmed) {
        setUpdating((prev) => ({ ...prev, [orderId]: false }));
        return;
      }
      await updateRefundStatusDirectly(orderId, statusToUse, order, false);
    } catch (err: unknown) {
      toast({
        title: "Error during verification",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      console.error("Error verifying refund status:", err);
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const updateRefundStatusDirectly = async (
    orderId: string,
    statusToUse: string,
    order: RefundOrder | null,
    skipVerification = false,
  ) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/refund/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundStatus: statusToUse,
          skipVerification,
          notes: `Status updated from admin panel to ${statusToUse}${skipVerification ? " (without Razorpay verification)" : ""}`,
        }),
      });
      const patchText = await response.text();
      let updateResult: { success?: boolean; verified?: boolean; message?: string; data?: { suggestion?: string } };
      try {
        updateResult = JSON.parse(patchText);
      } catch {
        toast({
          title: "Server error",
          description: `Server returned ${response.status}: ${patchText.slice(0, 200)}`,
          variant: "destructive",
        });
        return;
      }

      if (updateResult.success) {
        await fetchRefundedOrders();
        toast({
          title: updateResult.verified
            ? "Refund status updated and verified with Razorpay!"
            : "Refund status updated (verification skipped)",
        });
      } else {
        toast({
          title: "Failed to update",
          description: updateResult.data?.suggestion || updateResult.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error updating status",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      console.error("Error updating refund status:", err);
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleUpdateStatus = (order: RefundOrder, suggested?: string | null) => {
    verifyAndUpdateRefundStatus(order._id, null, suggested ?? null, order);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-lg text-muted-foreground">Loading refunded orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
        <AlertCircle className="w-6 h-6 text-destructive inline mr-2" />
        <span className="text-destructive">{error}</span>
        <Button variant="link" onClick={fetchRefundedOrders} className="ml-4">Retry</Button>
      </div>
    );
  }

  const currentOrders = orders[activeTab as keyof CategorizedOrders] || [];

  return (
    <div className="p-6 bg-muted/50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Refunded Orders Management</h1>
          <div className="flex gap-2">
            <Button onClick={syncAllFromRazorpay} disabled={syncing} variant="secondary">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from Razorpay"}
            </Button>
            <Button onClick={fetchRefundedOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-card w-full justify-start rounded-lg border p-1">
            {[
              { key: "mismatched", label: "Mismatched", count: summary.mismatched },
              { key: "pending", label: "Pending", count: summary.pending },
              { key: "initiated", label: "Initiated", count: summary.initiated },
              { key: "completed", label: "Completed", count: summary.completed },
              { key: "failed", label: "Failed", count: summary.failed },
            ].map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
                {tab.label}
                {(tab.count ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{tab.count}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {currentOrders.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No {activeTab} orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentOrders.map((order: RefundOrder) => (
              <RefundOrderCard
                key={order._id}
                order={order}
                showUpdateButton={activeTab === "mismatched" || activeTab === "pending" || activeTab === "initiated"}
                isUpdating={updating[order._id] || updating[order.orderId]}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialogUse
        isOpen={confirmDialog.open}
        onClose={() => {
          confirmDialog.resolve?.(false);
          setConfirmDialog({ open: false, title: "", description: "", resolve: undefined });
        }}
        onConfirm={() => {
          confirmDialog.resolve?.(true);
          setConfirmDialog({ open: false, title: "", description: "", resolve: undefined });
        }}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText ?? "Confirm"}
      />
    </div>
  );
};

export default RefundedOrdersAdmin;
