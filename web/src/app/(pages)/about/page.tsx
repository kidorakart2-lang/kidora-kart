import About from "@/app/(sections)/About";
import React from "react";
import { siteConfig } from "@/lib/utils";

export const metadata = {
  title: `About ${siteConfig.name} - Online Toy Store in Jodhpur`,
  description: `Learn about ${siteConfig.name}, Jodhpur's trusted toy store since ${siteConfig.business.foundedYear}. Discover our story, passion for toys, and commitment to quality and fun.`,
  keywords: `about ${siteConfig.name}, toy store jodhpur history, kids toys jodhpur, children's toy shop rajasthan`,
  openGraph: {
    title: `About ${siteConfig.name} - Our Story`,
    description: `Discover the story behind Jodhpur's premier toy destination. Quality toys and games since ${siteConfig.business.foundedYear}.`,
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
