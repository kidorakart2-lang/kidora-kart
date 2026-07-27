"use cache";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_PRODUCTS } from "@/lib/revalidation-tags";

export async function getProducts(q: string) {
  cacheLife("search");
  cacheTag(TAG_PRODUCTS);

  try {
    const response = await fetch(
      `/api/website/product/get-by-search?search=${q}&limit=8`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}
