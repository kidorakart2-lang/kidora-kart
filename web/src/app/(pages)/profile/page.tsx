import AccountPage from "@/app/(sections)/Profile";
import React from "react";
import { siteConfig, defaultMetadata } from "@/lib/utils";

export function generateMetadata() {
  const baseTitle = "My Account";
  const baseDescription = `Manage your jewellery preferences, orders, and personal information at ${siteConfig.name}.`;

  return {
    ...defaultMetadata,
    title: {
      default: `${baseTitle} | ${siteConfig.name}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: baseDescription,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: `${baseTitle} | ${siteConfig.name}`,
      description: baseDescription,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: `${baseTitle} | ${siteConfig.name}`,
      description: baseDescription,
    },
    robots: {
      ...defaultMetadata.robots,
      index: false,
      follow: true,
    },
  };
}



export default async function page() {
  
  return (
    <>
      <AccountPage />
    </>
  );
}
