import { getAuthToken } from "@/lib/getAuthToken";
const API_URL = process.env.NEXT_PUBLIC_API_URL + "api/website";

async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    try {
      await fetch(`${API_URL}/user/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const newToken = getAuthToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch {
      // Refresh failed — will reject with the original 401
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { response: { data }, status: response.status };
  }

  return response;
}

export const createOrder = async (orderData: Record<string, unknown>) => {
  const response = await authFetch("/orders/create", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
  return response.json();
};

export const createRazorpayOrder = async (orderId: string, isCodAdvance = false) => {
  const response = await authFetch("/orders/create-razorpay-order", {
    method: "POST",
    body: JSON.stringify({ orderId, isCodAdvance }),
  });
  return response.json();
};

export const verifyPayment = async (paymentData: Record<string, unknown>) => {
  const response = await authFetch("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
  return response.json();
};

export const verifyCod = async (orderId: string) => {
  const response = await authFetch("/orders/buy-with-cod", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
  return response.json();
};

export const getUserOrders = async (params: Record<string, unknown> = {}) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  const response = await authFetch(`/orders/my-orders${queryString ? `?${queryString}` : ""}`);
  return response.json();
};

export const getOrderById = async (orderId: string) => {
  const response = await authFetch(`/orders/${orderId}`);
  return response.json();
};

export const cancelOrder = async (orderId: string, reason: string) => {
  const response = await authFetch(`/orders/${orderId}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
  return response.json();
};
