"use cache";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_HOMEPAGE } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";

export async function getWhyChooseUs() {
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const response = await serverFetch("/api/website/whyChooseUs", { timeout: 5000 });
    const data = await response.json();
    if (response.ok) {
      return data._data;
    }
  } catch {
    return null;
  }
}
