"use client";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { RootState } from "@/redux/store/store";
import type { CategoryData } from "@/types";

const FALLBACKS = [
  "/images/products/silver-earrings.webp",
  "/images/products/pearl-necklace.webp",
  "/images/products/cuban-chain.webp",
  "/images/products/silver-bangle.webp",
  "/images/products/payal-anklet.webp",
  "/images/products/dori-waist-chain.webp",
];

/**
 * Light, editorial category rail — circular medallions with a double gold
 * ring, serif captions and a soft pink halo behind the section.
 */
export default function ShopByCategory() {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = ((navigation as { _data?: CategoryData[] })?._data ?? [])
    .filter((cat) => cat?.name && cat?.slug)
    .slice(0, 6);

  if (categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white py-11 lg:py-14">
      {/* soft pink halo + thin gold orbit */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[980px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(247,226,234,0.85),rgba(247,226,234,0)_78%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-10 hidden h-[380px] w-[1040px] -translate-x-1/2 rounded-[50%] border border-[var(--brand-gold)]/20 lg:block"
        aria-hidden="true"
      />

      <div className="section-container relative z-10">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow">
            <span className="mr-2">✦</span>
            Shop by category
          </p>
          <h2 className="display-heading mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">
            Find Your <span className="accent-italic">Everyday Forever</span>
          </h2>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[var(--brand-ink)]/70 sm:text-sm">
            From quiet everyday studs to pieces made for the biggest moments —
            explore the collections and find yours.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:mt-10 lg:grid-cols-6 lg:gap-x-6">
          {categories.map((cat, index) => (
            <Link
              key={cat._id ?? cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center"
            >
              <span className="relative block aspect-square w-full max-w-[164px] rounded-full bg-white p-[6px] shadow-[0_18px_40px_-34px_rgba(74,37,66,0.65)] ring-1 ring-[var(--brand-gold)]/35 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_46px_-30px_rgba(74,37,66,0.55)] group-hover:ring-[var(--brand-gold)]">
                <span
                  className="pointer-events-none absolute inset-[3px] rounded-full border border-dashed border-[var(--brand-rose)]"
                  aria-hidden="true"
                />
                <span className="relative block h-full w-full overflow-hidden rounded-full bg-[var(--brand-surface)]">
                  <Image
                    src={
                      cat.image ||
                      FALLBACKS[index % FALLBACKS.length] ||
                      "/images/products/silver-earrings.webp"
                    }
                    alt={cat.name || "Jewellery category"}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[var(--brand-plum)]/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute inset-x-0 bottom-4 flex justify-center text-[9px] uppercase tracking-[0.22em] text-[var(--brand-cream)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Explore
                  </span>
                </span>
              </span>

              <h3 className="display-heading mt-3 text-base sm:text-lg">
                {cat.name}
              </h3>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-[var(--brand-gold-dark)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Shop now
                <ArrowUpRight size={11} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/category/shop-by-category"
            className="inline-flex items-center gap-2 border-b border-[var(--brand-gold)]/50 pb-1 text-[10.5px] uppercase tracking-[0.22em] text-[var(--brand-plum)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)]"
          >
            View all collections
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
