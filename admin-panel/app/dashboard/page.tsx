"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { RecentActivity } from "@/components/recent-activity";
import { RecentOrders } from "@/components/recent-orders";
import { ShoppingCart, Users, Package, IndianRupee } from "lucide-react";
import RefundedOrdersAdmin from "@/components/RefundedOrdersAdmin";
import PendingPaymentFix from "@/components/PendingPaymentFix";


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
    const res = await fetch(
      `/api/admin/dashboard/get-dashboard-stats`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    const data = await res.json();
    return data.data;
  };

  const fetchRecentActivity = async (): Promise<ActivityData> => {
    const res = await fetch(
      `/api/admin/dashboard/get-recent-activity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
    if (!res.ok) throw new Error("Failed to fetch activity");
    const data = await res.json();
    return data.data;
  };

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
  } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: fetchRecentActivity,
    staleTime: 60 * 60 * 1000,
  });

  if (statsLoading || activityLoading) {
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

  if (statsError || activityError) {
    return (
      <div className="text-red-500">
        Something went wrong while fetching dashboard data 😬
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
