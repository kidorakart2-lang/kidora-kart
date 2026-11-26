"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { RecentActivity } from "@/components/recent-activity";
import { RecentOrders } from "@/components/recent-orders";
import {
  RevenueLineChart,
  OrderStatusChart,
  MonthlyBarChart,
  CategoryBarChart,
  UserGrowthChart,
  type ChartData,
  type RevenueTrendItem,
  type OrderStatusItem,
  type TopCategoryItem,
  type UserGrowthItem,
} from "@/components/dashboard-charts";
import { ShoppingCart, Users, Package, IndianRupee } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface DashboardStats {
  lastWeek: {
    newUsers: number;
    newOrders: number;
    revenue: number;
    startDate: string;
    endDate: string;
  };
  totals: {
    users: number;
    orders: number;
    products: number;
    revenue: number;
  };
  charts: ChartData;
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
  recentUsers: ActivityItem[];
  recentOrders: OrderActivityItem[];
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.post("/api/admin/dashboard/get-dashboard-stats", {}),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErrorObj,
    refetch: refetchActivity,
  } = useQuery<ActivityData>({
    queryKey: ["dashboard-activity"],
    queryFn: () => api.post("/api/admin/dashboard/get-recent-activity", {}),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const isLoading = statsLoading || activityLoading;
  const hasError = statsError || activityError;

  const chartData: ChartData | null = stats?.charts ?? null;
  const revenueTrend: RevenueTrendItem[] = chartData?.revenueTrend ?? [];
  const orderStatus: OrderStatusItem[] = chartData?.orderStatus ?? [];
  const topCategories: TopCategoryItem[] = chartData?.topCategories ?? [];
  const userGrowth: UserGrowthItem[] = chartData?.userGrowth ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="admin-hero rounded-xl border border-[#c6a875]/25 px-6 py-7 sm:px-8">
          <Skeleton className="mb-3 h-2.5 w-28 bg-white/10" />
          <Skeleton className="h-9 w-64 bg-white/10" />
          <Skeleton className="mt-3 h-4 w-80 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[416px]" />
          <Skeleton className="h-[416px]" />
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
        <div className="admin-hero relative overflow-hidden rounded-xl border border-[#c6a875]/25 px-6 py-7 sm:px-8">
          <p className="admin-eyebrow mb-2">✦ Store overview</p>
          <h1 className="admin-display text-3xl text-[#faf7f3] sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#faf7f3]/60">
            Here&apos;s what&apos;s happening across your store today.
          </p>
        </div>
        <ErrorState
          message={errMsg}
          onRetry={() => { refetchStats(); refetchActivity(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="admin-hero relative overflow-hidden rounded-xl border border-[#c6a875]/25 px-6 py-7 sm:px-8">
        <p className="admin-eyebrow mb-2">✦ Store overview</p>
        <h1 className="admin-display text-3xl text-[#faf7f3] sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#faf7f3]/60">
          Here&apos;s what&apos;s happening across your store today.
        </p>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="space-y-8">
        <div>
          <h2 className="admin-display mb-4 text-xl text-foreground">Last Week</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="New Users"
              value={stats?.lastWeek?.newUsers ?? 0}
              change={0}
              icon={Users}
            />
            <StatCard
              title="New Orders"
              value={stats?.lastWeek?.newOrders ?? 0}
              change={0}
              icon={ShoppingCart}
            />
            <StatCard
              title="Revenue"
              value={stats?.lastWeek?.revenue ?? 0}
              change={0}
              icon={IndianRupee}
            />
          </div>
        </div>

        <div>
          <h2 className="admin-display mb-4 text-xl text-foreground">All Time</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totals?.users ?? 0}
              change={0}
              icon={Users}
            />
            <StatCard
              title="Total Orders"
              value={stats?.totals?.orders ?? 0}
              change={0}
              icon={ShoppingCart}
            />
            <StatCard
              title="Total Products"
              value={stats?.totals?.products ?? 0}
              change={0}
              icon={Package}
            />
            <StatCard
              title="Revenue"
              value={stats?.totals?.revenue ?? 0}
              change={0}
              icon={IndianRupee}
            />
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueLineChart data={revenueTrend} />
        </div>
        <div>
          <OrderStatusChart data={orderStatus} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyBarChart data={revenueTrend} />
        <UserGrowthChart data={userGrowth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryBarChart data={topCategories} />
        <div>
          <RecentActivity activity={activity?.recentUsers} />
        </div>
      </div>

      <div>
        <RecentOrders activity={activity?.recentOrders} />
      </div>
    </div>
  );
}
