"use client";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { IndianRupee, X, Flame, Star, Trophy } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import {
  toggleCategory,
  toggleColor,
  toggleMaterial,
  setPriceRange,
  resetFilters,
  setQuickFilter,
} from "@/redux/features/filters";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { closeSidebar } from "@/redux/features/uiSlice";
import { usePathname } from "next/navigation";
import type { RootState } from "@/redux/store/store";

interface ColorItem {
  _id: string;
  name: string;
  code: string;
}

interface MaterialItem {
  _id: string;
  name: string;
}

interface FilterSidebarProps {
  color: ColorItem[];
  material: MaterialItem[];
}

export default function FilterSidebar({ color, material }: FilterSidebarProps) {
  const dispatch = useDispatch();
  const pathName = usePathname();
  const filters = useSelector((state: RootState) => state.filters);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realData = useSelector((state: RootState) => state.ui.navigation._data);
  const subCategory =
    realData?.find((v) => (v.subCategories?.length ?? 0) > 0)?.subCategories || [];

  const isOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const onClose = () => {
    dispatch(closeSidebar());
  };

  // Local state for price slider
  const [localPrice, setLocalPrice] = useState({
    priceFrom: filters.priceFrom || 0,
    priceTo: filters.priceTo || 100000,
  });

  const handleCheckboxChange = (type: string, value: string) => {
    if (type === "category") {
      dispatch(toggleCategory(value));
    } else if (type === "color") {
      dispatch(toggleColor(value));
    } else if (type === "material") {
      dispatch(toggleMaterial(value));
    }
  };

  const handlePriceChange = (value: number[]) => {
    setLocalPrice({ priceFrom: value[0], priceTo: value[1] });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      dispatch(
        setPriceRange({
          priceFrom: value[0],
          priceTo: value[1],
        })
      );
    }, 500);
  };

  const applyPriceFilter = () => {
    dispatch(
      setPriceRange({
        priceFrom: localPrice.priceFrom,
        priceTo: localPrice.priceTo,
      })
    );
  };

  const clearFilters = () => {
    dispatch(resetFilters());
    setLocalPrice({ priceFrom: 0, priceTo: 100000 });
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  //
  useEffect(() => {
    clearFilters();
  }, [pathName]);

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #fef3c7, #fde68a);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #d97706, #f59e0b, #fbbf24);
          border-radius: 10px;
          border: 2px solid #fef3c7;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #b45309, #d97706, #f59e0b);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f59e0b #fef3c7;
        }
      `}</style>

      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[1500] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-white shadow-xl lg:shadow-none
          flex flex-col h-full border border-gray-200
          transition-transform duration-300 ease-in-out md:rounded-2xl
          ${
            isOpen
              ? "translate-x-0 z-[1501]"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="border-b p-4 ">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-900">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-amber-100"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-amber-700" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Quick Filters */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-amber-900">
              Quick Filters
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "bestSeller", label: "Best Sellers", icon: Flame },
                { key: "featured", label: "Featured", icon: Star },
                // { key: "newArrival", label: "New Arrivals", icon: Sparkles },
                { key: "topRated", label: "Top Rated", icon: Trophy },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => dispatch(setQuickFilter(item.key))}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
                    filters.quickFilter === item.key
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300"
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-amber-900">
              Category
            </Label>
            <div className="space-y-2">
              {subCategory &&
                subCategory.length > 0 &&
                subCategory.map((category) => (
                  <Label
                    key={category.slug}
                    className="flex items-center space-x-2 cursor-pointer hover:text-amber-600 transition-colors duration-200"
                  >
                    <Input
                      type="checkbox"
                      checked={filters.category.includes(category.slug)}
                      onChange={() =>
                        handleCheckboxChange("category", category.slug)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    />
                    <span className="text-sm">{category.name}</span>
                  </Label>
                ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-amber-900">
              Color
            </Label>
            <div className="space-y-2">
              {color.map((colorDetail) => (
                <Label
                  key={colorDetail._id}
                  className="flex items-center space-x-2 cursor-pointer hover:text-amber-600 transition-colors duration-200"
                >
                  <Input
                    type="checkbox"
                    checked={filters.color.includes(colorDetail._id)}
                    onChange={() =>
                      handleCheckboxChange("color", colorDetail._id)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                  />
                  <span
                    style={{ backgroundColor: colorDetail.code }}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                  ></span>
                  <span className="text-sm">{colorDetail.name}</span>
                </Label>
              ))}
            </div>
          </div>

          {/* Material Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-amber-900">
              Material
            </Label>
            <div className="space-y-2">
              {material.map((materialDetail) => (
                <Label
                  key={materialDetail._id}
                  className="flex items-center space-x-2 cursor-pointer hover:text-amber-600 transition-colors duration-200"
                >
                  <Input
                    type="checkbox"
                    checked={filters.material.includes(materialDetail._id)}
                    onChange={() =>
                      handleCheckboxChange("material", materialDetail._id)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                  />
                  <span className="text-sm">{materialDetail.name}</span>
                </Label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 pb-4">
            <Label className="text-base font-semibold text-amber-900">
              Price Range
            </Label>
            <div className="px-2">
              <Slider
                min={0}
                max={10000}
                step={1}
                value={[localPrice.priceFrom, localPrice.priceTo]}
                onValueChange={handlePriceChange}
                className="w-full bg-amber-50"
              />
              <div className="flex justify-between mt-3 text-sm font-medium text-amber-700">
                <span className="bg-amber-50 px-2 py-1 rounded flex items-center ">
                  <IndianRupee size={16} />
                  {localPrice.priceFrom.toLocaleString()}
                </span>
                <span className="bg-amber-50 px-2 py-1 rounded flex items-center ">
                  <IndianRupee size={16} />
                  {localPrice.priceTo.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pb-4">
            <Button
              onClick={applyPriceFilter}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Apply Filters
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
