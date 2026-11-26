"use client";
import { motion } from "motion/react";
import {
  Shield,
  Lock,
  MessageCircle,
  RefreshCw,
  Clock,
  Ruler,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/utils";

const OurPolicy = () => {
  const policies = [
    {
      title: "Quality Assurance",
      description:
        `At ${siteConfig.name}, we are committed to providing our customers with the highest quality jewellery. Each piece is carefully curated and inspected to ensure it meets our strict quality standards before reaching you.`,
      icon: Shield,
    },
    {
      title: "Secure Shopping",
      description:
        "Your security is our priority. We use industry-standard encryption to protect your personal and payment information. Shop with confidence knowing your data is safe with us.",
      icon: Lock,
    },
    {
      title: "Customer Support",
      description:
        "Our dedicated customer service team is available to assist you with any questions or concerns. Contact us via email, phone, or live chat.",
      icon: MessageCircle,
    },
  ];

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
           <p className="eyebrow mb-2"><span className="mr-2">✦</span>The small print</p>
          <h1 className="display-heading mb-3 text-3xl md:text-4xl">
            Our Policies
          </h1>
          <div className="mb-4 h-px w-16 bg-[var(--brand-gold)]"></div>
          <p className="text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
            At {siteConfig.name}, we are committed to providing you with an
            exceptional shopping experience. Here's how we ensure your
            satisfaction at every step.
          </p>
        </motion.div>

        {/* Key Policies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-8 mb-12"
        >
          {policies.map((policy, index) => {
            const IconComponent = policy.icon;
            return (
              <div key={index} className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6">
                <div className="mb-2 flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10">
                    <IconComponent className="h-4 w-4 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                  </div>
                  <h2 className="display-heading text-lg">{policy.title}</h2>
                </div>
                <p className="text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
                  {policy.description}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Refund & Cancellation Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10">
              <RefreshCw className="h-4 w-4 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
            </div>
            <h2 className="display-heading text-2xl">
              Refund &amp; Cancellation Policy
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                <h3 className="display-heading text-lg">
                  Order Cancellation
                </h3>
              </div>
              <p className="pl-7 text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
                You can cancel your order within{" "}
                <strong className="text-foreground">24 hours</strong> of placing
                it. Simply contact our customer support team or use your account
                dashboard to initiate the cancellation.
              </p>
            </div>

            <div>
              <div className="flex items-start gap-2 mb-2">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                <h3 className="display-heading text-lg">
                  Refund Processing
                </h3>
              </div>
              <p className="pl-7 text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
                Once your return or cancellation is approved, refunds will be
                processed within{" "}
                <strong className="text-foreground">3-5 business days</strong>{" "}
                according to Razorpay's processing timeline. The amount will be
                credited to your original payment method.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--brand-gold)]/25 bg-white p-4 pl-7">
              <p className="text-[12px] leading-relaxed text-[var(--brand-ink)]/70">
                <strong className="text-foreground">Note:</strong> For personalized or custom
                jewellery orders, cancellations may not be available once
                production has begun. Please contact us immediately if you need
                to make changes.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cookie & Data Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10">
              <Lock className="h-4 w-4 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
            </div>
            <h2 className="display-heading text-2xl">
              Cookie &amp; Data Usage Policy
            </h2>
          </div>

          <div className="space-y-4 text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
            <p>
              We use cookies to help us recognize returning users and keep your
              shopping experience smooth. No personal data is shared with
              third-party services — your data stays with us.
            </p>
            <p>
              We analyze user activity only to understand which products are
              performing better and to improve our catalog. All insights are
              handled internally — no outside analytics or ad networks are
              involved.
            </p>
            <p>
              All deliveries are handled by our own trusted delivery agents.
              Each package has a unique Package ID to ensure secure and timely
              delivery. We guarantee your order will reach you safely and
              intact.
            </p>
            <p>
              Please note, EMI or installment payment options are currently{" "}
              <strong className="text-foreground">not available</strong>. For
              product care, maintenance, or service inquiries, contact our team
              directly — we're here to help.
            </p>
            <p>
              We're{" "}
              <strong className="text-foreground">
                100% Quality Guaranteed
              </strong>
              , ensuring safety and quality in every item. All our jewellery meets
              the highest quality standards and is made to last.
            </p>
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="display-heading mb-6 text-2xl">
            Additional Information
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                <h3 className="display-heading text-lg">
                  Size Guide
                </h3>
              </div>
              <p className="pl-7 text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
                Not sure about the right size, length or fit? Contact our
                customer service for assistance in finding the perfect piece
                for every occasion.
              </p>
            </div>

            <div>
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                <h3 className="display-heading text-lg">
                  Custom Orders
                </h3>
              </div>
              <p className="pl-7 text-[12.5px] leading-relaxed text-[var(--brand-ink)]/70">
                Looking for something special? We offer custom jewellery and
                gifting options. Contact us to discuss your needs and we'll
                help find the perfect present.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OurPolicy;