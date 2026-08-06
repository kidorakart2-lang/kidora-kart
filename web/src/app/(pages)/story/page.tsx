import Story from "@/app/(sections)/Story";
import React from "react";
import { defaultMetadata, siteConfig } from "@/lib/utils";

const pageTitle = `Our Journey - The Story of ${siteConfig.name}`;
const pageDescription = `Discover the inspiring journey of ${siteConfig.name} - from humble beginnings to becoming ${siteConfig.address.city}'s trusted name in exquisite jewelry. Explore our story of passion, craftsmanship, and commitment to quality.`;

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
    type: "article",
    publishedTime: "2023-01-01T00:00:00.000Z",
    modifiedTime: new Date().toISOString(),
    section: "About Us",
    authors: [siteConfig.name],
    tags: ["Jewellery", "Jodhpur", "Success Story", "Jewellery Making"],
  },
  twitter: {
    ...defaultMetadata.twitter,
    title: pageTitle,
    description: pageDescription,
  },
  other: {
    "og:site_name": siteConfig.name,
    "article:published_time": "2023-01-01T00:00:00.000Z",
    "article:modified_time": new Date().toISOString(),
    "article:section": "About Us",
    "article:tag": ["Jewellery", "Jodhpur", "Success Story", "Jewellery Making"],
  },
};

export default function page() {
  return <Story />;
}
