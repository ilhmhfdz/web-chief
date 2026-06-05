// Premium skeleton for a single ProductCard
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Image placeholder — matches 4:5 aspect ratio */}
      <div className="aspect-[4/5] bg-surface-raised rounded-2xl mb-3 border border-surface-muted/50" />
      {/* Content placeholder */}
      <div className="flex flex-col gap-2 px-0.5">
        <div className="h-3.5 w-3/4 bg-surface-overlay rounded-lg" />
        <div className="h-3 w-full bg-surface-overlay rounded-lg" />
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-surface-overlay" />
            ))}
          </div>
          <div className="h-2.5 w-10 bg-surface-overlay rounded" />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="h-4 w-20 bg-surface-overlay rounded-lg" />
          <div className="h-3 w-14 bg-surface-overlay rounded-full" />
        </div>
        <div className="h-9 w-full bg-surface-overlay rounded-xl mt-1 lg:hidden" />
      </div>
    </div>
  );
}

// Grid of n skeleton cards
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
