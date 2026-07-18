"use client";

import { motion } from "motion/react";
import { useProductFaqs } from "@/lib/useProductFaqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSet {
  _id: string;
  entries: { question: string; answer: string; order: number }[];
}

export default function ProductFaqSection({
  productId,
}: {
  productId: string;
}) {
  const { data: faqSetsData = [] } = useProductFaqs(productId);
  const faqSets = faqSetsData as FaqSet[];

  // Flatten all entries from all sets, deduplicate by question text
  const seen = new Set<string>();
  const allEntries = faqSets
    .flatMap((set) => set.entries)
    .sort((a, b) => a.order - b.order)
    .filter((entry) => {
      if (seen.has(entry.question)) return false;
      seen.add(entry.question);
      return true;
    });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allEntries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };

  if (allEntries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-background/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-12 border border-white/80">
        <h2 className="text-3xl font-light text-foreground tracking-tight mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {allEntries.map((entry, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-5 py-4 text-foreground font-[450] text-base hover:bg-brand-50 hover:no-underline transition-colors data-[state=open]:bg-brand-50">
                {entry.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 text-muted-foreground text-base font-[350] leading-relaxed">
                {entry.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </motion.section>
  );
}
