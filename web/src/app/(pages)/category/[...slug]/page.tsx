import { redirect } from "next/navigation";
import ProductListing from "../ProductListing";
import React, { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/lib/utils";
import { TAG_FILTERS } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";
import FilterSidebar from "../FilterSidebar";
import CategoryBanner from "@/components/CategoryBanner";
import { ChevronRight } from "lucide-react";
import type { ColorItem, MaterialItem } from "@/types";

// ISR: revalidate at most every hour 
// IT ISNT SUPPORTED WITH nextConfig.cacheComponents setting do not USE IT 
// export const revalidate = 3600;

export const metadata = {
  title: `Shop Jewellery Online - ${siteConfig.name} | Handcrafted Collection`,
  description: `Browse our extensive collection of handcrafted jewellery in Jodhpur. Shop rings, earrings, necklaces, bangles, and more. Elegant designs crafted with care for every occasion.`,
  keywords: `buy jewellery online jodhpur, gold jewellery collection, jewellery shop, bridal jewellery, gift jewellery, ${siteConfig.categories.join(
    ", "
  )}`,
  openGraph: {
    title: `Shop Jewellery Online - ${siteConfig.name}`,
    description:
      "Explore our curated collection of handcrafted jewellery. From classic to contemporary designs.",
    url: `${siteConfig.url}/category`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/category`,
  },
};

// ── Static params — fetches real categories at build time, falls back to placeholder ──
export async function generateStaticParams() {
  try {
    const res = await serverFetch("/api/website/nav", { timeout: 5000 });
    if (!res.ok) return [{ slug: ["placeholder"] }];
    const data = await res.json();
    const categories = data._data as {
      slug: string;
      status?: boolean;
      deletedAt?: string | null;
      subCategories?: { slug: string; status?: boolean; deletedAt?: string | null; subSubCategories?: { slug: string; status?: boolean; deletedAt?: string | null }[] }[];
    }[];
    if (!Array.isArray(categories)) return [{ slug: ["placeholder"] }];

    const nonProductSlugs = new Set(["home", "track-your-order", "contact-us", "new-arrivals", "gift-items"]);
    const params: { slug: string[] }[] = [];

    for (const cat of categories) {
      if (cat.status === false || cat.deletedAt) continue;
      if (nonProductSlugs.has(cat.slug)) continue;
      params.push({ slug: [cat.slug] });
      if (!cat.subCategories?.length) continue;
      for (const sub of cat.subCategories) {
        if (sub.status === false || sub.deletedAt) continue;
        params.push({ slug: [cat.slug, sub.slug] });
        if (!sub.subSubCategories?.length) continue;
        for (const subsub of sub.subSubCategories) {
          if (subsub.status === false || subsub.deletedAt) continue;
          params.push({ slug: [cat.slug, sub.slug, subsub.slug] });
        }
      }
    }
    return params.length > 0 ? params : [{ slug: ["placeholder"] }];
  } catch {
    return [{ slug: ["placeholder"] }];
  }
}

async function getColor(): Promise<ColorItem[]> {
  "use cache";
  cacheLife("filters");
  cacheTag(TAG_FILTERS);

  try {
    const color = await serverFetch("/api/website/color", { timeout: 5000 });
    const data = await color.json();
    if (!color.ok || !data._status) return [];
    return data._data;
  } catch {
    return [];
  }
}

async function getMaterial(): Promise<MaterialItem[]> {
  "use cache";
  cacheLife("filters");
  cacheTag(TAG_FILTERS);

  try {
    const material = await serverFetch("/api/website/material", { timeout: 5000 });
    const data = await material.json();
    if (!material.ok || !data._status) return [];
    return data._data;
  } catch {
    return [];
  }
}

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const allParams = await params;
  const allSearchParams = await searchParams;
  const query = allSearchParams?.q;
  const slug = await allParams.slug;

  if (slug[0] === "placeholder") {
    redirect("/");
  }

  const categorySlug = slug[0];
  const subCategorySlug = slug[1] || "";
  const subSubCategorySlug = slug[2] || "";

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Banner — shown at the top of the page */}
          <CategoryBanner
            categorySlug={categorySlug}
            subCategorySlug={subCategorySlug}
            subSubCategorySlug={subSubCategorySlug}
          />

          {/* Header & Filter area */}
          <Suspense fallback={<CategoryHeaderSkeleton query={query} categorySlug={categorySlug} subCategorySlug={subCategorySlug} subSubCategorySlug={subSubCategorySlug} />}>
            <CategoryContent
              slug={slug}
              categorySlug={categorySlug}
              subCategorySlug={subCategorySlug}
              subSubCategorySlug={subSubCategorySlug}
              query={query}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function CategoryHeaderSkeleton({ query, categorySlug, subCategorySlug, subSubCategorySlug }: { query?: string; categorySlug: string; subCategorySlug: string; subSubCategorySlug: string }) {
  const title = subSubCategorySlug || subCategorySlug || categorySlug;
  return (
    <>
      <div className="relative py-5 md:py-10">
        <div className="text-center space-y-3">
          <div className="h-16 w-3/4 mx-auto bg-muted rounded-lg animate-pulse" />
          <div className="h-px w-3/5 mx-auto bg-muted" />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-16">
        <div className="w-full lg:w-64 shrink-0 h-96 bg-muted rounded-xl animate-pulse" />
        <main className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-72 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

async function CategoryContent({
  slug,
  categorySlug,
  subCategorySlug,
  subSubCategorySlug,
  query,
}: {
  slug: string[];
  categorySlug: string;
  subCategorySlug: string;
  subSubCategorySlug: string;
  query?: string;
}) {
  const [color, material] = await Promise.all([
    getColor(),
    getMaterial(),
  ]);

  // Build BreadcrumbList JSON-LD from URL hierarchy
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
  ];

  if (categorySlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: categorySlug
        .replace(/[-0-9]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${siteConfig.url}/category/${categorySlug}`,
    });
  }

  if (subCategorySlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: subCategorySlug
        .replace(/[-0-9]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${siteConfig.url}/category/${categorySlug}/${subCategorySlug}`,
    });
  }

  if (subSubCategorySlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: subSubCategorySlug
        .replace(/[-0-9]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${siteConfig.url}/category/${categorySlug}/${subCategorySlug}/${subSubCategorySlug}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: subSubCategorySlug
      ? subSubCategorySlug.replace(/[-0-9]/g, " ")
      : subCategorySlug
      ? subCategorySlug.replace(/[-0-9]/g, " ")
      : categorySlug.replace(/[-0-9]/g, " "),
    description: `Shop ${subSubCategorySlug || subCategorySlug || categorySlug} jewellery collection at ${siteConfig.name}. Browse our curated selection of handcrafted jewellery.`,
    url: `${siteConfig.url}/category/${slug.join("/")}`,
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: breadcrumbItems },
    mainEntity: {
      "@type": "ItemList",
      name: "Products",
    },
  };

  const schemas = [breadcrumbSchema, collectionPageSchema];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas),
        }}
      />

      {/* Premium Version 1: Clean & Elegant */}
      <div className="relative py-5 md:py-10 animate-fadeIn">
        {query ? (
          <div className="relative text-center space-y-3">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extralight text-foreground capitalize tracking-tight leading-tight">
              Search Results for &quot;{query}&quot;
            </h1>
            <div className="h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent mt-4 mx-auto animate-expandLine" style={{ width: "60%" }} />
            <div className="flex items-center justify-center gap-2 pt-2 animate-fadeIn" style={{ animationDelay: "0.8s" }}>
              <div className="w-2 h-2 rounded-full bg-brand-400" />
              <div className="w-2 h-2 rounded-full bg-brand-300" />
              <div className="w-2 h-2 rounded-full bg-brand-200" />
            </div>
          </div>
        ) : (
          <div className="relative text-center space-y-3">
            {(subSubCategorySlug || subCategorySlug) && (
              <div className="flex justify-center items-center gap-2 text-sm font-light text-muted-foreground uppercase tracking-wider animate-fadeIn">
                <span className="hover:text-brand-600 transition-colors cursor-pointer">
                  {subSubCategorySlug ? subCategorySlug.replace(/[-0-9]/g, " ") : categorySlug.replace(/[-0-9]/g, " ")}
                </span>
                <ChevronRight size={14} className="text-brand-400" />
              </div>
            )}
            <div className="relative inline-block">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extralight text-foreground capitalize tracking-tight leading-tight">
                {subSubCategorySlug ? subSubCategorySlug.replace(/[-0-9]/g, " ") : subCategorySlug ? subCategorySlug.replace(/[-0-9]/g, " ") : categorySlug.replace(/[-0-9]/g, " ")}
              </h1>
              <div className="h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent mt-4 mx-auto animate-expandLine" style={{ width: "60%" }} />
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 animate-fadeIn" style={{ animationDelay: "0.8s" }}>
              <div className="w-2 h-2 rounded-full bg-brand-400" />
              <div className="w-2 h-2 rounded-full bg-brand-300" />
              <div className="w-2 h-2 rounded-full bg-brand-200" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-16">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <FilterSidebar color={color} material={material} />
        </div>
        <main className="flex-1 animate-fadeIn">
          <ProductListing />
        </main>
      </div>
    </>
  );
}
