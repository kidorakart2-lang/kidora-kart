import dynamic from "next/dynamic";
import { Suspense } from "react";
import DefaultBanner from "./(sections)/DefaultBanner";
import { siteConfig } from "@/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeSections, type HomeSection } from "@/lib/home-data";
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
const DynamicSections = dynamic(() => import("./(sections)/DynamicSections"), {
  loading: () => null,
});
const GenderCategorySection = dynamic(() => import("./(sections)/GenderCategorySection"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const ShopByPrice = dynamic(() => import("./(sections)/ShopbyPrice"), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const TabProducts = dynamic(() => import("./(sections)/TabProducts"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const WhyChooseUs = dynamic(() => import("./(sections)/WhyChooseUs"), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const ProductsTab = dynamic(() => import("./(sections)/ProductsTab"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});

export const metadata = {
  title: `${siteConfig.name} in ${siteConfig.address.city} | Best Online Toy Store | ${siteConfig.name}`,
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} - ${siteConfig.name} offers a wide collection of toys, games, puzzles and more for kids of all ages. Visit our store in ${siteConfig.address.city} for the best toys. Free Shipping & Easy Returns.`,
  openGraph: {
    title: `${siteConfig.name} in ${siteConfig.address.city} | Best Toy Store | ${siteConfig.name}`,
    description: `Discover the finest collection of toys and games at ${siteConfig.name}, the leading toy store in ${siteConfig.address.city}. Best prices on educational toys, action figures, dolls, board games and more.`,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Best Toys Collection in Jodhpur - " + siteConfig.name,
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
    title: `${siteConfig.name} in ${siteConfig.address.city} | ${siteConfig.name} | Best Toy Store`,
    description: `Explore our exclusive collection of toys and games in ${siteConfig.address.city}. Best prices & latest designs at ${siteConfig.name}. Visit us today!`,
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
    google: siteConfig.googleVerification,
  },
};

// Structured Data for Local Business
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: siteConfig.name,
  image: `${siteConfig.url}/og-image.jpg`,
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} offering a wide range of toys, games, puzzles and more. Visit our store in ${siteConfig.address.city} for the best toys.`,
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
    const response = await fetch("/api/website/testimonial");
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
    const response = await fetch("/api/website/product/tab-products");
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
    const response = await fetch("/api/website/product/new-arrivals");
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
    const response = await fetch("/api/website/product/best-sellers");
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
    const response = await fetch("/api/website/product/trending-products");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

// ── Default fallback layout — renders immediately as static shell ──
// Renders all hardcoded sections. Data-heavy sections are inside Suspense
// boundaries so they stream in as cached data resolves.
// When dynamic sections are NOT configured, this is the final layout.
// When they ARE configured, this gets replaced by DynamicSections via streaming.

function DefaultLayoutSections() {
  return (
    <>
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

// ── Streaming layout router ────────────────────────────────────────
// Fetches sections config in the background (behind Suspense).
// Renders DynamicSections if configured, otherwise the default layout.
// Since getHomeSections() uses "use cache", calling it again here is free
// if it was already fetched (cache hit from same render).

async function StreamingLayoutRouter() {
  const homeSections: HomeSection[] = await getHomeSections();
  const hasDynamicSections = homeSections.some((s) => !s.config?.hidden);

  if (hasDynamicSections) {
    return <DynamicSections />;
  }

  return <DefaultLayoutSections />;
}

// ── Home page ────────────────────────────────────────────────────────
// The page renders immediately — no blocking await on getHomeSections().
// The default layout streams in as its Suspense boundaries resolve.
// A lightweight Suspense wrapper checks for dynamic sections in the background.

export default async function Home() {
  return (
    <>
      <h1 className="sr-only">{siteConfig.name} - Best Toy Store in {siteConfig.address.city}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Suspense fallback={<DefaultLayoutSections />}>
        <StreamingLayoutRouter />
      </Suspense>
    </>
  );
}
