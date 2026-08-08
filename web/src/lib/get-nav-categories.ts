"use cache";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_NAVIGATION } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";
import type { CategoryData } from "@/types";

export async function getNavCategories(): Promise<CategoryData[]> {
  cacheLife("navigation");
  cacheTag(TAG_NAVIGATION);

  try {
    const res = await serverFetch("/api/website/nav", { timeout: 5000 });
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}