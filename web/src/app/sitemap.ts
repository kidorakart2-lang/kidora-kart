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

export default async function sitemap() {
  const baseUrl = siteConfig.url;

  let products: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];
  try {
    const productsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/product/all`,
      {
        next: { revalidate: 86400 },
      }
    );
    if (productsRes.ok) {
      const data = await productsRes.json();

      products =
        data?._data?.map((product: SitemapProduct) => ({
          url: `${baseUrl}product-details/${product.slug}`,
          lastModified: product.updatedAt || new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })) || [];
    }
  } catch (error) {
  }

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

  let categoryUrls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/website/nav`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch navigation data");
    }

    const categoriesData = await response.json();
    const categories = categoriesData._data as SitemapCategory[];

    const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];

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
        "personalized-jewellery",
      ];
      return !nonProductSlugs.includes(slug);
    };

    categories.forEach((category: SitemapCategory) => {
      if (!category.status || category.deletedAt) return;

      const categorySlug = category.slug;
      const isProduct = isProductCategory(categorySlug);

      urls.push({
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

          urls.push({
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

              urls.push({
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
    categoryUrls = urls;
  } catch (error) {
  }

  return [...staticRoutes, ...products, ...categoryUrls];
}
