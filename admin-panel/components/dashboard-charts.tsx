"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusItem {
  status: string;
  value: number;
}

export interface TopCategoryItem {
  name: string;
  sales: number;
}

export interface UserGrowthItem {
  month: string;
  users: number;
}

export interface ChartData {
  revenueTrend: RevenueTrendItem[];
  orderStatus: OrderStatusItem[];
  topCategories: TopCategoryItem[];
  userGrowth: UserGrowthItem[];
}

// ── Chart Configurations ───────────────────────────────────────────────

const revenueChartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  target: { label: "Target", color: "var(--chart-3)" },
};

const orderStatusConfig: ChartConfig = {
  delivered: { label: "Delivered", color: "var(--chart-1)" },
  processing: { label: "Processing", color: "var(--chart-2)" },
  shipped: { label: "Shipped", color: "var(--chart-3)" },
  pending: { label: "Pending", color: "var(--chart-4)" },
  cancelled: { label: "Cancelled", color: "var(--chart-5)" },
};

const categoryConfig: ChartConfig = {};

const growthConfig: ChartConfig = {
  users: { label: "New Users", color: "var(--chart-3)" },
};

const monthlyBarConfig: ChartConfig = {
  orders: { label: "Orders", color: "var(--chart-3)" },
  revenue: { label: "Revenue", color: "var(--chart-1)" },
};

const statusColorMap: Record<string, string> = {
  delivered: "var(--chart-1)",
  processing: "var(--chart-2)",
  shipped: "var(--chart-3)",
  pending: "var(--chart-4)",
  cancelled: "var(--chart-5)",
};

// ── Chart Components ───────────────────────────────────────────────────

interface RevenueLineChartProps {
  data: RevenueTrendItem[];
}

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(0)}k`;
  const lastMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];
  const change =
    lastMonth && prevMonth
      ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
      : null;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue — last {data.length} months</CardDescription>
          </div>
          {change !== null && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+{change}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueChartConfig} className="aspect-[2/1]">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
            <YAxis
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-revenue)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface OrderStatusChartProps {
  data: OrderStatusItem[];
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const totalOrders = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>No orders yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const colouredData = data.map((item) => ({
    ...item,
    fill: statusColorMap[item.status] ?? "var(--chart-5)",
  }));

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
        <CardDescription>Distribution of {totalOrders.toLocaleString()} total orders</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={orderStatusConfig} className="aspect-[1.2/1]">
          <PieChart>
            <Pie
              data={colouredData}
              dataKey="value"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              strokeWidth={2}
            >
              {colouredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${((Number(value) / totalOrders) * 100).toFixed(1)}%`}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {colouredData.map((item) => (
            <div key={item.status} className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground capitalize">{item.status}</span>
              <span className="font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyBarChartProps {
  data: RevenueTrendItem[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders & Revenue</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <CardHeader>
        <CardTitle>Orders & Revenue</CardTitle>
        <CardDescription>Monthly comparison — last {data.length} months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={monthlyBarConfig} className="aspect-[2/1]">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === "revenue"
                      ? `₹${Number(value).toLocaleString()}`
                      : Number(value).toLocaleString()
                  }
                />
              }
            />
            <Bar
              yAxisId="left"
              dataKey="orders"
              fill="var(--color-orders)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </BarChart>
        </ChartContainer>
        <ChartLegend>
          <ChartLegendContent />
        </ChartLegend>
      </CardContent>
    </Card>
  );
}

interface CategoryBarChartProps {
  data: TopCategoryItem[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>No sales data yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>Products sold by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={categoryConfig} className="aspect-[1.5/1]">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              className="text-xs"
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString()} sold`}
                />
              }
            />
            <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--chart-${(index % 5) + 1}))`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
          {data.slice(0, 6).map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: `var(--chart-${(i % 5) + 1}))` }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">{item.sales}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface UserGrowthChartProps {
  data: UserGrowthItem[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lastMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];
  const change =
    lastMonth && prevMonth && prevMonth.users > 0
      ? (((lastMonth.users - prevMonth.users) / prevMonth.users) * 100).toFixed(1)
      : null;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users per month</CardDescription>
          </div>
          {change !== null && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+{change}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={growthConfig} className="aspect-[2/1]">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
            <YAxis className="text-xs" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="users"
              stroke="var(--color-users)"
              strokeWidth={2}
              fill="url(#userGradient)"
              dot={{ r: 3, fill: "var(--color-users)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
