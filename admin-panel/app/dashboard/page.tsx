"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { RecentActivity } from "@/components/recent-activity";
import { RecentOrders } from "@/components/recent-orders";
import { ShoppingCart, Users, Package, IndianRupee, AlertCircle, RefreshCw } from "lucide-react";
import RefundedOrdersAdmin from "@/components/RefundedOrdersAdmin";
import PendingPaymentFix from "@/components/PendingPaymentFix";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";


interface DashboardStats {
  lastWeek?: {
    newUsers?: number;
    newOrders?: number;
    revenue?: number;
  };
  totals?: {
    users?: number;
    orders?: number;
    products?: number;
    revenue?: number;
  };
}

interface ActivityItem {
  _id: string;
  name: string;
  email?: string;
  action: string;
  avatar?: string;
  createdAt: string;
}

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

interface ActivityData {
  recentUsers?: ActivityItem[];
  recentOrders?: OrderActivityItem[];
}

export default function DashboardPage() {
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    return api.post("/api/admin/dashboard/get-dashboard-stats", {});
  };

  const fetchRecentActivity = async (): Promise<ActivityData> => {
    return api.post("/api/admin/dashboard/get-recent-activity", {});
  };

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErrorObj,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: fetchRecentActivity,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const isLoading = statsLoading || activityLoading;
  const hasError = statsError || activityError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    const errMsg =
      statsErrorObj instanceof ApiClientError
        ? statsErrorObj.message
        : activityErrorObj instanceof ApiClientError
          ? activityErrorObj.message
          : "Something went wrong while fetching dashboard data";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{errMsg}</p>
          <Button onClick={() => { refetchStats(); refetchActivity(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top duration-300">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Last Week</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="New Users"
              value={stats?.lastWeek?.newUsers ?? 0}
              change={0}
              icon={Users}
              delay={0}
            />
            <StatCard
              title="New Orders"
              value={stats?.lastWeek?.newOrders ?? 0}
              change={0}
              icon={ShoppingCart}
              delay={100}
            />
            <StatCard
              title="Revenue"
              value={stats?.lastWeek?.revenue ?? 0}
              change={0}
              icon={IndianRupee}
              delay={200}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">All Time</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totals?.users ?? 0}
              change={0}
              icon={Users}
              delay={0}
            />
            <StatCard
              title="Total Orders"
              value={stats?.totals?.orders ?? 0}
              change={0}
              icon={ShoppingCart}
              delay={100}
            />
            <StatCard
              title="Total Products"
              value={stats?.totals?.products ?? 0}
              change={0}
              icon={Package}
              delay={200}
            />
            <StatCard
              title="Revenue"
              value={stats?.totals?.revenue ?? 0}
              change={0}
              icon={IndianRupee}
              delay={250}
            />
          </div>
        </div>
      </div>

      <PendingPaymentFix />

      <div>
        <RefundedOrdersAdmin />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivity activity={activity?.recentUsers} />
        <RecentOrders activity={activity?.recentOrders} />
      </div>
    </div>
  );
}
