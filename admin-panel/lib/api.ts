/**
 * Mock API functions with simulated delays
 */

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type AnyData = Record<string, unknown>;

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export async function fetchData(endpoint: string): Promise<unknown[]> {
  await delay(500);

  const mockModules: Record<string, unknown> = await import("./mock-data");
  const mockUsers = mockModules.mockUsers as unknown[];
  const mockProducts = mockModules.mockProducts as unknown[];
  const mockOrders = mockModules.mockOrders as unknown[];
  const mockCategories = mockModules.mockCategories as unknown[];
  const mockBanners = mockModules.mockBanners as unknown[];
  const mockTestimonials = mockModules.mockTestimonials as unknown[];
  const mockFAQs = mockModules.mockFAQs as unknown[];
  const mockWhyChooseUs = mockModules.mockWhyChooseUs as unknown[];
  const mockMaterials = mockModules.mockMaterials as unknown[];
  const mockColors = mockModules.mockColors as unknown[];
  const mockStats = mockModules.mockStats as unknown[];

  const data: Record<string, unknown[]> = {
    users: mockUsers,
    products: mockProducts,
    orders: mockOrders,
    categories: mockCategories,
    banners: mockBanners,
    testimonials: mockTestimonials,
    faqs: mockFAQs,
    whyChooseUs: mockWhyChooseUs,
    materials: mockMaterials,
    colors: mockColors,
    stats: mockStats,
  };

  return data[endpoint] || [];
}

export async function createItem(
  _endpoint: string,
  item: AnyData,
): Promise<AnyData> {
  await delay(300);
  return { ...item, id: Date.now() };
}

export async function updateItem(
  _endpoint: string,
  id: number,
  updates: AnyData,
): Promise<AnyData> {
  await delay(300);
  return { id, ...updates };
}

export async function deleteItem(
  _endpoint: string,
  id: number,
): Promise<{ success: boolean; id: number }> {
  await delay(300);
  return { success: true, id };
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  await delay(500);

  if (email === "admin@example.com" && password === "admin123") {
    return {
      success: true,
      token: "mock-jwt-token",
      user: { id: 1, name: "Admin User", email, role: "admin" },
    };
  }

  throw new Error("Invalid credentials");
}

export async function logout(): Promise<{ success: boolean }> {
  await delay(200);
  return { success: true };
}
