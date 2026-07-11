import OrderTracking from "@/app/(sections)/Track";
import { siteConfig } from "@/lib/utils";

const pageTitle = "Track Your Order";
const pageDescription =
  `Track your toy order with ${siteConfig.name}. Check the status of your order and get real-time updates.`;

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
};

export default async function Page() {
  return (
    <main>
      <OrderTracking />
    </main>
  );
}
