interface SitemapProduct {
  slug: string;
  updatedAt?: string;
}

interface SitemapSubSubCategory {
  slug: string;
  status?: boolean;
  deletedAt?: string | null;
  updatedAt?: string;
}

interface SitemapSubCategory {
  slug: string;
  status?: boolean;
  deletedAt?: string | null;
  updatedAt?: string;
  subSubCategories?: SitemapSubSubCategory[];
}

interface SitemapCategory {
  slug: string;
  status?: boolean;
  deletedAt?: string | null;
  updatedAt?: string;
  subCategories?: SitemapSubCategory[];
}

import { siteConfig } from "@/lib/utils";
import { serverFetch } from "@/lib/server-fetch";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_PRODUCTS, TAG_NAVIGATION } from "@/lib/revalidation-tags";

async function getSitemapProducts() {
  "use cache";
  cacheLife("max");
  cacheTag(TAG_PRODUCTS);

  const res = await serverFetch("/api/website/product/all?minimal=true", { timeout: 10000 });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?._data ?? []) as SitemapProduct[];
}

async function getSitemapCategories(): Promise<SitemapCategory[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAG_NAVIGATION);

  const res = await serverFetch("/api/website/nav?minimal=true", { timeout: 10000 });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?._data ?? []) as SitemapCategory[];
}

export default async function sitemap() {
  const baseUrl = siteConfig.url;

  const [sitemapProducts, sitemapCategories] = await Promise.all([
    getSitemapProducts().catch((error) => {
      console.error("[sitemap] Failed to fetch products:", error);
      return [] as SitemapProduct[];
    }),
    getSitemapCategories().catch((error) => {
      console.error("[sitemap] Failed to fetch categories:", error);
      return [] as SitemapCategory[];
    }),
  ]);

  const products = sitemapProducts.map((product) => ({
    url: `${baseUrl}product-details/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticRouteConfigs: { path: string; priority: number; changeFreq?: string }[] = [
    { path: "", priority: 1, changeFreq: "daily" },
    { path: "about", priority: 0.7 },
    { path: "contact-us", priority: 0.7 },
    { path: "faq", priority: 0.6 },
    { path: "story", priority: 0.6 },
    { path: "our-policy", priority: 0.5 },
    { path: "order-track", priority: 0.5 },
    { path: "terms-and-condition", priority: 0.8 },
  ];

  const staticRoutes = staticRouteConfigs.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: (route.changeFreq || "monthly") as "daily" | "weekly" | "monthly",
    priority: route.priority,
  }));

  const categoryUrls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];

  const urlPrefix = (slug: string) => {
    if (slug === "home") return "";
    else if (slug === "track-your-order") return "order-track";
    else if (slug === "contact-us") return "contact-us";
    return "category/" + slug;
  };

  const isProductCategory = (slug: string) => {
    const nonProductSlugs = [
      "home",
      "track-your-order",
      "contact-us",
      "new-arrivals",
      "gift-items",
      "gift-items",
    ];
    return !nonProductSlugs.includes(slug);
  };

  sitemapCategories.forEach((category: SitemapCategory) => {
    if (!category.status || category.deletedAt) return;

    const categorySlug = category.slug;
    const isProduct = isProductCategory(categorySlug);

    categoryUrls.push({
      url: `${baseUrl}${urlPrefix(categorySlug)}`,
      lastModified: new Date(category.updatedAt || ""),
      changeFrequency: "weekly",
      priority: categorySlug === "home" ? 1.0 : 0.8,
    });

    if (
      isProduct &&
      category.subCategories &&
      category.subCategories.length > 0
    ) {
      category.subCategories.forEach((subCategory: SitemapSubCategory) => {
        if (!subCategory.status || subCategory.deletedAt) return;

        categoryUrls.push({
          url: `${baseUrl}category/${categorySlug}/${subCategory.slug}`,
          lastModified: new Date(subCategory.updatedAt || ""),
          changeFrequency: "weekly",
          priority: 0.8,
        });

        if (
          subCategory.subSubCategories &&
          subCategory.subSubCategories.length > 0
        ) {
          subCategory.subSubCategories.forEach((subSubCategory: SitemapSubSubCategory) => {
            if (!subSubCategory.status || subSubCategory.deletedAt) return;

            categoryUrls.push({
              url: `${baseUrl}category/${categorySlug}/${subCategory.slug}/${subSubCategory.slug}`,
              lastModified: new Date(subSubCategory.updatedAt || ""),
              changeFrequency: "weekly",
              priority: 0.8,
            });
          });
        }
      });
    }
  });

  return [...staticRoutes, ...products, ...categoryUrls];
}
