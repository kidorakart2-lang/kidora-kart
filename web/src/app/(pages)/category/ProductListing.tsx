"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProductCard from "@/components/comman/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { openSidebar } from "@/redux/features/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import { Loader, LayoutGrid, List } from "lucide-react";
import type { RootState } from "@/redux/store/store";
import type { ProductData } from "@/types";
import { useProductListing } from "@/lib/useProductListing";

export default function ProductListing() {
  const searchParams = useParams() as { slug: string[] };
  const urlParmas = useSearchParams();
  const search = urlParmas.get("q");
  const categorySlug =
    searchParams.slug[0] === "shop-by-category" ? "" : searchParams.slug[0];
  const subCategorySlug = searchParams.slug[1];
  const subSubCategorySlug = searchParams.slug[2];

  const [selectedSort, setSelectedSort] = useState<string>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [gridLayout, setGridLayout] = useState("normal");

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const isOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const dispatch = useDispatch();
  const { category, color, material, priceFrom, priceTo, ageFrom, ageTo, quickFilter } =
    useSelector((state: RootState) => state.filters);

  // ── Filter params (memoized to avoid stale closures) ────────────────
  const filterParams = useMemo(() => ({
    categorySlug,
    subCategorySlug: category.length > 0 ? category : (subCategorySlug ?? ""),
    subSubCategorySlug: category.length > 0 ? "" : (subSubCategorySlug ?? ""),
    colorIds: color,
    materialIds: material,
    priceFrom,
    priceTo,
    ageFrom,
    ageTo,
    quickFilter,
    searchQuery: search,
  }), [categorySlug, subCategorySlug, subSubCategorySlug, color, material, priceFrom, priceTo, ageFrom, ageTo, category, quickFilter, search]);

  // ── React Query infinite scroll ────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useProductListing(filterParams);

  // Flatten all pages into one array
  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.products);
  }, [data]);

  const totalProducts = useMemo(() => {
    return data?.pages?.[0]?.totalCount ?? allProducts.length;
  }, [data, allProducts.length]);

  // ── Sort (client-side) ─────────────────────────────────────────────
  const sortedProducts = useMemo(() => {
    if (!allProducts.length) return [];
    const sorted = [...allProducts];
    if (selectedSort === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
    } else if (selectedSort === "low") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (selectedSort === "high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (selectedSort === "atoz") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === "ztoa") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    }
    return sorted;
  }, [allProducts, selectedSort]);

  // ── Scroll effect ──────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 350);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Infinite scroll observer ───────────────────────────────────────
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const toggle = () => {
    dispatch(openSidebar());
  };

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive text-lg mb-2">Failed to load products</p>
        <p className="text-muted-foreground text-sm">Please try adjusting your filters or refresh the page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center flex items-center justify-center py-16">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="lg:flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
        <div>
          <h2 className="text-2xl font-serif text-brand-800">All Products</h2>
          <p className="text-muted-foreground text-sm">
            {totalProducts || sortedProducts.length} product
            {(totalProducts || sortedProducts.length) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 my-3 md:my-0">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setGridLayout("normal")}
              className={`p-2 transition-colors ${
                gridLayout === "normal"
                  ? "bg-brand-100 text-brand-700"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setGridLayout("single")}
              className={`p-2 transition-colors ${
                gridLayout === "single"
                  ? "bg-brand-100 text-brand-700"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className={`flex items-center gap-3`}>
          <Button
            variant="outline"
            className={`lg:hidden ${
              isScrolled && !isOpen
                ? "block animate-slide-in fixed top-[12%] z-[500] left-[10px]"
                : "hidden animate-slide-out"
            }`}
            onClick={toggle}
          >
            Filter
          </Button>
          <Button
            variant="outline"
            className={`block lg:hidden`}
            onClick={toggle}
          >
            Filter
          </Button>
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="low">Price: Low → High</SelectItem>
              <SelectItem value="high">Price: High → Low</SelectItem>
              <SelectItem value="atoz">A to Z</SelectItem>
              <SelectItem value="ztoa">Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedProducts.length > 0 ? (
        <div className="">
          <div
            className={`grid gap-2 sm:gap-3 md:gap-3 lg:gap-5 animate-fade-in duration-100 sm:px-0 ${
              gridLayout === "single"
                ? "grid-cols-1 max-w-md mx-auto"
                : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {sortedProducts.map((p, index) => (
              <ProductCard data={p} key={`${p._id}-${index}`} {...p} />
            ))}
          </div>

          {(hasNextPage || isFetchingNextPage) && (
            <div
              ref={observerTarget}
              className="h-20 mt-8 flex items-center justify-center border-2 border-dashed border-border bg-muted"
            >
              {isFetchingNextPage ? (
                <div className="text-center flex items-center justify-center gap-2">
                  <Loader className="animate-spin" size={20} />
                  <span className="text-sm text-muted-foreground">
                    Loading more products...
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground"></span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No products found matching your filters.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Try adjusting your filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
