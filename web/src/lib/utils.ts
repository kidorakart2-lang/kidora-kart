import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Site Configuration Types ---

interface SiteContact {
  email: string;
  phone: string;
  mobile: string;
  whatsapp: string;
  countryCode: string;
}

interface SiteAddress {
  street: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  regionCode: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  geo: {
    lat: number;
    lng: number;
  };
}

interface SiteSocial {
  instagram: string;
  facebook: string;
  twitter: string;
  pinterest: string;
  youtube: string;
  facebookAppId?: string;
}

interface SiteBusiness {
  foundedYear: string;
  priceRange: string;
  hoursWeekday: string;
  hoursWeekend: string;
}

interface SiteConfig {
  name: string;
  legalName: string;
  description: string;
  url: string;
  domain: string;
  contact: SiteContact;
  address: SiteAddress;
  social: SiteSocial;
  business: SiteBusiness;
  categories: string[];
  themeColor: string;
  twitterHandle: string;
  googleVerification: string;
}

// SEO Configuration for Kidora Kart
export const siteConfig: SiteConfig = {
  name: "Kidora Kart",
  legalName: "Kidora Kart Private Limited",
  description:
    "India's favorite online toy shop in Jodhpur offering a wide range of toys, games, and gifts for kids of all ages. Discover educational toys, action figures, dolls, board games, and more.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.kidorakart.com",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "kidorakart.com",

  contact: {
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "info@kidorakart.com",
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91-6378643867",
    mobile: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91-6378643867",
    whatsapp: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+916378643867",
    countryCode: "+91",
  },

  address: {
    street: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Main Jhalamand Circle, Jodhpur, Rajasthan",
    locality: "Jhalamand",
    city: "Jodhpur",
    state: "Rajasthan",
    postalCode: process.env.NEXT_PUBLIC_BUSINESS_POSTAL_CODE || "342005",
    country: "India",
    regionCode: "IN-RJ",
    googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL || "https://maps.app.goo.gl/ohKdTgWQicv8Xjf89",
    googleMapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3579.0519319886844!2d73.03910947406595!3d26.22750208920371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39418b779b15f17f%3A0xdd3cdd6bd6778a08!2sJEWELLERY%20WALA!5e0!3m2!1sen!2sin!4v1762241579048!5m2!1sen!2sin",
    geo: { lat: 26.2389, lng: 73.0243 },
  },

  social: {
    instagram:
      "https://www.instagram.com/kidorakart/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/kidorakart",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/kidorakart",
    pinterest: process.env.NEXT_PUBLIC_PINTEREST_URL || "https://pinterest.com/kidorakart",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@kidorakart",
  },

  business: {
    foundedYear: "2024",
    priceRange: "₹99 - ₹9999",
    hoursWeekday: "10:00 AM - 10:00 PM",
    hoursWeekend: "10:00 AM - 10:00 PM",
  },

  themeColor: "#F58E00", // SSR fallback — overridden at runtime by ClientThemeColor from --brand-500 CSS var
  twitterHandle: "@kidorakart",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "4jBIp_u1ex8ub0zCeOXN-UnbczFciy1aAO90vr7yhH8",

  categories: [
    "Action Figures",
    "Dolls & Playsets",
    "Educational Toys",
    "Board Games",
    "Puzzles",
    "Remote Control Toys",
    "Building Blocks",
    "Soft Toys",
    "Cars & Vehicles",
    "Musical Toys",
    "Outdoor Play",
    "Art & Craft",
    "Pretend Play",
    "Gift Items",
  ],
};

// Indian states and union territories (shared across forms)
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

// Get full address as string
export const getFullAddress = (): string => {
  const { street, locality, city, state, postalCode, country } =
    siteConfig.address;
  return `${street}, ${locality}, ${city}, ${state} ${postalCode}, ${country}`;
};

// Get structured address for schema
export const getStructuredAddress = () => ({
  "@type": "PostalAddress" as const,
  streetAddress: siteConfig.address.street,
  addressLocality: siteConfig.address.city,
  addressRegion: siteConfig.address.state,
  postalCode: siteConfig.address.postalCode,
  addressCountry: siteConfig.address.country,
});

// Read theme-color from CSS variable at runtime (client-side only)
export const getThemeColor = (): string => {
  if (typeof window === "undefined") return siteConfig.themeColor;
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--brand-500").trim() ||
    siteConfig.themeColor
  );
};

// Default metadata for pages
export const defaultMetadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Online Toy Store in ${siteConfig.address.city} | Shop Toys & Games Online`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website" as const,
    locale: "en_IN" as const,
    url: siteConfig.url,
    title: `${siteConfig.name} - Online Toy Store in ${siteConfig.address.city}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `${siteConfig.name} - Online Toy Store in Jodhpur`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.jpg`],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  manifest: "/site.webmanifest",
};
