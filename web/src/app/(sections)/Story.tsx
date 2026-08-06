"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Users, Package, MapPin, Gem, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { siteConfig, getFullAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const milestones = [
  {
    year: "College Days",
    title: "The Beginning",
    description:
      "Three friends with a shared vision started their entrepreneurial journey with an online shoes business through WhatsApp.",
    icon: Users,
  },
  {
    year: "2023",
    title: "Men's Wear Venture",
    description:
      "Established a menswear clothing business at Main Bhati Circle, Ratanada, Jodhpur, honing our skills in marketing and sales.",
    icon: Package,
  },
  {
    year: "Present",
    title: `${siteConfig.name} Born`,
    description:
      "With 10 years of jewellery expertise, we opened our store in Jhalamand, combining retail, manufacturing, and customization.",
    icon: Sparkles,
  },
  {
    year: "Now",
    title: "All India Presence",
    description:
      "Expanded our reach online, delivering exquisite jewellery across India while maintaining our commitment to quality and customization.",
    icon: Gem,
  },
];

const differentiators = [
  {
    title: "Retail Excellence",
    description: "Curated collections for every occasion",
  },
  {
    title: "Manufacturing",
    description: "In-house craftsmanship and quality control",
  },
  {
    title: "Customization",
    description: "Bringing your unique vision to life",
  },
  {
    title: "Pan-India Delivery",
    description: "Your jewellery, anywhere in India",
  },
];

export default function Story() {
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.6, ease: "easeOut" as const },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/70 via-background to-brand-100/40">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-brand-accent-200/30 blur-3xl"
        />

        <div className="section-container relative py-16 md:py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs md:text-sm font-medium tracking-[0.35em] uppercase text-brand-600"
          >
            From Friendship to Craftsmanship
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${playfair.variable} [font-family:var(--font-playfair)] mt-4 text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight`}
          >
            Our{" "}
            <span className="italic bg-gradient-to-r from-brand-600 via-brand-500 to-brand-accent-500 bg-clip-text text-transparent">
              Journey
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 flex items-center justify-center gap-3"
          >
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand-500" />
            <Sparkles className="size-4 text-brand-500" aria-hidden />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand-500" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            A journey of passion, dedication, and sparkling dreams — from
            three friends in college to a trusted name in Indian jewellery.
          </motion.p>
        </div>
      </section>

      {/* ── Narrative Intro ──────────────────────────────────── */}
      <section className="section-container pb-14">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-background/70 p-8 md:p-10 shadow-sm"
        >
          <h2
            className={`${playfair.variable} [font-family:var(--font-playfair)] text-2xl md:text-3xl text-foreground`}
          >
            Where It All Began
          </h2>
          <div className="mt-5 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              What began as three friends with big dreams in college has
              blossomed into a trusted name in the jewellery industry. Our
              journey started with humble beginnings — selling shoes online
              through WhatsApp, where we learned the art of customer service and
              building relationships.
            </p>
            <p>
              This foundation taught us invaluable lessons about
              entrepreneurship and the power of perseverance. Today, every piece
              at {siteConfig.name} carries that same spirit —{" "}
              <span className="font-semibold text-foreground">
                built on friendship, driven by passion.
              </span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <section className="bg-section-subtle py-16 md:py-20">
        <div className="section-container">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
              Milestones
            </p>
            <h2
              className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
            >
              The Path to Today
            </h2>
          </motion.div>

          <div className="relative mx-auto max-w-3xl">
            {/* Vertical gold line */}
            <span
              aria-hidden
              className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-gradient-to-b from-brand-300 via-brand-500 to-brand-300"
            />

            <div className="space-y-10 md:space-y-14">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                const isLeft = index % 2 === 0;
                return (
                  <motion.div
                    key={milestone.title}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-0 ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Node */}
                    <div className="relative z-10 flex items-center justify-center md:w-1/2">
                      <div
                        className={`flex items-center ${
                          isLeft
                            ? "md:justify-end md:pr-14"
                            : "md:justify-start md:pl-14"
                        } w-full pl-14 md:pl-0`}
                      >
                        {/* mobile node */}
                        <span
                          aria-hidden
                          className="absolute left-6 md:hidden -translate-x-1/2 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-primary-foreground shadow-md shadow-brand-700/30 ring-4 ring-brand-100"
                        >
                          <Icon className="size-4" />
                        </span>

                        <div className="group w-full rounded-3xl border border-brand-100 bg-background p-6 hover:border-brand-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                              {milestone.year}
                            </span>
                            <h3 className="text-lg font-semibold text-foreground fw-heading">
                              {milestone.title}
                            </h3>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            {milestone.description}
                          </p>
                        </div>
                      </div>

                      {/* Desktop node */}
                      <span
                        aria-hidden
                        className="hidden md:flex absolute left-1/2 -translate-x-1/2 size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-primary-foreground shadow-lg shadow-brand-700/30 ring-4 ring-background"
                      >
                        <Icon className="size-5" />
                      </span>
                    </div>

                    <div className="hidden md:block md:w-1/2" aria-hidden />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Band ───────────────────────────────────────── */}
      <section className="section-container py-16 md:py-20">
        <motion.div
          {...fadeUp}
          className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            { value: "10+", label: "Years Experience" },
            { value: "100%", label: "Customization" },
            { value: "All India", label: "Delivery" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="relative rounded-3xl border border-brand-100 bg-background px-6 py-8 text-center hover:border-brand-300 hover:-translate-y-1 transition-all duration-300"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 hidden sm:block h-10 w-px -translate-y-1/2 bg-brand-200"
                />
              )}
              <div
                className={`${playfair.variable} [font-family:var(--font-playfair)] text-4xl font-semibold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent`}
              >
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── What Sets Us Apart ───────────────────────────────── */}
      <section className="bg-section-subtle py-16 md:py-20">
        <div className="section-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
              The Difference
            </p>
            <h2
              className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
            >
              What Sets Us Apart
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {differentiators.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                className="flex items-start gap-4 rounded-3xl border border-brand-100 bg-background p-6 hover:border-brand-300 hover:bg-brand-50/40 transition-colors duration-300"
              >
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-primary-foreground shadow-sm">
                  <Star className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground fw-heading">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Visit Us + Closing ───────────────────────────────── */}
      <section className="section-container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <div className="flex items-center justify-center gap-3 text-brand-600">
              <MapPin className="size-6" aria-hidden />
              <span className="font-semibold text-foreground">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-3 text-muted-foreground">{getFullAddress()}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              From our roots in Bhati Circle, Ratanada to serving customers
              across India — we&apos;re here to make your special moments
              sparkle.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            className="mt-10 rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 to-background p-8 md:p-10"
          >
            <p
              className={`${playfair.variable} [font-family:var(--font-playfair)] text-xl md:text-2xl italic leading-relaxed text-foreground`}
            >
              &ldquo;Built on friendship, driven by passion, and crafted with
              love — {siteConfig.name} is more than a business, it&apos;s our
              dream brought to life.&rdquo;
            </p>

            <Link href="/about" className="mt-8 inline-block" aria-label="Learn more about us">
              <Button variant="gradient" size="lg" className="rounded-full px-8">
                Learn About Us
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
