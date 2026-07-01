import dynamic from "next/dynamic";
import DefaultBanner from "./(sections)/DefaultBanner";
import MenWomen from "./(sections)/MenWomen";
import ShopByPrice from "./(sections)/ShopbyPrice";
import TabProducts from "./(sections)/TabProducts";
import WhyChooseUs from "./(sections)/WhyChooseUs";
import { siteConfig } from "@/lib/utils";
import { cache } from "react";
import ProductsTab from "./(sections)/ProductsTab";
import DynamicSections, { getHomeSections } from "./(sections)/DynamicSections";
import type { HomeSection } from "./(sections)/DynamicSections";
import {
  TAG_PRODUCTS,
  TAG_HOMEPAGE,
  TAG_BEST_SELLERS,
  TAG_TESTIMONIALS,
  TAG_TABS,
} from "@/lib/revalidation-tags";

const RoundCategorySlider = dynamic(() => import("./(sections)/RoundCategorySlider"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-6" />,
});
const Slider = dynamic(() => import("./(sections)/Slider"), {
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const Testimonial = dynamic(() => import("./(sections)/Testimonial"), {
  loading: () => <div className="h-80 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const FullVideoSection = dynamic(() => import("./(sections)/video"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});

export const metadata = {
  title: `${siteConfig.name} in ${siteConfig.address.city} | Best Gold & Silver Jewellery Shop | ${siteConfig.name}`,
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} - ${siteConfig.name} offers exquisite collection of Gold, Silver, Diamond & Polki jewellery. Visit our store in ${siteConfig.address.city} for traditional & modern designs. Free Shipping & Lifetime Exchange.`,
  openGraph: {
    title: `${siteConfig.name} in ${siteConfig.address.city} | Best Gold & Silver Jewellery | ${siteConfig.name}`,
    description: `Discover the finest collection of traditional and contemporary jewellery at ${siteConfig.name}, the leading ${siteConfig.name} in ${siteConfig.address.city}. Best prices on Gold, Silver, Diamond & Polki jewellery.`,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Premium Jewellery Collection in Jodhpur - " + siteConfig.name,
      },
    ],
    locale: "en_IN",
    type: "website",
    address: {
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.postalCode,
      addressCountry: "IN",
    },
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} in ${siteConfig.address.city} | ${siteConfig.name} | Best Jewellery Store`,
    description: `Explore our exclusive collection of Gold, Silver & Diamond jewellery in ${siteConfig.address.city}. Best prices & latest designs at ${siteConfig.name}. Visit us today!`,
    images: [`${siteConfig.url}/og-image.jpg`],
  },
  alternates: {
    canonical: siteConfig.url,
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
  verification: {
    google: "4jBIp_u1ex8ub0zCeOXN-UnbczFciy1aAO90vr7yhH8",
    yandex: "YANDEX_VERIFICATION_CODE",
  },
};

// Structured Data for Local Business
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: siteConfig.name,
  image: `${siteConfig.url}/og-image.jpg`,
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} offering Gold, Silver, Diamond & Polki jewellery. Visit our store in ${siteConfig.address.city} for traditional & modern designs.`,
  url: siteConfig.url,
  telephone: siteConfig.contact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    postalCode: siteConfig.address.postalCode,
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "26.2389",
    longitude: "73.0243",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "10:00",
    closes: "21:00",
  },
  priceRange: siteConfig.business.priceRange,
  sameAs: [
    siteConfig.social.facebook,
    siteConfig.social.instagram,
    siteConfig.address.googleMapsUrl,
  ],
};

const GetTestimonials = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/testimonial",
      {
        next: {
          tags: [TAG_TESTIMONIALS, TAG_HOMEPAGE],
          revalidate: 3600,
        },
      }
    );
    const data = await response.json();
    return data._data;
  } catch {
    return null;
  }
});

const getTabsData = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/tab-products",
      {
        next: {
          tags: [TAG_TABS, TAG_PRODUCTS],
          revalidate: 3600,
        },
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
});

const getNewArrivals = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/new-arrivals",
      {
        next: {
          tags: [TAG_PRODUCTS, TAG_HOMEPAGE],
          revalidate: 3600,
        },
      }
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
});

const getBestSellers = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/best-sellers",
      {
        next: {
          tags: [TAG_BEST_SELLERS, TAG_PRODUCTS],
          revalidate: 3600,
        },
      }
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
});

const getTrendingProducts = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/trending-products",
      {
        next: {
          tags: [TAG_PRODUCTS, TAG_HOMEPAGE],
          revalidate: 3600,
        },
      }
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
});

export default async function Home() {
  // Check if there are any dynamic sections configured
  const homeSections: HomeSection[] = await getHomeSections();
  const hasDynamicSections = homeSections.some((s) => !s.config?.hidden);

  if (hasDynamicSections) {
    // Dynamic layout from admin panel — render all sections in order
    // Banner is included as a normal section and may appear anywhere in the order
    return (
      <>
        <h1 className="sr-only">{siteConfig.name} - Best Jewellery Store in {siteConfig.address.city}</h1>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DynamicSections />
      </>
    );
  }

  // ── DEFAULT FALLBACK LAYOUT ──
  // When no dynamic sections are configured, show the original hardcoded layout
  const [testimonials, tabsData, newArrivals, trendingProducts, bestSellersProducts] =
    await Promise.all([
      GetTestimonials(),
      getTabsData(),
      getNewArrivals(),
      getTrendingProducts(),
      getBestSellers()
    ]);

  return (
    <>
      {/* Add Structured Data */}
      <h1 className="sr-only">{siteConfig.name} - Best Jewellery Store in {siteConfig.address.city}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DefaultBanner />
      <RoundCategorySlider />
      <MenWomen />
      <ShopByPrice />
      <TabProducts data={tabsData} />
      <WhyChooseUs />
      <Slider data={newArrivals} heading="New Arrivals" />
      <FullVideoSection />
      <Slider data={bestSellersProducts} heading="Best Sellers Products" />
      <ProductsTab />

      <Slider
        data={trendingProducts}
        heading="Trending Products"
      />
      <Testimonial data={testimonials} />
    </>
  );
}
