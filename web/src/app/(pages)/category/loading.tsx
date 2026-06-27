import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Hidden on mobile, 1/4 width on desktop */}
        <div className="hidden md:block w-full md:w-1/4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>

        {/* Products Grid - Full width on mobile, 3/4 on desktop */}
        <div className="w-full md:w-3/4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            {["Sort by", "Price", "Filter"].map((item, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-md" />
            ))}
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
