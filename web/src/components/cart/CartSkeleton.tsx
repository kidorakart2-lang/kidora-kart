"use client";

export default function CartSkeleton({ itemCount }: { itemCount: number }) {
  const cards = Array.from({ length: Math.max(itemCount, 2) });
  return (
    <main className="py-12 md:py-16 bg-gradient-to-b from-background via-background to-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-36 bg-muted rounded animate-pulse mt-2" />
          <div className="h-px bg-border mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {cards.map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-2xl border border-border p-5 sm:p-6 shadow-sm relative overflow-hidden"
              >
                {/* Accent stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500/30 via-brand-400/30 to-brand-600/30" />

                <div className="flex gap-5 relative z-10">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-muted animate-pulse shrink-0" />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Name */}
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    {/* Color */}
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                    {/* Spacer */}
                    <div className="flex-1" />
                    {/* Bottom row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-28 bg-muted animate-pulse rounded-lg" />
                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>

                {/* Shimmer overlay — subtle gradient shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-100/5 to-transparent pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-2xl border border-border shadow-sm sticky top-24 overflow-hidden">
              <div className="px-6 pt-8 pb-4">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="px-6">
                <div className="space-y-3.5 py-5 border-t border-border">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              </div>
              <div className="px-6">
                <div className="flex justify-between py-4 border-t border-border">
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-7 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="px-6 pb-8 space-y-3">
                <div className="h-12 bg-muted animate-pulse rounded-xl w-full" />
                <div className="h-12 bg-muted animate-pulse rounded-xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
