"use client";

export default function CartSkeleton({ itemCount }: { itemCount: number }) {
  const cards = Array.from({ length: Math.max(itemCount, 1) });
  return (
    <main className="py-12 md:py-16 bg-gradient-to-b from-background via-background to-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl fw-heading text-foreground tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-light">Loading your cart…</p>
          <div className="h-px bg-gradient-to-r from-border via-border to-transparent mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {cards.map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-2xl p-5 sm:p-6 shadow-md border border-border animate-shimmer"
              >
                <div className="flex gap-4 sm:gap-6 relative z-10">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="h-10 w-24 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-xl border border-border sticky top-24 space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
              <div className="space-y-3 py-6 border-y border-border">
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
              </div>
              <div className="h-12 bg-muted rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
