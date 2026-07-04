import dynamic from "next/dynamic";
import { Suspense } from "react";
import DefaultBanner from "./(sections)/DefaultBanner";
import GenderCategorySection from "./(sections)/GenderCategorySection";
import ShopByPrice from "./(sections)/ShopbyPrice";
import TabProducts from "./(sections)/TabProducts";
import WhyChooseUs from "./(sections)/WhyChooseUs";
import { siteConfig } from "@/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import ProductsTab from "./(sections)/ProductsTab";
import { Skeleton } from "@/components/ui/skeleton";
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

export const experimental_ppr = true;
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

async function GetTestimonials() {
  "use cache";
  cacheLife("testimonials");
  cacheTag(TAG_TESTIMONIALS, TAG_HOMEPAGE);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/testimonial",
    );
    const data = await response.json();
    return data._data;
  } catch {
    return null;
  }
}

async function getTabsData() {
  "use cache";
  cacheLife("tabs");
  cacheTag(TAG_TABS, TAG_PRODUCTS);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/tab-products",
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}

async function getNewArrivals() {
  "use cache";
  cacheLife("products");
  cacheTag(TAG_PRODUCTS, TAG_HOMEPAGE);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/new-arrivals",
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}

async function getBestSellers() {
  "use cache";
  cacheLife("best-sellers");
  cacheTag(TAG_BEST_SELLERS, TAG_PRODUCTS);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/best-sellers",
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}

async function getTrendingProducts() {
  "use cache";
  cacheLife("products");
  cacheTag(TAG_PRODUCTS, TAG_HOMEPAGE);

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/product/trending-products",
    );
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}

// ── PPR-compatible wrapper components ───────────────────────────────
// Each component fetches its own data inside a Suspense boundary so the
// static page shell can render immediately while dynamic sections stream in.

async function NewArrivalsSection() {
  const data = await getNewArrivals();
  return <Slider data={data} heading="New Arrivals" />;
}

async function BestSellersSection() {
  const data = await getBestSellers();
  return <Slider data={data} heading="Best Sellers Products" />;
}

async function TrendingSection() {
  const data = await getTrendingProducts();
  return <Slider data={data} heading="Trending Products" />;
}

async function TabProductsSection() {
  const data = await getTabsData();
  return <TabProducts data={data} />;
}

async function TestimonialSection() {
  const data = await GetTestimonials();
  return <Testimonial data={data} />;
}

// ── Skeleton fallbacks for dynamic sections ──────────────────────────

function SliderSkeleton({ heading }: { heading: string }) {
  return (
    <section className="relative py-10 overflow-hidden bg-section">
      <div className="section-container">
        <div className="text-center mb-14">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg mx-4" />
      </div>
    </section>
  );
}

function TabProductsSkeleton() {
  return (
    <section className="py-5 lg:py-12 bg-section relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <Skeleton className="h-8 w-48 mx-auto mb-8" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function TestimonialSkeleton() {
  return (
    <section className="relative mx-auto w-full overflow-hidden py-10 lg:py-16 bg-section-subtle">
      <div className="section-container">
        <div className="text-center mb-12">
          <Skeleton className="h-6 w-32 mx-auto mb-4" />
          <Skeleton className="h-10 w-80 mx-auto" />
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-xl mx-4" />
      </div>
    </section>
  );
}

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
  // When no dynamic sections are configured, show the original hardcoded layout.
  // Static sections (DefaultBanner, RoundCategorySlider, GenderCategorySection,
  // ShopByPrice, WhyChooseUs, ProductsTab) render immediately as part of the
  // PPR static shell. Data-heavy sections are wrapped in <Suspense> so their
  // content streams in as cached data resolves.

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
      <GenderCategorySection />
      <ShopByPrice />

      <Suspense fallback={<TabProductsSkeleton />}>
        <TabProductsSection />
      </Suspense>

      <WhyChooseUs />

      <Suspense fallback={<SliderSkeleton heading="New Arrivals" />}>
        <NewArrivalsSection />
      </Suspense>

      <FullVideoSection />

      <Suspense fallback={<SliderSkeleton heading="Best Sellers Products" />}>
        <BestSellersSection />
      </Suspense>

      <ProductsTab />

      <Suspense fallback={<SliderSkeleton heading="Trending Products" />}>
        <TrendingSection />
      </Suspense>

      <Suspense fallback={<TestimonialSkeleton />}>
        <TestimonialSection />
      </Suspense>
    </>
  );
}
