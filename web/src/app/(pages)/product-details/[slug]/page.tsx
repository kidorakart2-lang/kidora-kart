import { siteConfig, defaultMetadata } from "@/lib/utils";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { productTag, TAG_PRODUCTS } from "@/lib/revalidation-tags";
import ProductDetailsPage from "./ProductDetail";

interface ProductDetail {
  _id: string;
  name: string;
  price: number;
  discount_price?: number;
  image?: string;
  images?: string[];
  stock: number;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  category?: { _id: string; name: string }[];
  subCategory?: { _id: string; name: string }[];
  subSubCategory?: { _id: string; name: string }[];
}

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

// ISR: revalidate at most every 30 minutes 
// IT ISNT SUPPORTED WITH nextConfig.cacheComponents setting do not USE IT 
// export const revalidate = 1800;

// ── Generate static params for all product pages at build time ──────
// Fetches all product slugs so PPR can prerender a static shell for each.

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/product/all`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const products = data._data as { slug: string }[];
    if (!Array.isArray(products)) return [];
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
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
  const productImage = product.image || `${siteConfig.url}/images/og-image.jpg`;
  const price = product.discount_price || product.price;
  const currency = "INR";
  const availability =
    product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const categoryName = product.category?.[0]?.name || "jewellery";
  const localKeywords = [
    product.name,
    categoryName,
    `${categoryName} in ${siteConfig.address.city}`,
    `${siteConfig.address.city} ${categoryName}`,
    `${siteConfig.address.city} jewellery shop`,
    "Rajasthani jewellery",
    `traditional jewellery ${siteConfig.address.city}`,
    `gold jewellery ${siteConfig.address.city}`,
    `silver jewellery ${siteConfig.address.city}`,
    siteConfig.name,
    ...(product.tags || []),
  ].join(", ");

  const enhancedDescription =
    product.description ||
    `Buy authentic ${product.name} from ${
      siteConfig.name
    }, your trusted jewellery shop in ${siteConfig.address.city}, ${siteConfig.address.state}. ${
      product.short_description || ""
    } Shop premium quality ${categoryName} with traditional Rajasthani craftsmanship. Best prices in ${siteConfig.address.city}.`;

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
        `Buy ${product.name} from ${siteConfig.address.city}'s trusted jewellery shop.`,
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

export async function generateProductSchema(product: ProductDetail, productUrl: string) {
  const productImage = product.image || `${siteConfig.url}/images/og-image.jpg`;
  const price = product.discount_price || product.price;
  const currency = "INR";
  const availability =
    product.stock > 0
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
      "@type": "JewelryStore",
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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/product/details/${slug}`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?._status ? (data._data as ProductDetail) : null;
}

export default async function Page({ params }: ProductDetailsPageProps) {
  const allParams = await params;
  const { slug } = allParams;
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
