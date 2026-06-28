import type { Slide } from "@/components/ui/images-slider";
import dynamic from "next/dynamic";
import React, { cache, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ImagesSlider = dynamic(() => import("@/components/ui/images-slider").then((m) => ({ default: m.ImagesSlider })), {
  loading: () => <Skeleton className="h-full w-full" />,
});

interface BannerLink {
  url?: string | null;
  externalUrl?: string | null;
  type?: string;
}

interface BannerItem {
  image: string;
  link?: BannerLink;
}

const GetBanners = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/banner",
      {
        next: { revalidate: 3600 },
      }
    );
    const data = await response.json();
    return (data._data as BannerItem[]) ?? [];
  } catch {
    return [];
  }
});

async function BannerContent() {
  const banners: BannerItem[] = await GetBanners();
  const slides: Slide[] = banners.map((item) => {
    const href = item.link?.url || undefined;
    const external = item.link?.type === "external";
    return { src: item.image, href, external };
  });

  return <ImagesSlider className="" slides={slides} />;
}

// Main component wraps with Suspense
export default function Banner() {
  return (
    <div className="w-full z-0 h-[30vh] md:h-[50vh] lg:h-[70vh] overflow-hidden">
      <Suspense
        fallback={<Skeleton className="h-[30vh] md:h-[50vh] lg:h-[70vh]" />}
      >
        <BannerContent />
      </Suspense>
    </div>
  );
}
