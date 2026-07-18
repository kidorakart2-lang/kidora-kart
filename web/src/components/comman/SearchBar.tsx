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
}

export const SearchBar = ({ className, inputId }: SearchBarProps) => {
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
          "Search for Toys",
          "Buy Educational Toys",
          "Search for action figures",
          "Find Gift Items",
        ]}
        onSubmit={handleSubmit}
        inputId={inputId}
      />
      <Search
        size={20}
        className="hidden md:block absolute left-9 top-1/2 -translate-y-1/2 text-[var(--brand-primary-dark)] pointer-events-none"
      />

      {isSuggestionsOpen && (
        <motion.div
          initial="closed"
          animate={isSuggestionsOpen ? "open" : "closed"}
          variants={suggestionVariants}
          className="absolute top-full left-0 right-0 h-auto w-[78%] md:w-full mt-1 bg-background rounded-lg shadow-lg z-[200] border border-border overflow-x-hidden overflow-y-auto no-scrollbar"
        >
          {/* Loading state */}
          {isFetching && (
            <div className="p-6 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {!isFetching && (
            <div className="grid grid-cols-[30%_auto] divide-x divide-border">
              {/* Suggestions Column */}
              {(suggestions?.suggestions?.length ?? 0) > 0 ||
              (suggestions?.products?.length ?? 0) > 0 ? (
                <>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 ">
                      <span>Suggestions</span>
                    </h3>
                    <div className="space-y-2">
                      {suggestions?.suggestions?.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors text-sm"
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
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
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
                          className="group flex flex-col items-center p-3 hover:bg-muted rounded-lg transition-colors"
                        >
                          <div className="relative w-full aspect-square mb-2 bg-muted rounded-md overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-sm font-medium  line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-[var(--brand-primary-dark)] font-medium mt-1">
                            ₹{product.discount_price || product.price}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 col-span-2 text-center text-muted-foreground">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
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
