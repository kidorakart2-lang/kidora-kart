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
    <section className="bg-background text-foreground px-4 sm:px-6 lg:px-8 py-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
         <h1 className="text-3xl md:text-4xl fw-heading text-foreground mb-4 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground max-w-2xl font-sans mx-auto text-base md:text-md">
          Find answers to common questions about our products, orders, shipping,
          returns, and more.
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
            className="border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 "
          >
            <AccordionTrigger className="w-full flex justify-between items-center text-left px-5 py-5 hover:bg-muted/50 transition-colors duration-300 hover:no-underline">
              <span className="text-md font-sans text-foreground">
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 bg-background">
              <p className="text-muted-foreground text-base md:text-md leading-relaxed">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Contact Section */}
      <div className="text-center mt-16">
        <p className="text-muted-foreground text-base md:text-md mb-2">
          Still have questions?
        </p>
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="text-foreground font-semibold hover:underline transition-colors"
        >
          Contact us at {siteConfig.contact.email}
        </a>
      </div>
    </section>
  );
}
