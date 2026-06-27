import PoliciesPage from "@/app/(sections)/OurPolicy";
import React from "react";
import { siteConfig } from "@/lib/utils";

export const metadata = {
  title: `Privacy & Policies - ${siteConfig.name}`,
  description: `Read ${siteConfig.name}'s privacy policy, refund policy, shipping policy, and terms of service. Learn about our commitment to customer satisfaction and data protection.`,
  keywords: `jewellery store privacy policy, refund policy, shipping policy, terms and conditions, ${siteConfig.name} policies`,
  openGraph: {
    title: `Our Policies - ${siteConfig.name}`,
    description:
      "Understand our policies for a transparent shopping experience.",
    url: `${siteConfig.url}/our-policy`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/our-policy`,
  },
};

export default function page() {
  return (
    <>
      <PoliciesPage />
    </>
  );
}
