import { cacheLife, cacheTag } from "next/cache"
import { serverFetch } from "@/lib/server-fetch"
import BannerSlider from "./BannerSlider"
import { TAG_HOMEPAGE } from "@/lib/revalidation-tags"
import type { BannerItem } from "@/types"

async function GetBanners() {
  "use cache";
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const res = await serverFetch("/api/website/banner", { timeout: 5000 })
    const data = await res.json()
    return (data._data as BannerItem[]) ?? []
  } catch {
    return []
  }
}

export default async function DefaultBanner() {
  const banners = (await GetBanners()) ?? []

  const slides = banners.map((item) => ({
    src: item.image,
    href: item.link?.url || undefined,
    external: item.link?.type === "external",
  }))

  // No banners configured? The carousel still renders its gradient hero so the
  // homepage never opens on a bare header.
  return <BannerSlider slides={slides} />
}
