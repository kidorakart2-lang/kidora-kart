"use cache";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_PRODUCTS } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";

export async function getProducts(q: string) {
  cacheLife("search");
  cacheTag(TAG_PRODUCTS);

  try {
    const response = await serverFetch(
      `/api/website/product/get-by-search?search=${q}&limit=8`,
      { timeout: 5000 },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}
