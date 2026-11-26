"use client";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";

const FALLBACKS = [
  "/images/products/silver-earrings.webp",
  "/images/products/pearl-connector-chain.webp",
  "/images/products/silver-bracelet.webp",
];

/**
 * Editorial "about us" spread — serif copy on the left, an asymmetric
 * arch-and-pill collage on the right, drawn together with fine gold line art.
 */
export default function AboutStory() {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];

  const images = categories
    .flatMap((cat) => cat.subCategories ?? [])
    .map((sub: SubCategoryData) => sub.image)
    .filter((img): img is string => Boolean(img))
    .slice(0, 3);

  const collage = [0, 1, 2].map((i) => images[i] ?? FALLBACKS[i]);

  return (
    <section className="relative overflow-hidden bg-white py-14 lg:py-20">
      {/* fine gold editorial line work */}
      <svg
        viewBox="0 0 720 520"
        className="pointer-events-none absolute right-0 top-0 h-full w-[58%] text-[var(--brand-gold)]/35"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M60 470 C 190 320, 330 240, 700 120"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M300 520 C 380 380, 520 320, 720 300"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="610" cy="86" r="58" stroke="currentColor" strokeWidth="1" />
        <circle cx="352" cy="316" r="4" fill="currentColor" />
      </svg>

      <div className="section-container relative z-10 grid items-center gap-14 lg:grid-cols-[1fr_1.02fr] lg:gap-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-5">
            <span className="mr-2">✦</span>
            The story behind the sparkle
          </p>

          <h2 className="display-heading text-[2.25rem] leading-[1.06] sm:text-5xl lg:text-[3.6rem]">
            More Than Jewellery.
            <br />
            <span className="accent-italic">A Legacy of Elegance.</span>
          </h2>

          <p className="mt-7 max-w-lg text-[14px] leading-[1.9] text-[var(--brand-ink)]/65 sm:text-[15px]">
            We believe every piece holds a story. From meaningful celebrations
            to everyday moments, our jewellery is chosen to make life&apos;s
            most beautiful memories even more special. With an eye for timeless
            beauty and a passion for fine craft, we bring you designs that
            celebrate your individuality.
          </p>

          <div className="mt-9 flex items-center gap-6">
            <Link href="/story" className="btn-gold !px-7 !py-3.5">
              Discover Our Story
              <ArrowRight size={15} />
            </Link>
            <span className="hidden h-px w-16 bg-[var(--brand-gold)]/50 sm:block" />
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 divide-x divide-[var(--brand-gold)]/20">
            {[
              ["925", "Sterling silver"],
              ["100%", "Hand finished"],
              ["15 days", "Easy returns"],
            ].map(([value, label]) => (
              <div key={label} className="px-4 first:pl-0 last:pr-0">
                <p className="display-heading text-xl text-[var(--brand-plum)]">
                  {value}
                </p>
                <p className="mt-1 text-[9.5px] uppercase tracking-[0.16em] text-[var(--brand-ink)]/65">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Arch + pill crops, echoing the reference's soft editorial shapes */}
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="grid grid-cols-5 gap-4 sm:gap-5">
            <div className="relative col-span-3 row-span-2 h-[360px] overflow-hidden rounded-t-[10rem] rounded-b-xl bg-[var(--brand-rose)] shadow-[0_26px_60px_-42px_rgba(74,37,66,0.65)] sm:h-[440px] sm:rounded-t-[13rem]">
              <Image
                src={collage[0]}
                alt="Jewellery editorial"
                fill
                sizes="(max-width: 1024px) 55vw, 27vw"
                className="object-cover"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-4 sm:gap-5">
              <div className="relative h-[150px] overflow-hidden rounded-full ring-1 ring-[var(--brand-gold)]/30 sm:h-[168px]">
                <Image
                  src={collage[1]}
                  alt="Jewellery close-up"
                  fill
                  sizes="(max-width: 1024px) 36vw, 18vw"
                  className="object-cover"
                />
              </div>
              <div className="relative h-[194px] overflow-hidden rounded-xl ring-1 ring-[var(--brand-gold)]/30 sm:h-[252px]">
                <Image
                  src={collage[2]}
                  alt="Jewellery styling"
                  fill
                  sizes="(max-width: 1024px) 36vw, 18vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 left-[6%] flex items-center gap-3 rounded-full border border-[var(--brand-gold)]/35 bg-white/95 px-5 py-3 shadow-[0_18px_36px_-26px_rgba(74,37,66,0.55)] backdrop-blur-sm">
            <span className="grid size-8 place-items-center rounded-full bg-[var(--brand-section-bg)] text-[var(--brand-gold-dark)]">
              ✦
            </span>
            <span className="text-[9.5px] uppercase leading-tight tracking-[0.18em] text-[var(--brand-ink)]/70">
              Crafted with
              <br />
              <span className="text-[var(--brand-plum)]">quiet luxury</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
