import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import type { RefundOrder } from "@/lib/types";

const STATUS_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { variant: "secondary", icon: Clock },
  initiated: { variant: "default", icon: RefreshCw },
  completed: { variant: "default", icon: CheckCircle },
  failed: { variant: "destructive", icon: XCircle },
  mismatched: { variant: "outline", icon: AlertCircle },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-300 text-yellow-700 bg-yellow-50",
  initiated: "border-blue-300 text-blue-700 bg-blue-50",
  completed: "border-green-300 text-green-700 bg-green-50",
  failed: "border-red-300 text-red-700 bg-red-50",
  mismatched: "border-orange-300 text-orange-700 bg-orange-50",
};

function getStatusBadge(status: string) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={colors}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface RefundOrderCardProps {
  order: RefundOrder;
  showUpdateButton?: boolean;
  isUpdating: boolean;
  onUpdateStatus: (order: RefundOrder, suggested?: string | null) => void;
}

export function RefundOrderCard({ order, showUpdateButton = false, isUpdating, onUpdateStatus }: RefundOrderCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {order.orderId}
            </h3>
            <p className="text-sm text-muted-foreground">
              Customer: {order.userId?.name || "N/A"} ({order.userId?.email})
            </p>
          </div>
          {getStatusBadge(order.cancellation?.refundStatus ?? "pending")}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Order Status:</span>
            <span className="ml-2 font-medium">{order.status}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Status:</span>
            <span className="ml-2 font-medium">
              {order.payment?.status}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Refund Amount:</span>
            <span className="ml-2 font-medium">
              ₹{order.cancellation?.refundAmount || order.pricing?.total || 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Refund ID:</span>
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
                <strong>Suggested:</strong> Update to &quot;{order.suggestedStatus}&quot;
              </p>
            )}
          </div>
        )}

        {order.cancellation?.refundError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-2 mb-3">
            <p className="text-xs text-destructive">
              <strong>Error:</strong> {order.cancellation.refundError}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground mb-3">
          {order.cancellation?.cancelledAt && (
            <div>
              Cancelled: {new Date(order.cancellation.cancelledAt).toLocaleString()}
            </div>
          )}
          {order.cancellation?.refundedAt && (
            <div>
              Refunded: {new Date(order.cancellation.refundedAt).toLocaleString()}
            </div>
          )}
        </div>

        {showUpdateButton && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {order.suggestedStatus ? (
                <Button
                  onClick={() => onUpdateStatus(order, order.suggestedStatus)}
                  disabled={isUpdating}
                  className="flex-1"
                  variant="outline"
                >
                  {isUpdating ? "Updating..." : `Update to ${order.suggestedStatus}`}
                </Button>
              ) : (
                <Button
                  onClick={() => onUpdateStatus(order, null)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? "..." : "Mark Completed"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Verified with Razorpay
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
