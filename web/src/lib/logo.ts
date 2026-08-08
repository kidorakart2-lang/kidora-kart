const FALLBACK_LOGO = "/images/logo.webp";

import type { LogoData } from "@/types";
import { serverFetch } from "@/lib/server-fetch";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_HOMEPAGE } from "@/lib/revalidation-tags";

export async function getLogo(): Promise<LogoData> {
  "use cache";
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const response = await serverFetch("/api/website/logo", {
      method: "post",
      timeout: 5000,
    });

    if (!response.ok) {
      return { logo: FALLBACK_LOGO };
    }

    const json = await response.json();

    if (!json?._status || !Array.isArray(json._data) || json._data.length === 0) {
      return { logo: FALLBACK_LOGO };
    }

    return { logo: json._data[0]?.logo || FALLBACK_LOGO };
  } catch {
    return { logo: FALLBACK_LOGO };
  }
}