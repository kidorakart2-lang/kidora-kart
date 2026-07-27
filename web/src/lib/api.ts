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
  giftImages?: string[];

}

/**
 * Fetch full product details by slug.
 */
export async function fetchProductBySlug(slug: string): Promise<FetchedProduct | null> {
  const res = await fetch(`/api/website/product/details/${slug}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json._status && json._data ? (json._data as FetchedProduct) : null;
}

/**
 * Fetch multiple products by their MongoDB _id values in a single request.
 */
export async function fetchProductsByIds(ids: string[]): Promise<FetchedProduct[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/api/website/product/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json._status && Array.isArray(json._data) ? (json._data as FetchedProduct[]) : [];
}

/**
 * Fetch the server-side cart view. Returns full items with embedded product data.
 */
export async function fetchServerCart(token: string) {
  const res = await fetch(`/api/website/cart/view`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json._status && json._data ? json._data : null;
}
