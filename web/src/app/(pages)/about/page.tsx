import About from "@/app/(sections)/About";
import React from "react";
import { siteConfig } from "@/lib/utils";

export const metadata = {
  title: `About ${siteConfig.name} - Premium Jewellery Store in Jodhpur`,
  description: `Learn about ${siteConfig.name}, Jodhpur's trusted jewellery store since ${siteConfig.business.foundedYear}. Discover our story, craftsmanship, and commitment to quality gold, silver, and diamond jewellery.`,
  keywords: `about ${siteConfig.name}, jewellery store jodhpur history, traditional jewellery craftsmanship, rajasthani jewellery heritage`,
  openGraph: {
    title: `About ${siteConfig.name} - Our Story`,
    description: `Discover the story behind Jodhpur's premier jewellery destination. Quality craftsmanship since ${siteConfig.business.foundedYear}.`,
    url: `${siteConfig.url}/about`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
};

export default function page() {
  return <About />;
}
