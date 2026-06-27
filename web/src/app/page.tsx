import Banner from "./(sections)/Banner";
import RoundCategorySlider from "./(sections)/RoundCategorySlider";
import MenWomen from "./(sections)/MenWomen";
import ShopByPrice from "./(sections)/ShopbyPrice";
import TabProducts from "./(sections)/TabProducts";
import Slider from "./(sections)/Slider";
import WhyChooseUs from "./(sections)/WhyChooseUs";
import Testimonial from "./(sections)/Testimonial";
import FullVideoSection from "./(sections)/video";
import { siteConfig } from "@/lib/utils";
import { cache } from "react";
import ProductsTab from "./(sections)/ProductsTab";

export const metadata = {
  title: `Jewellery Walla in Jodhpur | Best Gold & Silver Jewellery Shop | ${siteConfig.name}`,
  description: `Best Jewellery Walla in Jodhpur - ${siteConfig.name} offers exquisite collection of Gold, Silver, Diamond & Polki jewellery. Visit our store in Jodhpur for traditional & modern designs. Free Shipping & Lifetime Exchange.`,
  keywords: [
    "jewelry vala",
    "Jewellery Walla Jodhpur",
    "Best Jewellery Shop in Jodhpur",
    "Gold Jewellery Jodhpur",
    "Silver Jewellery Jodhpur",
    "Diamond Jewellery Jodhpur",
    "Traditional Jewellery Jodhpur",
    "Jewellery Store Near Me",
    "Jodhpur Jewellery Market",
    "Jewellery Wholesale Jodhpur",
    "Bridal Jewellery Jodhpur",
    ...siteConfig.keywords,
  ].join(", "),
  openGraph: {
    title: `Jewellery Walla in Jodhpur | Best Gold & Silver Jewellery | ${siteConfig.name}`,
    description: `Discover the finest collection of traditional and contemporary jewellery at ${siteConfig.name}, the leading Jewellery Walla in Jodhpur. Best prices on Gold, Silver, Diamond & Polki jewellery.`,
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
      streetAddress: "Your Store Address",
      addressLocality: "Jodhpur",
      addressRegion: "Rajasthan",
      postalCode: "342005",
      addressCountry: "IN",
    },
    phone: `+91-${process.env.NEXT_PUBLIC_BUSINESS_PHONE}`,
    email: `${process.env.NEXT_PUBLIC_BUSINESS_EMAIL}`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Jewellery Walla in Jodhpur | ${siteConfig.name} | Best Jewellery Store`,
    description: `Explore our exclusive collection of Gold, Silver & Diamond jewellery in Jodhpur. Best prices & latest designs at ${siteConfig.name}. Visit us today!`,
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
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    yandex: "YANDEX_VERIFICATION_CODE",
  },
};

// Structured Data for Local Business
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: siteConfig.name,
  image: `${siteConfig.url}/og-image.jpg`,
  description: `Best Jewellery Walla in Jodhpur offering Gold, Silver, Diamond & Polki jewellery. Visit our store in Jodhpur for traditional & modern designs.`,
  url: siteConfig.url,
  telephone: `+91-${process.env.NEXT_PUBLIC_BUSINESS_PHONE}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Your Store Address",
    addressLocality: "Jodhpur",
    addressRegion: "Rajasthan",
    postalCode: "342005",
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
  priceRange: "₹200 - ₹50000",
  sameAs: [
    "https://www.facebook.com/jewellery__wala_?igsh=MTBqdHI5cjYyMjZsMA==",
    "https://www.instagram.com/jewellery__wala_?igsh=MTBqdHI5cjYyMjZsMA==",
    "https://maps.app.goo.gl/ohKdTgWQicv8Xjf89",
  ],
};

// import TraditionalJewellery from "./(sections)/Traditional";
const GetTestimonials = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/testimonial",
      {
        next: {
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
  const [testimonials, tabsData, newArrivals, trendingProducts , bestSellersProducts] =
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Banner />
      <RoundCategorySlider />
      <MenWomen />
      {/* <TraditionalJewellery/> */}
      <ShopByPrice bg="bg-[#f8f8f8]" />
      <TabProducts data={tabsData} />
      <WhyChooseUs bg="bg-[#f8f8f8]" />
      <Slider data={newArrivals} heading="New Arrivals" />
      <FullVideoSection />
      <Slider data={bestSellersProducts} heading="Best Sellers Products" />
      <ProductsTab />

      <Slider
        data={trendingProducts}
        heading="Trending Products"
       
      />
      <Testimonial data={testimonials}  bg="bg-[#f8f8f8]/50" />
    </>
  );
}
