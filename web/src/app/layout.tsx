import { Lato } from "next/font/google";
import "./globals.css";
import "@/index.css";
import { Client } from "@/redux/provider/Client";
import { Toaster } from "sonner";
import MainLayout from "@/components/comman/MainLayout";
import { Suspense } from "react";
import { siteConfig, defaultMetadata, getStructuredAddress } from "@/lib/utils";
import { getLogo } from "@/lib/logo";
import { serverFetch } from "@/lib/server-fetch";
import ScrollToTop from "@/components/ui/scroll-to-top";
import RequirementModal from "@/components/comman/RequirementModal";
import LoginModal from "@/components/comman/LoginModal";
import PhoneNumberModal from "@/components/comman/PhoneNumberModal";
import CookieConsent from "@/components/comman/CookieConsent";
import ThemeColorMeta from "@/components/comman/ThemeColorMeta";
import dynamic from "next/dynamic";

const MotionProvider = dynamic(() => import("@/components/MotionProvider"));

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
    default: `${siteConfig.name} - Online Jewellery Store in ${siteConfig.address.city} | Rings, Necklaces & More`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
    "@type": "Store",
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
      latitude: String(siteConfig.address.geo.lat),
      longitude: String(siteConfig.address.geo.lng),
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
      name: siteConfig.address.city,
      containedIn: {
        "@type": "State",
        name: siteConfig.address.state,
        containedIn: {
          "@type": "Country",
          name: siteConfig.address.country,
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

async function getNavigation() {
  try {
    const response = await serverFetch("/api/website/nav", { timeout: 5000 });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?._status) return null;
    return data;
  } catch {
    return null;
  }
}

async function getFeaturedProducts() {
  try {
    const response = await serverFetch("/api/website/product/featured-for-footer", { timeout: 5000 });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?._status) return null;
    return data._data ?? [];
  } catch {
    return null;
  }
}

// ── Data-fetching layout content ──
// Extracted into a separate async component so it can be wrapped in
// <Suspense>. Without this, the Promise.all blocks the entire page
// from rendering (Next.js 16 PPR => "blocking-route" error).

async function LayoutContent({ children }: { children: React.ReactNode }) {
  const [navigation, featuredProducts, logoData] = await Promise.all([
    getNavigation(),
    getFeaturedProducts(),
    getLogo(),
  ]);

  return (
    <MainLayout
      navigationData={navigation}
      featuredProducts={featuredProducts ?? []}
      logoData={logoData}
    >
      {children}
    </MainLayout>
  );
}

// ── Static shell fallback ──
// Rendered immediately while LayoutContent streams in.
// Shows children without the data-dependent header/footer.

function LayoutFallback({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
        <link rel="canonical" href={siteConfig.url} />
        <meta
          name="google-site-verification"
          content={siteConfig.googleVerification}
        />
        <meta name="geo.region" content={siteConfig.address.regionCode} />
        <meta name="geo.placename" content={siteConfig.address.city} />
        <meta name="geo.position" content={`${siteConfig.address.geo.lat};${siteConfig.address.geo.lng}`} />
        <meta name="ICBM" content={`${siteConfig.address.geo.lat}, ${siteConfig.address.geo.lng}`} />
        <link rel="icon" href="/logo.ico" />
        <meta name="theme-color" content={siteConfig.themeColor} />
        <meta name="msapplication-TileColor" content={siteConfig.themeColor} />
      </head>
      <body
        className={`pt-0 !mr-0 bg-background antialiased flex flex-col ${lato.variable} pb-12 md:pb-0`}
      >
        <ThemeColorMeta />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-foreground" />
          </div>
        }>
        <Client>
          <MotionProvider>
            <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
              <LayoutContent>{children}</LayoutContent>
            </Suspense>
            <ScrollToTop />
            <Toaster richColors closeButton position="top-right" />
            <LoginModal />
            <RequirementModal />
            <PhoneNumberModal />
            <CookieConsent />
          </MotionProvider>
        </Client>
        </Suspense>
      </body>
    </html>
  );
}
