"use client";
import { PlaceholdersAndVanishInput } from "../ui/placeholders-and-vanish-input";
import { motion, type Variants } from "motion/react";
import Link from "next/link";
import {
  useState,
  useEffect,
  type FormEvent,
} from "react";
import {
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import {  useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { usePathname, useRouter } from "next/navigation";
import { useSearchSuggestions, type SuggestionData } from "@/lib/useSearchSuggestions";


interface SearchBarProps {
  className?: string;
  inputId?: string;
  formClassName?: string;
}

export const SearchBar = ({ className, inputId, formClassName }: SearchBarProps) => {
  const value = useSelector((state: RootState) => state.ui.searchValue);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // React Query — search suggestions with debounced query key + 5min cache
  const { data: suggestions, isFetching } = useSearchSuggestions(value);

  // Open/close the suggestions dropdown based on query state
  useEffect(() => {
    if (value.trim().length <= 1) {
      setIsSuggestionsOpen(false);
      return;
    }
    // Show spinner immediately while fetching
    if (isFetching) {
      setIsSuggestionsOpen(true);
      return;
    }
    // Show when results arrive
    if (suggestions) {
      if (
        suggestions.suggestions.length > 0 ||
        suggestions.products.length > 0
      ) {
        setIsSuggestionsOpen(true);
      } else {
        setIsSuggestionsOpen(false);
      }
    }
  }, [suggestions, value, isFetching]);

  // Close suggestions when route changes
  useEffect(() => {
    setIsSuggestionsOpen(false);
  }, [pathname]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formElements = form.elements as HTMLFormControlsCollection & {
      search: HTMLInputElement;
    };
    const searchValue = formElements.search.value;
    router.push(`/category/shop-by-category?q=${searchValue}`);
  };
  const suggestionVariants: Variants = {
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={`relative ${className}`}>
      <PlaceholdersAndVanishInput
        placeholders={[
          "Search for silver chains",
          "Pearl necklaces",
          "Everyday silver earrings",
          "Gifts under ₹1,000",
        ]}
        onSubmit={handleSubmit}
        inputId={inputId}
        formClassName={formClassName}
      />
      <Search
        size={18}
        strokeWidth={1.6}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 z-[60] hidden -translate-y-1/2 text-[var(--brand-gold-dark)] sm:block"
      />

      {isSuggestionsOpen && (
        <motion.div
          initial="closed"
          animate={isSuggestionsOpen ? "open" : "closed"}
          variants={suggestionVariants}
          className="no-scrollbar absolute left-0 right-0 top-full z-[200] mt-2 h-auto w-[86%] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-white shadow-[0_24px_60px_-30px_rgba(75,49,71,0.45)] md:w-full"
        >
          {/* Loading state */}
          {isFetching && (
            <div className="p-6 flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold-dark)]" />
              <span className="text-[11.5px] text-[var(--brand-ink)]/50">
                Searching...
              </span>
            </div>
          )}

          {!isFetching && (
            <div className="grid grid-cols-[32%_auto] divide-x divide-[var(--brand-gold)]/20">
              {/* Suggestions Column */}
              {(suggestions?.suggestions?.length ?? 0) > 0 ||
              (suggestions?.products?.length ?? 0) > 0 ? (
                <>
                  <div className="p-4">
                    <h3 className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-[var(--brand-ink)]/40">
                      <span>Suggestions</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestions?.suggestions?.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full rounded-md p-2 text-left text-[12.5px] text-[var(--brand-ink)]/75 transition-colors hover:bg-[var(--brand-cream)] hover:text-[var(--brand-ink)]"
                          onClick={() =>
                            router.push(
                              `/category/shop-by-category?q=${suggestion}`,
                            )
                          }
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Column */}
                  <div className="p-4">
                    <h3 className="mb-2 flex items-center justify-between text-[9.5px] uppercase tracking-[0.2em] text-[var(--brand-ink)]/40">
                      <span>Products</span>
                      <span
                        onClick={() => setIsSuggestionsOpen(false)}
                        className="cursor-pointer"
                      >
                        <X size={20} />
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-auto no-scrollbar">
                      {suggestions?.products?.map((product) => (
                        <Link
                          onClick={() => setIsSuggestionsOpen(false)}
                          key={product._id}
                          href={`/product-details/${product.slug}`}
                          className="group flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-[var(--brand-cream)]"
                        >
                          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="line-clamp-2 text-[12px] text-[var(--brand-ink)]/80">
                            {product.name}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--brand-plum)]">
                            ₹{product.discount_price || product.price}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 p-4 text-center text-[var(--brand-ink)]/45">
                  <h3 className="mb-2 flex items-center justify-between text-[9.5px] uppercase tracking-[0.2em]">
                    <span>No suggestions found</span>
                    <span
                      onClick={() => setIsSuggestionsOpen(false)}
                      className="cursor-pointer"
                    >
                      <X size={20} />
                    </span>
                  </h3>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
