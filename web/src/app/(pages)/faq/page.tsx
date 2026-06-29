import FAQPage from "@/app/(sections)/FAQ";
import React from "react";
import { siteConfig } from "@/lib/utils";

export const metadata = {
  title: `FAQ - Frequently Asked Questions | ${siteConfig.name}`,
  description: `Find answers to common questions about ${siteConfig.name}. Learn about our jewellery, shipping, returns, customization, and more. Get help with your jewellery shopping.`,
  keywords: `jewellery faq, jewellery questions, gold jewellery care, silver jewellery maintenance, jewellery shipping, jewellery returns, ${siteConfig.name} help`,
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
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/faq"
    );
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

export default async function page() {
  const faqs = await GetFaq();

  return (
    <>
      {faqs?.length > 0 && <FAQSchema faqs={faqs} />}
      <FAQPage data={faqs || []} />
    </>
  );
}
