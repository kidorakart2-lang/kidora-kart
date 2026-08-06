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
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
           <h1 className="text-3xl md:text-4xl fw-heading text-foreground mb-3">
            Our Policies
          </h1>
          <div className="w-16 h-0.5 bg-foreground mb-4"></div>
          <p className="text-muted-foreground text-base leading-relaxed">
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
              <div
                key={index}
                className="border-l-4 border-foreground/20 pl-6 py-2"
              >
                <div className="flex items-start gap-3 mb-2">
                  <IconComponent className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-foreground">
                    {policy.title}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
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
            <RefreshCw className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl fw-heading text-foreground">
              Refund & Cancellation Policy
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-foreground">
                  Order Cancellation
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7">
                You can cancel your order within{" "}
                <strong className="text-foreground">24 hours</strong> of placing
                it. Simply contact our customer support team or use your account
                dashboard to initiate the cancellation.
              </p>
            </div>

            <div>
              <div className="flex items-start gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-foreground">
                  Refund Processing
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Once your return or cancellation is approved, refunds will be
                processed within{" "}
                <strong className="text-foreground">3-5 business days</strong>{" "}
                according to Razorpay's processing timeline. The amount will be
                credited to your original payment method.
              </p>
            </div>

            <div className="bg-muted border border-border rounded-lg p-4 pl-7">
              <p className="text-sm text-muted-foreground leading-relaxed">
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
            <Lock className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl fw-heading text-foreground">
              Cookie & Data Usage Policy
            </h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
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
              , ensuring authenticity and quality in every piece. All our
              jewellery is hallmarked and certified for your peace of mind.
            </p>
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl fw-heading text-foreground mb-6">
            Additional Information
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Ruler className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-foreground">
                  Size Guide
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Unsure about which jewellery size fits you best? Contact our
                customer service for assistance in finding the perfect fit
                for any occasion.
              </p>
            </div>

            <div>
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-foreground">
                  Custom Orders
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Looking for something special? We offer custom jewellery and gift
                options. Contact us to discuss your needs and we'll craft
                the perfect piece.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OurPolicy;