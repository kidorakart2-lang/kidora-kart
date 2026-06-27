import { ImagesSlider } from "@/components/ui/images-slider";
import React, { cache, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface BannerItem {
  image: string;
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
    return data._data as BannerItem[];
  } catch {
    return [];
  }
});

async function BannerContent() {
  const banners: BannerItem[] = await GetBanners();
  const images = banners.map((item: BannerItem) => item.image);

  return <ImagesSlider className="" images={images} />;
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
