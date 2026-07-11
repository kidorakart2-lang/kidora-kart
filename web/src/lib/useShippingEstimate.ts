"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "./getAuthToken";

/**
 * Query key factory for shipping estimate queries.
 */
export const shippingEstimateKeys = {
  all: ["shipping-estimate"] as const,
  byPincode: (pincode: string, itemKey: string) =>
    ["shipping-estimate", pincode, itemKey] as const,
};

export interface ShippingEstimateData {
  estimatedCharge: number;
  courierName?: string;
  etd?: string;
}

/**
 * Fetch a shipping cost estimate from Shiprocket for the given pincode and cart items.
 *
 * - Auto-fetches when `deliveryPincode` is a valid 6-digit pincode and `items` is non-empty
 * - Caches for 2 minutes (shipping rates don't change between keystrokes)
 * - GC after 5 minutes
 * - Accepts AbortSignal via React Query's built-in signal passing
 */
export function useShippingEstimate(
  deliveryPincode: string,
  items: Array<{ productId: string; quantity: number }>,
) {
  // Build a stable string key from the items array so the query key
  // only changes when the actual product/quantity data changes.
  const itemKey = items
    .map((i) => `${i.productId}:${i.quantity}`)
    .sort()
    .join(",");

  const isValid =
    deliveryPincode.length === 6 &&
    /^\d{6}$/.test(deliveryPincode) &&
    items.length > 0;

  return useQuery({
    queryKey: shippingEstimateKeys.byPincode(deliveryPincode, itemKey),
    queryFn: async ({ signal }) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/shipping/estimate",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            deliveryPincode,
            items,
            isCod: false,
          }),
          signal,
        },
      );

      const data = await response.json();

      if (!data.success || !data.data) {
        return null;
      }

      if (data.data.available && data.data.cheapest) {
        return {
          estimatedCharge: data.data.cheapest.rate,
          courierName: data.data.cheapest.name,
          etd: data.data.cheapest.etd,
        } as ShippingEstimateData;
      }

      if (data.data.fallbackCharge) {
        return {
          estimatedCharge: data.data.fallbackCharge,
        } as ShippingEstimateData;
      }

      return null;
    },
    enabled: isValid,
    // 2 minutes — shipping rates are reasonably stable within a session
    staleTime: 2 * 60 * 1000,
    // Keep in memory 5 minutes after unmount so navigation back is instant
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
