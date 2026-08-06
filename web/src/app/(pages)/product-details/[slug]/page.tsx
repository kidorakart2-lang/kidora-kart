import { siteConfig, defaultMetadata } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { productTag, TAG_PRODUCTS } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductData } from "@/types";
import ProductDetailsPage from "./ProductDetail";

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

// ISR: revalidate at most every 30 minutes 
// IT ISNT SUPPORTED WITH nextConfig.cacheComponents setting do not USE IT 
// export const revalidate = 1800;

// ── Static params — fetches real products at build time, falls back to placeholder ──
export async function generateStaticParams() {
  try {
    const res = await serverFetch("/api/website/product/all", { timeout: 5000 });
    if (!res.ok) return [{ slug: "placeholder" }];
    const data = await res.json();
    const products = data._data as { slug: string }[];
    if (!Array.isArray(products) || products.length === 0) return [{ slug: "placeholder" }];
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [{ slug: "placeholder" }];
  }
}

export async function generateMetadata({ params }: ProductDetailsPageProps) {
  const allParams = await params;
  const { slug } = allParams;
  const product = await getProducts(slug);

  if (!product) {
    return {
      title: `Product Not Found | ${siteConfig.name}`,
      description: "The requested product could not be found.",
    };
  }

  const productUrl = `${siteConfig.url}/product-details/${slug}`;
  const productImage = product.image || `${siteConfig.url}/og-image.jpg`;
  const price = product.discount_price || product.price;
  const currency = "INR";
  const availability =
    (product.stock ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const categoryName = product.category?.[0]?.name || "jewellery";
  const localKeywords = [
    product.name,
    categoryName,
    `${categoryName} in ${siteConfig.address.city}`,
    `${siteConfig.address.city} ${categoryName}`,
    `${siteConfig.address.city} jewellery store`,
    "buy jewellery online",
    `jewellery ${siteConfig.address.city}`,
    `gold jewellery ${siteConfig.address.city}`,
    `shop jewellery ${siteConfig.address.city}`,
    siteConfig.name,
    ...(product.tags || []),
  ].join(", ");

  const enhancedDescription =
    product.description ||
    `Buy ${product.name} from ${
      siteConfig.name
    }, your trusted jewellery store in ${siteConfig.address.city}, ${siteConfig.address.state}. ${
      product.short_description || ""
    } Shop premium quality ${categoryName} at the best prices in ${siteConfig.address.city}.`;

  return {
    title: `${product.name} | ${siteConfig.name}`,
    description: enhancedDescription,
    keywords: localKeywords,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      ...defaultMetadata.openGraph,
      type: "website",
      title: `${product.name} | ${siteConfig.name}`,
      description: enhancedDescription,
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: `${product.name} - ${siteConfig.name} Jodhpur`,
        },
      ],
      site_name: siteConfig.name,
      url: productUrl,
      locale: "en_IN",
    },
    twitter: {
      ...defaultMetadata.twitter,
      card: "summary_large_image",
      title: `${product.name} | ${siteConfig.name}`,
      description:
        product.description ||
        `Buy ${product.name} from ${siteConfig.address.city}'s trusted jewellery store.`,
      images: [productImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export async function generateProductSchema(product: ProductData, productUrl: string) {
  const productImage = product.image || `${siteConfig.url}/og-image.jpg`;
  const price = product.discount_price || product.price;
  const currency = "INR";
  const availability =
    (product.stock ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  // Build breadcrumb items from product's category hierarchy
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
  ];

  const catName = product.category?.[0]?.name;
  if (catName) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: catName,
      item: `${siteConfig.url}/category/${catName.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: productUrl,
  });

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: productImage,
      description:
        product.description ||
        `Buy ${product.name} from ${siteConfig.name} in Jodhpur, Rajasthan. ${
          product.short_description || ""
        }`,
      sku: product.sku || product._id,
      mpn: product.sku || product._id,
      brand: {
        "@type": "Brand",
        name: siteConfig.name,
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: currency,
        price: price,
        // TODO: add priceValidUntil derived from product.updatedAt/createdAt once added to API response
        itemCondition: "https://schema.org/NewCondition",
        availability: availability,
        seller: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      },
      aggregateRating: product.rating && product.reviewCount && product.reviewCount >= 3
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: siteConfig.name,
      image: siteConfig.url + "/images/shop-image.jpg",
      "@id": siteConfig.url,
      url: siteConfig.url,
      telephone: siteConfig.contact.phone || "+91-XXXXXXXXXX",
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.street || "Your Street Address",
        addressLocality: siteConfig.address.city,
        addressRegion: siteConfig.address.state,
        postalCode: siteConfig.address.postalCode,
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: siteConfig.address.geo.lat,
        longitude: siteConfig.address.geo.lng,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "10:00",
          closes: "20:00",
        },
      ],
      sameAs: [
        siteConfig.social?.facebook || "",
        siteConfig.social?.instagram || "",
        siteConfig.social?.twitter || "",
      ].filter(Boolean),
    },
  ];

  return schemas;
}

async function getProducts(slug: string) {
  "use cache";
  cacheLife("products");
  cacheTag(productTag(slug), TAG_PRODUCTS);

  try {
    const response = await serverFetch(`/api/website/product/details/${slug}`, { timeout: 5000 });
    if (!response.ok) return null;
    const data = await response.json();
    return data?._status ? (data._data as ProductData) : null;
  } catch {
    return null;
  }
}

// ── Product detail skeleton ─────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="flex gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="w-20 h-20 rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Product content fetcher — wrapped in Suspense ────────────────────
async function ProductContent({ slug }: { slug: string }) {
  const product = await getProducts(slug);

  if (!product) {
    notFound();
  }

  const productUrl = `${siteConfig.url}/product-details/${slug}`;
  const schemas = await generateProductSchema(product, productUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas),
        }}
      />
      <ProductDetailsPage details={product} />
    </>
  );
}

export default async function Page({ params }: ProductDetailsPageProps) {
  const allParams = await params;
  const { slug } = allParams;

  if (slug === "placeholder") {
    redirect("/");
  }

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent slug={slug} />
    </Suspense>
  );
}
