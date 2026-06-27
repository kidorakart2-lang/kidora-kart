import OrderTracking from "@/app/(sections)/Track";
import { siteConfig } from "@/lib/utils";

const pageTitle = "Track Your Order";
const pageDescription =
  "Track your jewelry order with Jewellery Wala. Check the status of your precious jewelry purchase and get real-time updates.";

export const metadata = {
  title: `${pageTitle} | ${siteConfig.name}`,
  description: pageDescription,
  openGraph: {
    title: `${pageTitle} | ${siteConfig.name}`,
    description: pageDescription,
    url: `${siteConfig.url}/order-track`,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${siteConfig.name}`,
    description: pageDescription,
  },
  keywords: [
    ...siteConfig.keywords.filter(
      (k) => k.toLowerCase() !== "track your order"
    ),
    "order status",
    "order tracking",
    "jewelry order status",
    "track jewelry order",
  ].join(", "),
};

export default async function Page() {
  return (
    <main>
      <OrderTracking />
    </main>
  );
}
