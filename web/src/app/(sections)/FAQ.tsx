"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/lib/utils";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
}

export default function FAQPage({ data }: { data: FAQItem[] | null | undefined }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl bg-white px-4 py-16 text-[var(--brand-ink)] sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="eyebrow mb-2"><span className="mr-2">✦</span>Good to know</p>
        <h1 className="display-heading text-3xl md:text-4xl">
          Frequently Asked <span className="accent-italic">Questions</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[12.5px] leading-relaxed text-[var(--brand-ink)]/55">
          Answers about our silver, orders, shipping and returns.
        </p>
      </div>

      {/* FAQ Accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue="item-0"
        className="space-y-4"
      >
        {data.map((faq, index) => (
          <AccordionItem
            key={faq._id}
            value={`item-${index}`}
            className="overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-white transition-colors duration-300 data-[state=open]:border-[var(--brand-gold)]/50"
          >
            <AccordionTrigger className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors duration-300 hover:bg-[var(--brand-cream)]/60 hover:no-underline">
              <span className="text-[13.5px] text-[var(--brand-ink)]">
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t border-[var(--brand-gold)]/15 bg-white px-5 pb-5">
              <p className="text-[12.5px] leading-relaxed text-[var(--brand-ink)]/60">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Contact Section */}
      <div className="mt-16 rounded-xl border border-[var(--brand-gold)]/25 bg-white p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/45">
          Still have questions?
        </p>
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="display-heading mt-2 inline-block text-lg text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 hover:no-underline"
        >
          Contact us at {siteConfig.contact.email}
        </a>
      </div>
    </section>
  );
}
