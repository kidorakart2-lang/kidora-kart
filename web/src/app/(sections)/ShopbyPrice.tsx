"use client";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData } from "@/types";
import { getCategoryHref } from "@/lib/category-nav";

// Tier colors progress from "affordable" to "premium" — the color
// itself encodes where a band sits in the price range, same as the
// dot meter below it.
const TIER_TOKENS = [
  { icon: "var(--brand-card-3-icon)", soft: "var(--brand-card-3-bg)" }, // value — green
  { icon: "var(--brand-card-5-icon)", soft: "var(--brand-card-5-bg)" }, // popular — sky
  { icon: "var(--brand-card-1-icon)", soft: "var(--brand-card-1-bg)" }, // favourites — gold
  { icon: "var(--brand-card-4-icon)", soft: "var(--brand-card-4-bg)" }, // ultimate — plum
] as const;

// Alternating string lengths + tilt so the tags read as hand-hung,
// not a rigid grid — echoes the tilt language from Why Choose Us
// but via a different mechanism (hanging vs. resting).
const STRING_LENGTH = ["h-6", "h-10", "h-8", "h-5"];
const TILTS = [
  "motion-safe:-rotate-2",
  "motion-safe:rotate-1",
  "motion-safe:-rotate-1",
  "motion-safe:rotate-2",
];

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const dispatch = useDispatch();
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const categoryHref = getCategoryHref(categories);

  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Value Picks",
      priceFrom: 0,
      priceTo: 599,
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Popular Picks",
      priceFrom: 600,
      priceTo: 999,
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Top Favourites",
      priceFrom: 1000,
      priceTo: 1999,
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Ultimate Fun",
      priceFrom: 2000,
      priceTo: 100000,
    },
  ];

  return (
    <div className="w-full bg-section py-6 md:py-10 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl fw-heading mb-3 tracking-wide text-foreground">
            {heading || "Shop by Price"}
          </h2>
          <p className="text-muted-foreground mt-4 fw-body tracking-widest text-sm">
            Find the Perfect Toy for Every Age
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
          {priceCategories.map((item, index) => {
            const Icon = item.icon;
            const tier = TIER_TOKENS[index % TIER_TOKENS.length];

            return (
              <div
                key={index}
                className={`group relative flex flex-col items-center ${TILTS[index]} transition-transform duration-300 ease-out motion-safe:hover:rotate-0 motion-safe:hover:-translate-y-1`}
              >
                {/* string + punched hole the tag hangs from */}
                <div className="flex flex-col items-center">
                  <span
                    className={`w-px border-l-2 border-dashed ${STRING_LENGTH[index]} opacity-70`}
                    style={{ borderColor: tier.icon }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-3 w-3 rounded-full border-2 bg-section"
                    style={{ borderColor: tier.icon }}
                    aria-hidden="true"
                  />
                </div>

                {/* the tag itself */}
                <div
                  className="relative -mt-1.5 w-full rounded-2xl rounded-tl-sm border-2 bg-card p-5 md:p-6 flex flex-col items-center text-center min-h-[188px] transition-shadow duration-300"
                  style={{
                    borderColor: tier.soft,
                    boxShadow: `0 8px 0 0 ${tier.icon}`,
                  }}
                >
                  <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: tier.soft }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: tier.icon }}
                      strokeWidth={2}
                    />
                  </div>

                  <p className="text-[11px] fw-body text-muted-foreground mb-1 tracking-wider uppercase">
                    {item.sublabel}
                  </p>
                  <p className="text-base md:text-lg font-semibold text-foreground mb-2">
                    {item.label}
                  </p>

                  {/* tier meter — position within the price range */}
                  <div
                    className="flex items-center gap-1 mb-4"
                    aria-hidden="true"
                  >
                    {TIER_TOKENS.map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className="h-1.5 w-1.5 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            dotIndex <= index ? tier.icon : "var(--muted)",
                        }}
                      />
                    ))}
                  </div>

                  <Link href={categoryHref} className="mt-auto">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          setPriceRange({
                            priceFrom: item.priceFrom,
                            priceTo: item.priceTo,
                          }),
                        )
                      }
                      className="group/btn inline-flex items-center gap-1.5 rounded-full px-6 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      style={{
                        backgroundColor: tier.icon,
                        // @ts-expect-error -- CSS custom property for focus ring color
                        "--tw-ring-color": tier.icon,
                      }}
                    >
                      Shop Now
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShopByPrice;
