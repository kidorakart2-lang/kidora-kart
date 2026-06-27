import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((item) => (
          <React.Fragment key={item}>
            <Skeleton className="h-4 w-20" />
            {item < 3 && <span className="mx-2">/</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                className="aspect-square w-full rounded-md"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Skeleton className="h-12 w-full sm:w-40" />
            <Skeleton className="h-12 w-full sm:w-40" />
          </div>

          <div className="pt-6 space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="border-t border-gray-200 pt-8 mb-12">
        <div className="flex gap-6 mb-6">
          {["Description", "Reviews", "Shipping & Returns"].map((tab) => (
            <Skeleton key={tab} className="h-8 w-24" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Related Products */}
      <div className="mb-16">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
