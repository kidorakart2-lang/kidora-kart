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
}

// SEO Configuration for Jewellery Walla
export const siteConfig: SiteConfig = {
  name: "Jewellery Walla",
  legalName: "Jewellery Walla Private Limited",
  description:
    "Premium jewelry store in Jodhpur offering all types of jewelery for men and women. Discover unique designs and traditional craftsmanship.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.jewellerywalla.com",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "jewellerywalla.com",

  contact: {
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "info@jewellerywalla.com",
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91-291-1234567",
    mobile: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91-9876543210",
    whatsapp: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+919876543210",
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
      "https://www.instagram.com/jewellery__wala_?igsh=MTBqdHI5cjYyMjZsMA==",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/jewellerywalla",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/jewellerywalla",
    pinterest: process.env.NEXT_PUBLIC_PINTEREST_URL || "https://pinterest.com/jewellerywalla",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@jewellerywalla",
  },

  business: {
    foundedYear: "2020",
    priceRange: "₹200 - ₹50000",
    hoursWeekday: "10:00 AM - 10:00 PM",
    hoursWeekend: "10:00 AM - 10:00 PM",
  },

  themeColor: "#F58E00",
  twitterHandle: "@jewellerywalla",

  categories: [
    "Rings",
    "Necklaces",
    "Earrings",
    "Bracelets",
    "Bangles",
    "Pendants",
    "Chains",
    "Mangalsutra",
    "Nose Pins",
    "Anklets",
    "Bridal Sets",
    "Men's Jewellery",
    "Women's Jewellery",
    "Personalised Jewellery",
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

// Default metadata for pages
export const defaultMetadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Premium Jewellery Store in ${siteConfig.address.city}`,
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
    title: `${siteConfig.name} - Premium Jewellery Store in ${siteConfig.address.city}`,
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
    title: `${siteConfig.name} - Premium Jewellery Store in Jodhpur`,
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
