"use client";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Award,
  Shield,
  Truck,
  Heart,
  IndianRupee,
  Mail,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useEffect, useState } from "react";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "../icons";
import { siteConfig, getFullAddress } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface FeaturedProduct {
  _id: string;
  slug: string;
  image: string;
  name: string;
  discount_price: string | number;
}

interface NavSubCategory {
  slug: string;
  name: string;
}

interface NavCategory {
  slug: string;
  name?: string;
  subCategories?: NavSubCategory[];
}

/* ── Data ───────────────────────────────────────────────────────────────── */

const FEATURES = [
  { Icon: Truck, title: "Free Shipping", desc: "On orders over ₹1000" },
  { Icon: Shield, title: "Secure Payment", desc: "100% Protected" },
  { Icon: Award, title: "Certified Quality", desc: "Hallmarked & Tested" },
  { Icon: Heart, title: "Lifetime Support", desc: "24/7 Customer Care" },
];

const HELP_LINKS = [
  { label: "Track Order", href: "/order-track" },
  { label: "Our Story", href: "/story" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Size Guide", href: "/our-policy?query=size-guide" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/our-policy" },
  { label: "Terms of Service", href: "/our-policy?query=terms" },
  { label: "Refund Policy", href: "/our-policy?query=refund" },
  { label: "Shipping Policy", href: "/our-policy?query=shipping" },
  { label: "Warranty", href: "/our-policy?query=warranty" },
];

/* ── Component ──────────────────────────────────────────────────────────── */

export default function Footer({
  featuredProducts: _featuredProducts,
}: {
  featuredProducts?: any[];
}) {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(
    _featuredProducts ?? [],
  );

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch(
        "/api/website/product/featured-for-footer",
      );
      const data = await res.json();
      setFeaturedProducts(data._data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!_featuredProducts || _featuredProducts.length === 0) {
      fetchFeaturedProducts();
    }
  }, [_featuredProducts]);

  const categories = useSelector(
    (state: RootState) =>
      state?.ui?.navigation?._data as NavCategory[] | undefined,
  );

  const logo = useSelector((state: RootState) => state.logo.logo);

  return (
    <footer className="bg-section text-muted-foreground border-t border-border">
      {/* ── Features Bar ──────────────────────────────────────────────── */}
      <div className="border-b border-border bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background/60 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary-light)] to-[var(--brand-gradient-from)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--brand-primary-foreground)]" />
                </div>
                <div className="min-w-0">
                  <p className="fw-heading text-sm text-foreground truncate">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Brand & Social — 2 cols */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="relative group inline-block mb-4">
              <Image
                src={logo || "/images/logo.webp"}
                alt={siteConfig.name}
                width={120}
                height={40}
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Discover timeless elegance with our handcrafted collection of
              jewellery. Shop with confidence — every order is backed by our
              quality promise.
            </p>

            {/* Social */}
            <div className="flex gap-2">
              {[
                {
                  Icon: InstagramIcon,
                  label: "Instagram",
                  href: siteConfig.social.instagram,
                },
                {
                  Icon: FacebookIcon,
                  label: "Facebook",
                  href: siteConfig.social.facebook,
                },
                {
                  Icon: WhatsAppIcon,
                  label: "WhatsApp",
                  href: `https://wa.me/${siteConfig.contact.whatsapp}`,
                },
              ].map(({ Icon, label, href }) => (
                <Button
                  key={label}
                  asChild
                  variant="outline"
                  size="icon"
                  className="border-border hover:bg-gradient-to-r hover:from-[var(--brand-gradient-from)] hover:to-[var(--brand-gradient-to)] hover:text-[var(--brand-primary-foreground)] hover:border-[var(--brand-primary-foreground)] transition-all duration-200"
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Shop — subcategories */}
          <div className="sm:col-span-1 lg:col-span-1">
            <h3 className="fw-heading text-sm text-foreground uppercase tracking-widest mb-4 border-b-2 border-[var(--brand-primary)] pb-2 inline-block">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories
                ?.flatMap((item: NavCategory) => item.subCategories ?? [])
                .slice(0, 10)
                .map((subCategory: NavSubCategory, idx: number) => (
                  <li key={subCategory.slug ?? idx}>
                    <Link
                      href={`/category/${subCategory.slug}`}
                      className="text-muted-foreground hover:text-[var(--brand-primary-dark)] hover:translate-x-1 inline-block transition-all duration-200"
                    >
                      {subCategory.name}
                    </Link>
                  </li>
                ))}
              {(!categories || categories.length === 0) && (
                <li className="text-xs text-muted-foreground">
                  Categories loading...
                </li>
              )}
            </ul>
          </div>

          {/* Help */}
          <div className="sm:col-span-1 lg:col-span-1">
            <h3 className="fw-heading text-sm text-foreground uppercase tracking-widest mb-4 border-b-2 border-[var(--brand-primary)] pb-2 inline-block">
              Help
            </h3>
            <ul className="space-y-2.5 text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-[var(--brand-primary-dark)] hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="sm:col-span-1 lg:col-span-1">
            <h3 className="fw-heading text-sm text-foreground uppercase tracking-widest mb-4 border-b-2 border-[var(--brand-primary)] pb-2 inline-block">
              Policies
            </h3>
            <ul className="space-y-2.5 text-sm">
              {POLICY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-[var(--brand-primary-dark)] hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Featured */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="fw-heading text-sm text-foreground uppercase tracking-widest mb-4 border-b-2 border-[var(--brand-primary)] pb-2 inline-block">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--brand-primary-dark)]" />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="hover:text-[var(--brand-primary-dark)] transition-colors"
                >
                  {siteConfig.contact.mobile}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--brand-primary-dark)]" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-[var(--brand-primary-dark)] transition-colors break-all"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--brand-primary-dark)]" />
                <a
                  href={siteConfig.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed hover:text-[var(--brand-primary-dark)] transition-colors"
                >
                  {getFullAddress()}
                </a>
              </li>
            </ul>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <div className="space-y-3">
                <h4 className="fw-heading text-sm text-foreground mb-3 uppercase tracking-wider">
                  Featured Products
                </h4>
                {featuredProducts.map((product: FeaturedProduct) => (
                  <Link
                    key={product._id}
                    href={`/product-details/${product.slug}`}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-[var(--brand-primary)] hover:shadow-md transition-all duration-200 group bg-background/40"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="fw-body text-sm text-foreground truncate group-hover:text-[var(--brand-primary-dark)] transition-colors">
                        {product.name}
                      </h5>
                      <p className="text-sm fw-body text-[var(--brand-primary-dark)] flex items-center">
                        <IndianRupee size={12} /> {product.discount_price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Copyright Bar ─────────────────────────────────────────────── */}
      <div className="border-t border-border bg-section-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </p>
            <p>
              Made by{" "}
              <a
                href="https://my-portfolio-nine-eta-bo1n0vx4mt.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Gaurav Dadhich
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
