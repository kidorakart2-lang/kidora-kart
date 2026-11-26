import dynamic from "next/dynamic";
import { Suspense } from "react";
import DefaultBanner from "./(sections)/DefaultBanner";
import { siteConfig } from "@/lib/utils";
import type { ProductData } from "@/types";
import { cacheLife, cacheTag } from "next/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { serverFetch } from "@/lib/server-fetch";
import { getProducts } from "@/lib/get-products";
import {
  TAG_PRODUCTS,
  TAG_HOMEPAGE,
  TAG_BEST_SELLERS,
  TAG_TESTIMONIALS,
  TAG_TABS,
} from "@/lib/revalidation-tags";

const ShopByCategory = dynamic(() => import("./(sections)/ShopByCategory"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-6" />,
});
const Slider = dynamic(() => import("./(sections)/Slider"), {
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const Testimonial = dynamic(() => import("./(sections)/Testimonial"), {
  loading: () => <div className="h-80 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
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
const MarqueeStrip = dynamic(() => import("./(sections)/MarqueeStrip"));
const AboutStory = dynamic(() => import("./(sections)/AboutStory"));
const SignatureEdit = dynamic(() => import("./(sections)/SignatureEdit"));
const ClosingCta = dynamic(() => import("./(sections)/ClosingCta"));

export const metadata = {
  title: `${siteConfig.name} in ${siteConfig.address.city} | Best Online Jewellery Store | ${siteConfig.name}`,
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} - ${siteConfig.name} offers a wide collection of earrings, necklaces, rings, bangles and more for every occasion. Visit our store in ${siteConfig.address.city} for the finest jewellery. Free Shipping & Easy Returns.`,
  openGraph: {
    title: `${siteConfig.name} in ${siteConfig.address.city} | Best Jewellery Store | ${siteConfig.name}`,
    description: `Discover the finest collection of jewellery at ${siteConfig.name}, the leading jewellery store in ${siteConfig.address.city}. Best prices on gold-plated earrings, kundan sets, pearl necklaces, bangles and more.`,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Best Jewellery Collection in Jodhpur - " + siteConfig.name,
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
    description: `Explore our exclusive collection of jewellery in ${siteConfig.address.city}. Best prices & latest designs at ${siteConfig.name}. Visit us today!`,
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
  description: `Best ${siteConfig.name} in ${siteConfig.address.city} offering a wide range of earrings, necklaces, rings, bangles and bridal sets. Visit our store in ${siteConfig.address.city} for the finest jewellery.`,
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
    const response = await serverFetch("/api/website/testimonial", { timeout: 5000 });
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
    const response = await serverFetch("/api/website/product/tab-products", { timeout: 5000 });
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
    const response = await serverFetch("/api/website/product/new-arrivals", { timeout: 5000 });
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
    const response = await serverFetch("/api/website/product/best-sellers", { timeout: 5000 });
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
  return (
    <Slider
      data={data}
      heading="New Arrivals"
      accent="just landed"
      eyebrow="Freshly crafted"
    />
  );
}

async function BestSellersSection() {
  const data = await getBestSellers();
  return (
    <Slider
      data={data}
      heading="The Pieces"
      accent="Everyone Loves"
      eyebrow="Handpicked for you"
    />
  );
}

async function TabProductsSection() {
  const data = await getTabsData();
  return <TabProducts data={data} />;
}

async function TestimonialSection() {
  const data = await GetTestimonials();
  return <Testimonial data={data} />;
}

async function SignatureEditSection() {
  const products = ((await getProducts("necklace")) as ProductData[]) ?? [];
  const unique = Array.from(
    new Map(products.filter(Boolean).map((product) => [product._id, product])).values(),
  );

  return <SignatureEdit products={unique.slice(0, 8)} />;
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
      {/* Editorial flow: hero → marquee → categories → story → product rails
          → promise → collections → price bands → voices → closing CTA. */}
      <DefaultBanner />
      <MarqueeStrip />
      <ShopByCategory />
      <AboutStory />

      <Suspense fallback={<SliderSkeleton heading="Best Sellers Products" />}>
        <BestSellersSection />
      </Suspense>

      <Suspense fallback={<TabProductsSkeleton />}>
        <SignatureEditSection />
      </Suspense>

      <WhyChooseUs />

      <GenderCategorySection />

      <Suspense fallback={<SliderSkeleton heading="New Arrivals" />}>
        <NewArrivalsSection />
      </Suspense>

      <Suspense fallback={<TabProductsSkeleton />}>
        <TabProductsSection />
      </Suspense>

      <ShopByPrice />

      <Suspense fallback={<TestimonialSkeleton />}>
        <TestimonialSection />
      </Suspense>

      <ProductsTab />
      <ClosingCta />
    </>
  );
}

// ── Streaming layout router ────────────────────────────────────────
// Fetches sections config in the background (behind Suspense).
// Renders DynamicSections if configured, otherwise the default layout.
// Since getHomeSections() uses "use cache", calling it again here is free
// if it was already fetched (cache hit from same render).

// DEV ONLY: the dynamic homepage section builder is intentionally bypassed.
// The homepage always renders the static editorial layout below until the
// dynamic sections are re-enabled.

// ── Home page ────────────────────────────────────────────────────────
// The page renders immediately — no blocking await on getHomeSections().
// The default layout streams in as its Suspense boundaries resolve.
// A lightweight Suspense wrapper checks for dynamic sections in the background.

export default async function Home() {
  return (
    <>
      <h1 className="sr-only">{siteConfig.name} - Best Jewellery Store in {siteConfig.address.city}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DefaultLayoutSections />
    </>
  );
}
