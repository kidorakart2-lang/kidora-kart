import Story from "@/app/(sections)/Story";
import React from "react";
import { Sparkles, Users, Award, Package, } from "lucide-react";
import { defaultMetadata, siteConfig } from "@/lib/utils";

const pageTitle = "Our Journey - The Story of Jewellery Walla";
const pageDescription = "Discover the inspiring journey of Jewellery Walla - from humble beginnings to becoming Jodhpur's trusted name in exquisite jewelry. Explore our story of passion, craftsmanship, and commitment to quality.";

const keywords = [
  ...siteConfig.keywords,
  "jewellery walla story",
  "jewellery shop journey",
  "jodhpur jewellery history",
  "jewellery business success story",
  "traditional jewellery makers jodhpur",
  "jewellery walla about us",
  "jewellery walla journey",
  "jewellery walla history"
];

export const metadata = {
  ...defaultMetadata,
  title: pageTitle,
  description: pageDescription,
  keywords: keywords,
  alternates: {
    canonical: `${siteConfig.url}/story`,
  },
  openGraph: {
    ...defaultMetadata.openGraph,
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.url}/story`,
    type: 'article',
    publishedTime: '2023-01-01T00:00:00.000Z',
    modifiedTime: new Date().toISOString(),
    section: 'About Us',
    authors: [siteConfig.name],
    tags: ['Jewellery', 'Jodhpur', 'Success Story', 'Jewellery Making'],
  },
  twitter: {
    ...defaultMetadata.twitter,
    title: pageTitle,
    description: pageDescription,
  },
  other: {
    'fb:app_id': siteConfig.social?.facebookAppId || '',
    'og:site_name': siteConfig.name,
    'article:published_time': '2023-01-01T00:00:00.000Z',
    'article:modified_time': new Date().toISOString(),
    'article:section': 'About Us',
    'article:tag': ['Jewellery', 'Jodhpur', 'Success Story', 'Jewellery Making'],
  },
};

// Generate JSON-LD structured data
export function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': pageTitle,
    'description': pageDescription,
    'image': `${siteConfig.url}/og-image.jpg`,
    'author': {
      '@type': 'Organization',
      'name': siteConfig.name,
      'url': siteConfig.url
    },
    'publisher': {
      '@type': 'Organization',
      'name': siteConfig.name,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteConfig.url}/logo.webp`
      }
    },
    'datePublished': '2023-01-01T00:00:00.000Z',
    'dateModified': new Date().toISOString(),
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/story`
    }
  };
}

const milestones = [
  {
    year: "College Days",
    title: "The Beginning",
    description:
      "Three friends with a shared vision started their entrepreneurial journey with an online shoes business through WhatsApp.",
    icon: Users,
  },
  {
    year: "2023",
    title: "Men's Wear Venture",
    description:
      "Established a menswear clothing business at Main Bhati Circle, Ratanada, Jodhpur, honing our skills in marketing and sales.",
    icon: Package,
  },
  {
    year: "Present",
    title: "Jewellery Walla Born",
    description:
      "With 10 years of jewellery expertise, we opened our store in Jhalamand, combining retail, manufacturing, and customization.",
    icon: Sparkles,
  },
  {
    year: "Now",
    title: "All India Presence",
    description:
      "Expanded our reach online, delivering exquisite jewellery across India while maintaining our commitment to quality and customization.",
    icon: Award,
  },
];
export default function page() {
  return <Story />;
}
