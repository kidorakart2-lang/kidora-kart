import axios from "axios";
import Cookies from "js-cookie";
const API_URL = process.env.NEXT_PUBLIC_API_URL + "api/website";

// Get auth token from localStorage/cookies
const getAuthToken = () => {
  return Cookies.get("user"); // Adjust based on your auth setup
};

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
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
