import ContactPage from "@/app/(sections)/Contact";
import React from "react";
import { siteConfig, getFullAddress } from "@/lib/utils";

export const metadata = {
  title: `Contact ${siteConfig.name} - Jewellery Store in Jodhpur`,
  description: `Contact ${
    siteConfig.name
  } for premium jewellery in Jodhpur. Visit us at ${getFullAddress()} or call ${
    siteConfig.contact.phone
  }. Email: ${siteConfig.contact.email}`,
  keywords: `contact ${siteConfig.name}, jewellery store jodhpur contact, ${siteConfig.address.city} jewellery shop address, jewellery store phone number`,
  openGraph: {
    title: `Contact ${siteConfig.name}`,
    description: `Get in touch with Jodhpur's premier jewellery store. Visit our showroom or reach us online.`,
    url: `${siteConfig.url}/contact`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default function page() {
  return (
    <div>
      <ContactPage />
    </div>
  );
}
