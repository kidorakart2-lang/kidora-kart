import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AlertDialogUse } from "@/components/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface OrderUser {
  name?: string;
  email?: string;
}

interface OrderCancellation {
  refundStatus?: string;
  refundAmount?: number;
  refundId?: string;
  refundError?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

interface OrderPricing {
  total?: number;
}

interface OrderPayment {
  status?: string;
}

interface RefundOrder {
  _id: string;
  orderId: string;
  userId?: OrderUser;
  status: string;
  payment?: OrderPayment;
  pricing?: OrderPricing;
  issue?: string;
  suggestedStatus?: string;
  cancellation?: OrderCancellation;
}

interface CategorizedOrders {
  pending: RefundOrder[];
  initiated: RefundOrder[];
  completed: RefundOrder[];
  failed: RefundOrder[];
  mismatched: RefundOrder[];
}

interface OrdersSummary {
  pending?: number;
  initiated?: number;
  completed?: number;
  failed?: number;
  mismatched?: number;
}

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

  const BASE_URL = "/api/admin/orders";

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

      const result = await response.json();

      if (result.success) {
        const syncData = result.data as {
          total?: number;
          updated?: number;
          alreadyUpToDate?: number;
          failed?: unknown[];
        };
        toast({
          title: "✅ Sync Completed",
          description:
            `Total: ${syncData?.total ?? 0} | ` +
            `Updated: ${syncData?.updated ?? 0} | ` +
            `Already up-to-date: ${syncData?.alreadyUpToDate ?? 0} | ` +
            `Failed: ${syncData?.failed?.length ?? 0}`,
        });
        await fetchRefundedOrders();
      } else {
        toast({
          title: "❌ Sync failed",
          description: result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "❌ Error during sync",
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

      const result = await response.json();

      if (result.success) {
        setOrders(result.data.categorized);
        setSummary(result.data.summary);
      } else {
        setError(result.message || "Failed to fetch orders");
      }
    } catch (err: unknown) {
      setError(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
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

      // Step 1: Verify with Razorpay first
      const verifyResponse = await fetch(
        `${BASE_URL}/admin/refund/verify/${orderId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        const skipVerification = await confirm(
          "Razorpay Verification Failed",
          `⚠️ Unable to verify with Razorpay:\n${verifyResult.error || verifyResult.message}\n\n` +
            `Do you want to proceed WITHOUT Razorpay verification?`,
          "Skip Verification",
        );

        if (!skipVerification) {
          setUpdating((prev) => ({ ...prev, [orderId]: false }));
          return;
        }

        // Proceed without verification
        return await updateRefundStatusDirectly(orderId, statusToUse, order, true);
      }

      // Step 2: Show verification results and ask for confirmation
      const razorpayStatus = verifyResult.data.razorpayStatus as {
        status?: string;
        mappedStatus?: string;
        amount?: number;
        refundId?: string;
      };

      let confirmDescription = `Current DB Status: ${order?.cancellation?.refundStatus || "Unknown"}\n`;
      confirmDescription += `Razorpay Status: ${razorpayStatus.status} (${razorpayStatus.mappedStatus})\n`;
      confirmDescription += `Refund Amount: ₹${razorpayStatus.amount}\n`;
      confirmDescription += `Refund ID: ${razorpayStatus.refundId}\n\n`;

      let confirmTitle = "Razorpay Verification Results";
      let confirmText = `Update to ${statusToUse}`;

      if (razorpayStatus.mappedStatus !== statusToUse) {
        confirmTitle += " — Status Mismatch!";
        confirmText = `Proceed anyway to ${statusToUse}`;
        confirmDescription += `⚠️ WARNING: You're trying to update to "${statusToUse}" but Razorpay shows "${razorpayStatus.mappedStatus}"!\n\n`;
        confirmDescription += `Recommended: Update to "${razorpayStatus.mappedStatus}" instead.\n\n`;
        confirmDescription += `Do you want to proceed with "${statusToUse}" anyway?`;
      } else {
        confirmDescription += `✅ Status matches Razorpay records. Proceed with updating?`;
      }

      const isConfirmed = await confirm(confirmTitle, confirmDescription, confirmText);

      if (!isConfirmed) {
        setUpdating((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      // Step 3: Update the status
      await updateRefundStatusDirectly(orderId, statusToUse, order, false);
    } catch (err: unknown) {
      toast({
        title: "❌ Error during verification",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refundStatus: statusToUse,
          skipVerification: skipVerification,
          notes: `Status updated from admin panel to ${statusToUse}${skipVerification ? " (without Razorpay verification)" : ""}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchRefundedOrders();
        toast({
          title: result.verified
            ? "✅ Refund status updated and verified with Razorpay!"
            : "✅ Refund status updated (verification skipped)",
        });
      } else {
        toast({
          title: "❌ Failed to update",
          description: result.data?.suggestion || result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "❌ Error updating status",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      console.error("Error updating refund status:", err);
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<
      string,
      { color: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      initiated: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      mismatched: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const OrderCard = ({
    order,
    showUpdateButton = false,
  }: {
    order: RefundOrder;
    showUpdateButton?: boolean;
  }) => {
    const isUpdating = updating[order._id] || updating[order.orderId];

    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {order.orderId}
            </h3>
            <p className="text-sm text-gray-600">
              Customer: {order.userId?.name || "N/A"} ({order.userId?.email})
            </p>
          </div>
          {getStatusBadge(order.cancellation?.refundStatus ?? "pending")}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-600">Order Status:</span>
            <span className="ml-2 font-medium">{order.status}</span>
          </div>
          <div>
            <span className="text-gray-600">Payment Status:</span>
            <span className="ml-2 font-medium">
              {order.payment?.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Refund Amount:</span>
            <span className="ml-2 font-medium">
              ₹
              {order.cancellation?.refundAmount ||
                order.pricing?.total ||
                0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Refund ID:</span>
            <span className="ml-2 font-medium text-xs">
              {order.cancellation?.refundId || "N/A"}
            </span>
          </div>
        </div>

        {order.issue && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
            <p className="text-sm text-orange-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>Issue:</strong> {order.issue}
            </p>
            {order.suggestedStatus && (
              <p className="text-sm text-orange-700 mt-1">
                <strong>Suggested:</strong> Update to &quot;
                {order.suggestedStatus}&quot;
              </p>
            )}
          </div>
        )}

        {order.cancellation?.refundError && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs text-red-800">
              <strong>Error:</strong> {order.cancellation.refundError}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-3">
          {order.cancellation?.cancelledAt && (
            <div>
              Cancelled:{" "}
              {new Date(order.cancellation.cancelledAt).toLocaleString()}
            </div>
          )}
          {order.cancellation?.refundedAt && (
            <div>
              Refunded:{" "}
              {new Date(order.cancellation.refundedAt).toLocaleString()}
            </div>
          )}
        </div>

        {showUpdateButton && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {order.suggestedStatus ? (
                <button
                  onClick={() =>
                    verifyAndUpdateRefundStatus(
                      order._id,
                      null,
                      order.suggestedStatus,
                      order,
                    )
                  }
                  disabled={isUpdating}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isUpdating
                    ? "Updating..."
                    : `Update to ${order.suggestedStatus}`}
                </button>
              ) : (
                <button
                  onClick={() =>
                    verifyAndUpdateRefundStatus(order._id, "completed", null, order)
                  }
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 text-sm transition-colors"
                >
                  {isUpdating ? "..." : "Mark Completed"}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              ✓ Verified with Razorpay
            </p>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { key: "mismatched", label: "Mismatched", count: summary.mismatched },
    { key: "pending", label: "Pending", count: summary.pending },
    { key: "initiated", label: "Initiated", count: summary.initiated },
    { key: "completed", label: "Completed", count: summary.completed },
    { key: "failed", label: "Failed", count: summary.failed },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Loading refunded orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <AlertCircle className="w-6 h-6 text-red-600 inline mr-2" />
        <span className="text-red-800">{error}</span>
        <button
          onClick={fetchRefundedOrders}
          className="ml-4 text-red-600 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentOrders = orders[activeTab as keyof CategorizedOrders] || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Refunded Orders Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={syncAllFromRazorpay}
              disabled={syncing}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync from Razorpay"}
            </button>
            <button
              onClick={fetchRefundedOrders}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {(tab.count ?? 0) > 0 && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.key ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        {currentOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              No {activeTab} orders found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentOrders.map((order: RefundOrder) => (
              <OrderCard
                key={order._id}
                order={order}
                showUpdateButton={
                  activeTab === "mismatched" ||
                  activeTab === "pending" ||
                  activeTab === "initiated"
                }
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
