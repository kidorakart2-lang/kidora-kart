import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Closing call-to-action band — near-black panel with the ornamental lace
 * across the top and a serif headline split over two lines.
 */
export default function ClosingCta() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#14100f] px-6 pb-14 pt-16 text-center sm:px-10 lg:pb-16">
        <div className="ornament-band absolute inset-x-0 top-0" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_0%,rgba(62,39,57,0.6),transparent_72%)]" />

        <div className="relative z-10">
          <p className="eyebrow mb-5">
            <span className="mr-2">✦</span>
            Your next treasure awaits
          </p>

          <h2 className="display-heading text-3xl leading-tight text-[var(--brand-cream)] sm:text-4xl lg:text-5xl">
            Find Something
            <br />
            <span className="accent-italic">Worth Treasuring.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[var(--brand-cream)]/65">
            Discover jewellery that celebrates your style, tells your story, and
            stays with you through life&apos;s most beautiful moments.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/category" className="btn-gold">
              Explore Collections
              <ArrowRight size={15} />
            </Link>
            <Link href="/contact-us" className="btn-ghost-gold">
              Contact Us
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
