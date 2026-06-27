"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface OrderActivityItem {
  _id: string;
  orderId: string;
  userId?: {
    name?: string;
    avatar?: string;
  };
  status: string;
  createdAt: string;
}

interface RecentOrdersProps {
  activity?: OrderActivityItem[];
}

export function RecentOrders({ activity }: RecentOrdersProps) {
  const formatOrderDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 h-full">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity?.map((order, index) => (
            <div
              key={order._id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-in slide-in-from-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage
                  src={order.userId?.avatar || "/placeholder.svg"}
                  alt={order.userId?.name || "User"}
                />
                <AvatarFallback>
                  {order.userId?.name ? order.userId.name[0] : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {order.userId?.name || "Customer"}
                  </p>
                  <Badge
                    variant={
                      order.status === "confirmed" ? "default" : "outline"
                    }
                    className="ml-2 text-xs"
                  >
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {order.orderId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatOrderDate(order.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {activity?.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No recent orders
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
