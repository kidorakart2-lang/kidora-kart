import axios from "axios";
import { getAuthToken } from "@/lib/getAuthToken";
const API_URL = process.env.NEXT_PUBLIC_API_URL + "api/website";

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401, attempt a refresh then retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Only retry once to avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh the access token via httpOnly cookie
        await fetch(`${API_URL}/user/refresh`, {
          method: "POST",
          credentials: "include",
        });
        // Retry the original request — the refreshed httpOnly cookie will be sent
        return api(originalRequest);
      } catch {
        // Refresh failed — will reject with the original 401
      }
    }
    return Promise.reject(error);
  },
);

// 1. Create Order
export const createOrder = async (orderData: Record<string, unknown>) => {
  const response = await api.post("/orders/create", orderData);
  return response.data;
};

// 2. Create Razorpay Order
export const createRazorpayOrder = async (orderId: string, isCodAdvance = false) => {
  const response = await api.post("/orders/create-razorpay-order", { orderId , isCodAdvance });
  return response.data;
};

// 3. Verify Payment
export const verifyPayment = async (paymentData: Record<string, unknown>) => {
  const response = await api.post("/orders/verify-payment", paymentData);
  return response.data;
};

export const verifyCod = async (orderId: string) => {
  const response = await api.post("/orders/buy-with-cod", { orderId });
  return response.data;
};

// 4. Get User Orders
export const getUserOrders = async (params: Record<string, unknown> = {}) => {
  const response = await api.get("/orders/my-orders", { params });
  return response.data;
};

// 5. Get Single Order
export const getOrderById = async (orderId: string) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// 6. Cancel Order
export const cancelOrder = async (orderId: string, reason: string) => {
  const response = await api.put(`/orders/${orderId}/cancel`, { reason });
  return response.data;
};

export default api;
