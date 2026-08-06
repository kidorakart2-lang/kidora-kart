import FAQPage from "@/app/(sections)/FAQ";
import React, { Suspense } from "react";
import { siteConfig } from "@/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_FAQ } from "@/lib/revalidation-tags";
import { serverFetch } from "@/lib/server-fetch";
import SimpleLoading from "@/components/comman/SimpleLoading";

export const metadata = {
  title: `FAQ - Frequently Asked Questions | ${siteConfig.name}`,
  description: `Find answers to common questions about ${siteConfig.name}. Learn about our jewellery, shipping, returns, and more. Get help with your jewellery shopping.`,
  keywords: `jewellery faq, jewellery questions, gold care, jewellery shipping, jewellery returns, ${siteConfig.name} help`,
  openGraph: {
    title: `FAQ - ${siteConfig.name}`,
    description: "Get answers to all your jewellery shopping questions.",
    url: `${siteConfig.url}/faq`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
};

async function GetFaq() {
  "use cache";
  cacheLife("faq");
  cacheTag(TAG_FAQ);

  try {
    const response = await serverFetch("/api/website/faq", { timeout: 5000 });
    const data = await response.json();
    return data._data;
  } catch {
    return null;
  }
}

function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function FAQContent() {
  const faqs = await GetFaq();

  return (
    <>
      {faqs?.length > 0 && <FAQSchema faqs={faqs} />}
      <FAQPage data={faqs || []} />
    </>
  );
}

export default async function page() {
  return (
    <Suspense fallback={<SimpleLoading type="page" />}>
      <FAQContent />
    </Suspense>
  );
}
