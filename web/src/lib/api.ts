import { serverFetch } from "@/lib/server-fetch";

export interface FetchedProduct {
  _id: string;
  name: string;
  image?: string;
  price: number;
  discount_price?: number;
  slug: string;
  stock: number;
  isPersonalized?: boolean;
  colors?: { _id: string; name: string; code?: string }[];
  sizes?: { _id: string; name: string }[];
  giftImages?: string[];
  variants?: { _id?: string; name: string; quantity: number; price: number; mrp?: number | null }[];
}

/**
 * Fetch full product details by slug.
 */
export async function fetchProductBySlug(slug: string): Promise<FetchedProduct | null> {
  try {
    const res = await serverFetch(`/api/website/product/details/${slug}`, { timeout: 8000 });
    if (!res.ok) return null;
    const json = await res.json();
    return json._status && json._data ? (json._data as FetchedProduct) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch multiple products by their MongoDB _id values in a single request.
 */
export async function fetchProductsByIds(ids: string[]): Promise<FetchedProduct[]> {
  if (ids.length === 0) return [];
  try {
    const res = await serverFetch(`/api/website/product/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      timeout: 8000,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json._status && Array.isArray(json._data) ? (json._data as FetchedProduct[]) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch the server-side cart view. Returns full items with embedded product data.
 */
export async function fetchServerCart(token: string) {
  try {
    const res = await serverFetch(`/api/website/cart/view`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json._status && json._data ? json._data : null;
  } catch {
    return null;
  }
}
