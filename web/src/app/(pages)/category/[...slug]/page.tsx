export const revalidate = 3600;
import ProductListing from "../ProductListing";
import React, { cache } from "react";
import { siteConfig } from "@/lib/utils";
import FilterSidebar from "../FilterSidebar";
import { ChevronRight } from "lucide-react";
import type { ColorItem, MaterialItem } from "@/types";

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ q?: string }>;
}

export const metadata = {
  title: `Shop Jewellery Online - ${siteConfig.name} | Gold, Silver & Diamond Collection`,
  description: `Browse our extensive collection of premium jewellery in Jodhpur. Shop rings, necklaces, earrings, bracelets, bangles, and more. Gold, silver, and diamond jewellery with traditional Rajasthani craftsmanship.`,
  keywords: `buy jewellery online jodhpur, gold jewellery collection, silver jewellery shop, diamond jewellery store, bridal jewellery, traditional jewellery, ${siteConfig.categories.join(
    ", "
  )}`,
  openGraph: {
    title: `Shop Premium Jewellery - ${siteConfig.name}`,
    description:
      "Explore our curated collection of exquisite jewellery pieces. From traditional to contemporary designs.",
    url: `${siteConfig.url}/category`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/category`,
  },
};

const getColor = cache(async (): Promise<ColorItem[]> => {
  const color = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/color`,
    {
      next: {
        revalidate: 600,
      },
    }
  );

  const data = await color.json();
  if (!color.ok || !data._status) {
    return [];
  }
  return data._data;
});

const getMaterial = cache(async (): Promise<MaterialItem[]> => {
  const material = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/material`,
    {
      next: {
        revalidate: 600,
      },
    }
  );
  const data = await material.json();
  if (!material.ok || !data._status) {
    return [];
  }
  return data._data;
});

export default async function page({ params, searchParams }: CategoryPageProps) {
  const allParams = await params;
  const allSearchParams = await searchParams;
  const query = allSearchParams?.q;
  const slug = await allParams.slug;
  console.log(allParams);

  const categorySlug = slug[0];
  const subCategorySlug = slug[1] || "";
  const subSubCategorySlug = slug[2] || "";

  const color = await getColor();
  const material = await getMaterial();

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

  // S12: CollectionPage schema for category pages
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: subSubCategorySlug
      ? subSubCategorySlug.replace(/[-0-9]/g, " ")
      : subCategorySlug
      ? subCategorySlug.replace(/[-0-9]/g, " ")
      : categorySlug.replace(/[-0-9]/g, " "),
    description: `Shop ${subSubCategorySlug || subCategorySlug || categorySlug} jewellery collection at ${siteConfig.name}. Browse our curated selection of premium jewellery pieces.`,
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
      <div className="min-h-screen ">
      <div className="max-w-[100%] mx-auto px-2 md:px-4">
        {/* Premium Version 1: Clean & Elegant */}
        <div className="relative py-5 md:py-10 animate-fadeIn">
          {/* Floating decorative elements */}

          {query ? (
            <div className="relative text-center space-y-3">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extralight text-gray-900 capitalize tracking-tight leading-tight ">
                Search Results for &quot;{query}&quot;
              </h1>
              {/* Animated underline */}
              <div
                className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4 mx-auto animate-expandLine"
                style={{ width: "60%" }}
              />
              {/* Decorative dots */}
              <div
                className="flex items-center justify-center gap-2 pt-2 animate-fadeIn"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-amber-300" />
                <div className="w-2 h-2 rounded-full bg-amber-200" />
              </div>
            </div>
          ) : (
            <div className="relative text-center space-y-3">
              {/* Breadcrumb navigation */}
              {(subSubCategorySlug || subCategorySlug) && (
                <div className="flex justify-center items-center gap-2 text-sm font-light text-gray-500 uppercase tracking-wider animate-fadeIn">
                  <span className="hover:text-amber-600 transition-colors cursor-pointer">
                    {subSubCategorySlug
                      ? subCategorySlug.replace(/[-0-9]/g, " ")
                      : categorySlug.replace(/[-0-9]/g, " ")}
                  </span>
                  <ChevronRight size={14} className="text-amber-400" />
                </div>
              )}

              {/* Main Title with Icon */}
              <div className="relative inline-block">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extralight text-gray-900 capitalize tracking-tight leading-tight ">
                  {subSubCategorySlug
                    ? subSubCategorySlug.replace(/[-0-9]/g, " ")
                    : subCategorySlug
                    ? subCategorySlug.replace(/[-0-9]/g, " ")
                    : categorySlug.replace(/[-0-9]/g, " ")}
                </h1>

                {/* Animated underline */}
                <div
                  className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4 mx-auto animate-expandLine"
                  style={{ width: "60%" }}
                />
              </div>

              {/* Decorative dots */}
              <div
                className="flex items-center justify-center gap-2 pt-2  animate-fadeIn"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-amber-300" />
                <div className="w-2 h-2 rounded-full bg-amber-200" />
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
      </div>
    </div>
    </>
  );
}
