"use cache";
import { cacheLife } from "next/cache";

const FALLBACK_LOGO = "/images/logo.webp";

export type LogoData = {
  logo: string;
};

export async function getLogo(): Promise<LogoData> {
  cacheLife("navigation");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/logo`,
      { method: "post" }
    );

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
