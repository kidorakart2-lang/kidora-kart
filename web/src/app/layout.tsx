import { Lato } from "next/font/google";
import "./globals.css";
import { Client } from "@/redux/provider/Client";
import { Toaster } from "sonner";
import MainLayout from "@/components/comman/MainLayout";
import { siteConfig, defaultMetadata, getStructuredAddress } from "@/lib/utils";
import { cache } from "react";
import ScrollToTop from "@/components/ui/scroll-to-top";
import RequirementModal from "@/components/comman/RequirementModal";
import LoginModal from "@/components/comman/LoginModal";
import PhoneNumberModal from "@/components/comman/PhoneNumberModal";
import { MotionConfig } from "framer-motion";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-lato",
});

export const metadata = {
  ...defaultMetadata,
  title: {
    default: `${siteConfig.name} - Premium Jewellery Store in Jodhpur | Gold, Silver & Diamond Jewellery`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords.join(", "),
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// Organization Schema Component
function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.webp`,
    description: siteConfig.description,
    foundingDate: siteConfig.business.foundedYear,
    priceRange: siteConfig.business.priceRange,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: getStructuredAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: "26.2389",
      longitude: "73.0243",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "10:00",
        closes: "21:00",
      },
    ],
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.twitter,
      siteConfig.social.pinterest,
      siteConfig.social.youtube,
    ],
    areaServed: {
      "@type": "City",
      name: "Jodhpur",
      containedIn: {
        "@type": "State",
        name: "Rajasthan",
        containedIn: {
          "@type": "Country",
          name: "India",
        },
      },
    },
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking",
    currenciesAccepted: "INR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Website Schema Component
function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/product-listing?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// const getLogo = cache(async () => {
//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}api/website/logo`,
//     {
//       method: "post",
//       // next: { revalidate: 3600 },
//     }
//   );
//   if (!response.ok) {
//     return null;
//   }
//   const data = await response.json();

//   if (!response.ok || !data._status) {
//     return null;
//   }
//   return data;
// });

const getNavigation = cache(async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/nav`,
      {
        next: {
          revalidate: 3600,
          tags: ["navigation"],
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data?._status) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation] = await Promise.all([getNavigation()]);

  console.clear();
  return (
    <html lang="en">
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
        <link rel="canonical" href={siteConfig.url} />
        <meta
          name="google-site-verification"
          content="4jBIp_u1ex8ub0zCeOXN-UnbczFciy1aAO90vr7yhH8"
        />
        <meta name="geo.region" content="IN-RJ" />
        <meta name="geo.placename" content="Jodhpur" />
        <meta name="geo.position" content="26.2389;73.0243" />
        <meta name="ICBM" content="26.2389, 73.0243" />
        <link rel="icon" href="/logo.ico" />
        <meta name="theme-color" content="#F58E00" />
        <meta name="msapplication-TileColor" content="#F58E00" />
      </head>
      <body
        className={`pt-0 !mr-0 bg-background antialiased flex flex-col ${lato.variable} pb-12 md:pb-0`}
      >
        <Client>
          <MotionConfig reducedMotion="user">
          <MainLayout navigationData={navigation}>
            {children}
          </MainLayout>
          <ScrollToTop />
          <Toaster richColors closeButton position="top-right" />
          <LoginModal />
          <RequirementModal />
          <PhoneNumberModal />
          </MotionConfig>
        </Client>
      </body>
    </html>
  );
}
