"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

interface BannerData {
  _id: string;
  image: string;
  description: string;
  link?: {
    type?: string;
    url?: string | null;
    externalUrl?: string | null;
  } | null;
}

interface CategoryBannerProps {
  categorySlug: string;
  subCategorySlug?: string;
  subSubCategorySlug?: string;
}

// ── Query key factory ───────────────────────────────────────────────
const bannerKeys = {
  categoryBanner: (categorySlug: string, subCategorySlug?: string, subSubCategorySlug?: string) =>
    ["category-banner", categorySlug, subCategorySlug, subSubCategorySlug] as const,
};

// ── Fetch function ──────────────────────────────────────────────────
async function fetchCategoryBanner(
  categorySlug: string,
  subCategorySlug?: string,
  subSubCategorySlug?: string,
): Promise<BannerData | null> {
  if (!categorySlug) return null;

  // Fetch nav data to find the bannerId for the matching category level
  const navRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/nav`,
  );
  if (!navRes.ok) return null;
  const navData = await navRes.json();
  const categories = navData._data ?? [];
  let bannerId: string | null = null;

  if (subSubCategorySlug) {
    for (const cat of categories) {
      for (const sub of cat.subCategories ?? []) {
        const subsub = (sub.subSubCategories ?? []).find(
          (s: { slug: string; bannerId?: string }) => s.slug === subSubCategorySlug,
        );
        if (subsub?.bannerId) {
          bannerId = subsub.bannerId;
          break;
        }
      }
      if (bannerId) break;
    }
  }

  if (!bannerId && subCategorySlug) {
    for (const cat of categories) {
      const sub = (cat.subCategories ?? []).find(
        (s: { slug: string; bannerId?: string }) => s.slug === subCategorySlug,
      );
      if (sub?.bannerId) {
        bannerId = sub.bannerId;
        break;
      }
    }
  }

  if (!bannerId) {
    const cat = categories.find(
      (c: { slug: string; bannerId?: string }) => c.slug === categorySlug,
    );
    if (cat?.bannerId) {
      bannerId = cat.bannerId;
    }
  }

  if (!bannerId) return null;

  const bannerRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/banner/${bannerId}`,
  );
  const bannerData = await bannerRes.json();
  if (bannerData._status && bannerData._data) {
    return bannerData._data as BannerData;
  }
  return null;
}

export default function CategoryBanner({
  categorySlug,
  subCategorySlug,
  subSubCategorySlug,
}: CategoryBannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: banner, isLoading } = useQuery({
    queryKey: bannerKeys.categoryBanner(categorySlug, subCategorySlug, subSubCategorySlug),
    queryFn: () => fetchCategoryBanner(categorySlug, subCategorySlug, subSubCategorySlug),
    staleTime: 5 * 60 * 1000,  // 5 min — CacheInvalidationProvider handles admin CRUD invalidation
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!categorySlug,  // skip query entirely when no slug (avoids skeleton flash)
  });

  // ── Skeleton while loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden mb-6 animate-pulse bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted-foreground/10" />
            <div className="w-48 h-3 rounded bg-muted-foreground/10" />
            <div className="w-32 h-2 rounded bg-muted-foreground/5" />
          </div>
        </div>
      </div>
    );
  }

  // ── No banner assigned — nothing to show ──────────────────────────────
  if (!banner) return null;

  const bannerLink = banner.link?.url || banner.link?.externalUrl || null;

  const BannerContent = (
    <div
      className={`relative w-full h-48 md:h-64 lg:h-80 overflow-hidden shadow-md mb-6 transition-opacity duration-500 ${
        imageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src={banner.image}
        alt={banner.description || "Category banner"}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
        onLoad={() => setImageLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );

  if (bannerLink) {
    return (
      <Link href={bannerLink} className="block">
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
