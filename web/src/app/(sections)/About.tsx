"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  Users,
  Award,
  MapPin,
  Heart,
  ShoppingBag,
  Phone,
  Video,
  Gem,
} from "lucide-react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { siteConfig, getFullAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const founders = [
  { name: "Himanshu Prajapat", initials: "HP" },
  { name: "Arjun Goyal", initials: "AG" },
  { name: "Kuldeep Deora", initials: "KD" },
];

const values = [
  {
    icon: Phone,
    title: "WhatsApp Orders",
    description: "Easy ordering via WhatsApp chat",
  },
  {
    icon: Video,
    title: "Video Call Preview",
    description: "See before you buy via video call",
  },
  {
    icon: Gem,
    title: "Gold & Silver",
    description: "Authentic precious metals",
  },
  {
    icon: Sparkles,
    title: "Custom Designs",
    description: "Personalized to perfection",
  },
];

export default function About() {
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
        {/* Decorative glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-brand-accent-200/30 blur-3xl"
        />

        <div className="section-container relative py-16 md:py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs md:text-sm font-medium tracking-[0.35em] uppercase text-brand-600"
          >
            Est. 2024 · Jhalamand · Jodhpur
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${playfair.variable} [font-family:var(--font-playfair)] mt-4 text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight`}
          >
            The Art of{" "}
            <span className="italic bg-gradient-to-r from-brand-600 via-brand-500 to-brand-accent-500 bg-clip-text text-transparent">
              Adornment
            </span>
          </motion.h1>

          {/* Ornamental divider */}
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
            Where tradition meets craftsmanship — {siteConfig.name} brings you
            exquisite gold &amp; silver jewellery, crafted with heart and
            delivered with trust.
          </motion.p>
        </div>
      </section>

      {/* ── Story + Image Collage ────────────────────────────── */}
      <section className="section-container pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image collage */}
          <motion.div
            {...fadeUp}
            className="relative order-1 lg:order-none mx-auto w-full max-w-xl"
          >
            {/* Main image with gold ring frame */}
            <div className="relative rounded-[2rem] border border-brand-200/70 p-2.5 bg-gradient-to-br from-brand-50 to-background shadow-xl shadow-brand-900/10">
              <div className="overflow-hidden rounded-[1.6rem]">
                <img
                  src="/images/shop-image.jpg"
                  alt="Jewellery Walla store — traditional Indian jewellery"
                  className="w-full h-[22rem] md:h-[26rem] object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Floating poster card */}
            <div className="absolute -bottom-8 -left-4 md:-left-10 w-44 md:w-56 rounded-2xl border-4 border-background shadow-xl shadow-brand-900/15 overflow-hidden">
              <img
                src="/images/poster.webp"
                alt="Elegant jewellery display"
                className="w-full h-32 md:h-40 object-cover"
                loading="lazy"
              />
            </div>

            {/* Experience badge */}
            <div className="absolute -top-5 -right-3 md:-right-6 flex flex-col items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3 text-primary-foreground shadow-lg shadow-brand-700/30">
              <span className="text-2xl md:text-3xl font-bold leading-none fw-heading">
                10+
              </span>
              <span className="mt-1 text-[10px] md:text-xs uppercase tracking-wider opacity-90">
                Years of<br />Expertise
              </span>
            </div>
          </motion.div>

          {/* Narrative */}
          <motion.div {...fadeUp} className="order-2 lg:order-none">
            <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
              Our Story
            </p>
            <h2
              className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
            >
              Started by three friends,{" "}
              <span className="italic text-brand-600">built on trust</span>
            </h2>

            <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
              <p>
                In 2024,{" "}
                <span className="font-semibold text-foreground">
                  Himanshu Prajapat
                </span>
                ,{" "}
                <span className="font-semibold text-foreground">
                  Arjun Goyal
                </span>{" "}
                and{" "}
                <span className="font-semibold text-foreground">
                  Kuldeep Deora
                </span>{" "}
                came together with a shared belief — that buying jewellery
                should feel as beautiful as wearing it. What began as a simple
                idea is now {siteConfig.name}, your trusted destination for gold
                and silver jewellery in {siteConfig.address.city}.
              </p>
              <p>
                Located at Jhalamand Circle, Jodhpur, we blend traditional
                craftsmanship with modern convenience. Order via WhatsApp, or
                preview your jewellery over a video call before you decide —
                because transparency is our most precious metal.
              </p>
            </div>

            {/* Mini stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "10+", label: "Years Exp." },
                { value: "100%", label: "Customizable" },
                { value: "All India", label: "Delivery" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-brand-100 bg-background/70 px-4 py-4 text-center hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="text-xl md:text-2xl font-bold text-brand-600 fw-heading">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Values Grid ──────────────────────────────────────── */}
      <section className="bg-section-subtle py-16 md:py-20">
        <div className="section-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
              Why We&apos;re Different
            </p>
            <h2
              className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
            >
              The Jewellery Walla Promise
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group relative overflow-hidden rounded-3xl border border-brand-100 bg-background p-6 hover:border-brand-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 transition-all duration-300"
                >
                  {/* Top gold accent line */}
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-brand-200/60 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-primary-foreground transition-all duration-300">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground fw-heading">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Founders ──────────────────────────────────────────── */}
      <section className="section-container py-16 md:py-20">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
            The People Behind It All
          </p>
          <h2
            className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
          >
            Founded By
          </h2>
        </motion.div>

        <div className="mt-10 flex flex-wrap items-start justify-center gap-8 md:gap-14">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative">
                <div className="flex size-20 md:size-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-primary-foreground shadow-lg shadow-brand-700/30 ring-2 ring-brand-200">
                  <span
                    className={`${playfair.variable} [font-family:var(--font-playfair)] text-xl md:text-2xl font-semibold`}
                  >
                    {founder.initials}
                  </span>
                </div>
                {/* ornamental ring */}
                <span
                  aria-hidden
                  className="absolute -inset-2 rounded-full border border-dashed border-brand-300/70"
                />
              </div>
              <p className="mt-4 font-medium text-foreground">
                {founder.name}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                Co-Founder
              </p>
            </motion.div>
          ))}
        </div>

        {/* Story CTA */}
        <motion.div {...fadeUp} className="mt-14 text-center">
          <Link href="/story" aria-label="Read our full story">
            <Button variant="gradient" size="lg" className="rounded-full px-8">
              <Heart className="size-4" aria-hidden />
              Discover Our Story
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Location + Map ───────────────────────────────────── */}
      <section className="bg-section-subtle py-16 md:py-20">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <motion.div {...fadeUp} className="flex flex-col justify-center">
              <p className="text-xs md:text-sm font-medium tracking-[0.3em] uppercase text-brand-600">
                Visit Us
              </p>
              <h2
                className={`${playfair.variable} [font-family:var(--font-playfair)] mt-3 text-3xl md:text-4xl text-foreground`}
              >
                Find Us in {siteConfig.address.city}
              </h2>
              <div className="mt-6 space-y-3 text-muted-foreground">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden />
                  <span className="font-semibold text-foreground">
                    {siteConfig.name}
                    <br />
                    <span className="font-normal text-muted-foreground">
                      {getFullAddress()}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <Award className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden />
                  <span>
                    Walk in for a personal consultation — our craftsmen are
                    happy to guide you.
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <Users className="mt-1 size-5 shrink-0 text-brand-500" aria-hidden />
                  <span>Mon–Sun · 10:00 AM – 10:00 PM</span>
                </p>
              </div>

              <Link href="/" className="mt-8" aria-label="Continue shopping">
                <Button
                  variant="gradientOutline"
                  size="lg"
                  className="rounded-full px-8"
                >
                  <ShoppingBag className="size-4" aria-hidden />
                  Continue Shopping
                </Button>
              </Link>
            </motion.div>

            <motion.div
              {...fadeUp}
              className="rounded-[2rem] border border-brand-200/70 p-2.5 bg-gradient-to-br from-brand-50 to-background shadow-lg shadow-brand-900/10"
            >
              <div className="overflow-hidden rounded-[1.6rem]">
                <iframe
                  src={siteConfig.address.googleMapsEmbedUrl}
                  width="100%"
                  height="380"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full"
                  title="Jewellery Walla store location on Google Maps"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
