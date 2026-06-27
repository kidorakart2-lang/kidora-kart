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
}

interface SiteAddress {
  street: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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
  keywords: string[];
  categories: string[];
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
  },

  address: {
    street: "Main Jhalamand Circle Jodhpur,Rajasthan",
    locality: "Jhalamand",
    city: "Jodhpur",
    state: "Rajasthan",
    postalCode: "342001",
    country: "India",
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

  keywords: [
    "jewelry walla",
    "jewellery store jodhpur",
    "jewellery walla store jodhpur",
    "gold jewellery jodhpur",
    "silver jewellery jodhpur",
    "cheap jewellery shop",
    "jewellery shop in jodhpur",
    "diamond jewellery jodhpur",
    "traditional jewellery rajasthan",
    "bridal jewellery ",
    "men jewellery",
    "women jewellery",
    "jewellery shop near me",
    "online jewellery store",
    "rajasthani jewellery",
    "kundan jewellery",
    "meenakari jewellery",
    "wedding jewellery jodhpur",
    "jewellery walla",
    "personalised jewellery",
    "gift items",
    "track your order",
  ],

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

    "Contact Us",
  ],
};

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
    default: `${siteConfig.name} - Premium Jewellery Store in Jodhpur`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
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
    title: `${siteConfig.name} - Premium Jewellery Store in Jodhpur`,
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
    creator: "@jewellerywalla",
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
