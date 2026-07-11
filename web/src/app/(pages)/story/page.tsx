import Story from "@/app/(sections)/Story";
import React from "react";
import { Sparkles, Users, Award, Package, } from "lucide-react";
import { defaultMetadata, siteConfig } from "@/lib/utils";

const pageTitle = `Our Journey - The Story of ${siteConfig.name}`;
const pageDescription = `Discover the inspiring journey of ${siteConfig.name} - from humble beginnings to becoming ${siteConfig.address.city}'s trusted name in toys and games. Explore our story of passion, creativity, and commitment to quality.`;

export const metadata = {
  ...defaultMetadata,
  title: pageTitle,
  description: pageDescription,
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
    modifiedTime: '2023-01-01T00:00:00.000Z',
    section: 'About Us',
    authors: [siteConfig.name],
    tags: ['Toys', 'Jodhpur', 'Success Story', 'Toy Shop'],
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
    'article:modified_time': '2023-01-01T00:00:00.000Z',
    'article:section': 'About Us',
    'article:tag': ['Toys', 'Jodhpur', 'Success Story', 'Toy Shop'],
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
    'dateModified': '2023-01-01T00:00:00.000Z',
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
    title: `${siteConfig.name} Born`,
    description:
      "With a passion for bringing joy to children, we opened our toy store in Jhalamand, combining retail with a love for creativity and play.",
    icon: Sparkles,
  },
  {
    year: "Now",
    title: "All India Presence",
    description:
      "Expanded our reach online, delivering toys across India while maintaining our commitment to quality and customer happiness.",
    icon: Award,
  },
];
export default function page() {
  return <Story />;
}
