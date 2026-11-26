import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/comman/ProductCard";
import type { ProductData } from "@/types";

/**
 * "The Signature Edit" — a curated four-up product grid that adds another
 * shoppable moment between the bestseller rail and the promise band.
 */
export default function SignatureEdit({
  products,
}: {
  products: ProductData[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[var(--brand-section-bg)] py-16 lg:py-20">
      <div
        className="pointer-events-none absolute -right-24 top-10 size-[320px] rounded-full bg-[var(--brand-rose)]/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-10 top-0 h-full w-px bg-gradient-to-b from-transparent via-[var(--brand-gold)]/25 to-transparent"
        aria-hidden="true"
      />

      <div className="section-container relative z-10">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow">
            <span className="mr-2">✦</span>
            More to love
          </p>
          <h2 className="display-heading mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">
            The Signature <span className="accent-italic">Edit</span>
          </h2>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[var(--brand-ink)]/70 sm:text-sm">
            The pieces our stylists keep coming back to — layer them, stack
            them, or let one quietly do the talking.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-12 lg:grid-cols-5 lg:gap-5">
          {products.slice(0, 5).map((product, index) => (
            <ProductCard
              key={product._id}
              data={product}
              eager={index < 4}
            />
          ))}
        </div>

        <div className="mt-11 flex justify-center">
          <Link href="/category/new-arrivals" className="btn-gold !px-7 !py-3">
            Explore all jewellery
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
