"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { openSidebar, toggleSidebar } from "@/redux/features/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Loader, LayoutGrid, List } from "lucide-react";
import type { RootState } from "@/redux/store/store";
import type { ProductData } from "@/types";

export default function ProductListing() {
  const searchParams = useParams() as { slug: string[] };
  const urlParmas = useSearchParams();
  const search = urlParmas.get("q");
  const categorySlug =
    searchParams.slug[0] === "shop-by-category" ? "" : searchParams.slug[0];
  const subCategorySlug = searchParams.slug[1];
  const subSubCategorySlug = searchParams.slug[2];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSort, setSelectedSort] = useState<string>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [gridLayout, setGridLayout] = useState("normal");

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const isOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const dispatch = useDispatch();
  const { category, color, material, priceFrom, priceTo, quickFilter } =
    useSelector((state: RootState) => state.filters);

  const PRODUCTS_PER_PAGE = 15;
  const MAX_PRODUCTS = 200;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 350);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!filteredProducts.length) return;

    const sorted = [...filteredProducts];
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
    setFilteredProducts(sorted);
  }, [selectedSort]);

  const fetchProducts = async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const requestBody = {
        categorySlug,
        subCategorySlug: category.length > 0 ? category : subCategorySlug,
        subSubCategorySlug: category.length > 0 ? "" : subSubCategorySlug,
        colorIds: color,
        materialIds: material,
        priceFrom,
        priceTo,
        page,
        limit: PRODUCTS_PER_PAGE,
        isFeatured: quickFilter === "featured" ? true : undefined,
        isNewArrival: quickFilter === "newArrival" ? true : undefined,
        isBestSeller: quickFilter === "bestSeller" ? true : undefined,
        isTopRated: quickFilter === "topRated" ? true : undefined,
        searchQuery : search
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/product/get-by-filter`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok || !data._status) {
        toast.error(data._message || "Something went wrong");
        setHasMore(false);
        return;
      }

      const newProducts: ProductData[] = data._data || [];

      if (append) {
        setFilteredProducts((prev) => {
          const combined = [...prev, ...newProducts];
          return combined.slice(0, MAX_PRODUCTS);
        });
      } else {
        setFilteredProducts(newProducts);
      }

      const total = data.totalCount || data.total || data._total;
      if (total) {
        setTotalProducts(total);
        const hasMoreProducts = page * PRODUCTS_PER_PAGE < total;
        setHasMore(hasMoreProducts);
      } else {
        const hasReachedMax =
          filteredProducts.length + newProducts.length >= MAX_PRODUCTS;
        const hasMoreProducts =
          !hasReachedMax && newProducts.length === PRODUCTS_PER_PAGE;
        setHasMore(hasMoreProducts);
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setFilteredProducts([]);
    fetchProducts(1, false);
  }, [
    categorySlug,
    subCategorySlug,
    subSubCategorySlug,
    color,
    material,
    priceFrom,
    priceTo,
    category,
    quickFilter,
    search
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        if (isVisible && hasMore && !loadingMore && !loading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, currentPage]);

  const toggle = () => {
    dispatch(openSidebar());
  };

  if (loading) {
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
          <h2 className="text-2xl font-serif text-[#8B4513]">All Products</h2>
          <p className="text-gray-500 text-sm">
            {totalProducts || filteredProducts?.length} product
            {(totalProducts || filteredProducts?.length) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 my-3 md:my-0">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setGridLayout("normal")}
              className={`p-2 transition-colors ${
                gridLayout === "normal"
                  ? "bg-amber-100 text-amber-700"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setGridLayout("single")}
              className={`p-2 transition-colors ${
                gridLayout === "single"
                  ? "bg-amber-100 text-amber-700"
                  : "hover:bg-gray-100 text-gray-500"
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

      {filteredProducts?.length > 0 ? (
        <div className="">
          <div
            className={`grid gap-2 sm:gap-3 md:gap-3 lg:gap-5 animate-fade-in duration-100 sm:px-0 ${
              gridLayout === "single"
                ? "grid-cols-1 max-w-md mx-auto"
                : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredProducts.map((p, index) => (
              <ProductCard data={p} key={`${p._id}-${index}`} {...p} />
            ))}
          </div>

          {hasMore && (
            <div
              ref={observerTarget}
              className="h-20 mt-8 flex items-center justify-center"
              style={{ border: "2px dashed #ccc", background: "#f9f9f9" }}
            >
              {loadingMore ? (
                <div className="text-center flex items-center justify-center gap-2">
                  <Loader className="animate-spin" size={20} />
                  <span className="text-sm text-gray-500">
                    Loading more products...
                  </span>
                </div>
              ) : hasMore ? (
                <span className="text-xs text-gray-400"></span>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No products found matching your filters.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
