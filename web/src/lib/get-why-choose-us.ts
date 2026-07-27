"use cache";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_HOMEPAGE } from "@/lib/revalidation-tags";

export async function getWhyChooseUs() {
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const response = await fetch(
      "/api/website/whyChooseUs"
    );
    const data = await response.json();
    if (response.ok) {
      return data._data;
    }
  } catch {
    return null;
  }
}
