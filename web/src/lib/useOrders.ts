"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserOrders, getOrderById, cancelOrder } from "./orderService";
import type {
  OrderData,
  OrderDetailApiResponse,
  OrderListApiResponse,
  OrderTrackingResponse,
} from "@/types";

/**
 * Query key factory for order queries.
 */
export const orderKeys = {
  all: ["orders"] as const,
  list: (params: Record<string, unknown>) => ["orders", "list", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

interface UserOrdersResult {
  orders: OrderData[];
  totalPages: number;
  currentPage: number;
  totalOrders: number;
}

/**
 * Fetch paginated user orders with optional status filter.
 */
export function useUserOrders(params: { page: number; limit?: number; status?: string }) {
  return useQuery<UserOrdersResult>({
    queryKey: orderKeys.list(params),
    queryFn: async () => {
      const res = (await getUserOrders(params)) as OrderListApiResponse;
      const orders = res.orders ?? [];
      return {
        orders,
        totalPages: res.totalPages ?? 1,
        currentPage: res.currentPage ?? params.page,
        totalOrders: res.totalOrders ?? orders.length,
      };
    },
    staleTime: 30 * 1000, // 30s — orders can change frequently
  });
}

/**
 * Fetch a single order by ID (orderNumber or MongoDB _id).
 */
export function useOrderById(id: string | null | undefined) {
  return useQuery<OrderTrackingResponse | null>({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = (await getOrderById(id as string)) as OrderDetailApiResponse;
      return res.order ? { order: res.order } : null;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    retry: 2,
  });
}

/**
 * Cancel an order mutation — invalidates order list and detail caches on success.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
