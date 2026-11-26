"use client";
import { setPriceRange } from "@/redux/features/filters";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData } from "@/types";
import { getCategoryHref } from "@/lib/category-nav";

const PRICE_BANDS = [
  { label: "999", priceFrom: 0, priceTo: 999 },
  { label: "1,999", priceFrom: 1000, priceTo: 1999 },
  { label: "2,999", priceFrom: 2000, priceTo: 2999 },
  { label: "5,000", priceFrom: 3000, priceTo: 100000 },
];

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const dispatch = useDispatch();
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const categoryHref = getCategoryHref(categories);

  return (
    <section className="w-full overflow-hidden bg-white py-14 lg:py-20">
      <div className="section-container">
        <div className="mb-10 text-center lg:mb-14">
          <p className="eyebrow mb-4">
            <span className="mr-2">✦</span>
            Shop by price
          </p>
          <h2 className="display-heading text-3xl sm:text-4xl lg:text-[2.75rem]">
            {heading ? (
              heading
            ) : (
              <>
                A little luxury,{" "}
                <span className="accent-italic">at every price.</span>
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {PRICE_BANDS.map((item, index) => {
            // Second card is the featured one — the reference's deep rose panel.
            const featured = index === 1;

            return (
              <div
                key={item.label}
                className={`price-card group ${featured ? "price-card-featured" : ""}`}
              >
                <div className="price-spine" aria-hidden="true" />

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-[0.3em] ${
                      featured ? "text-white/70" : "text-[var(--brand-mauve)]"
                    }`}
                  >
                    Under
                  </p>
                  <p
                    className={`display-heading mt-2 text-3xl sm:text-[2.1rem] ${
                      featured ? "text-white" : "text-[var(--brand-ink)]"
                    }`}
                  >
                    ₹{item.label}
                  </p>
                </div>

                <Link
                  href={categoryHref}
                  onClick={() =>
                    dispatch(
                      setPriceRange({
                        priceFrom: item.priceFrom,
                        priceTo: item.priceTo,
                      }),
                    )
                  }
                  className={`mt-8 inline-flex items-center gap-2 text-[13px] transition-colors ${
                    featured
                      ? "text-white/90 hover:text-white"
                      : "text-[var(--brand-ink)]/75 hover:text-[var(--brand-plum)]"
                  }`}
                >
                  Shop collection
                  <span
                    className={`grid size-6 place-items-center rounded-full border ${
                      featured
                        ? "border-white/50"
                        : "border-[var(--brand-gold)]/60 text-[var(--brand-gold-dark)]"
                    }`}
                  >
                    <ArrowRight size={11} />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByPrice;
