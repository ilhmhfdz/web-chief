// Skeleton for a single ProductCard — matches the card's visual layout
export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square bg-surface-overlay" />
      {/* Content placeholder */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-16 bg-surface-overlay rounded" />
        <div className="h-4 w-3/4 bg-surface-overlay rounded" />
        <div className="h-3 w-full bg-surface-overlay rounded" />
        <div className="h-3 w-2/3 bg-surface-overlay rounded" />
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
          <div className="h-5 w-20 bg-surface-overlay rounded" />
          <div className="w-9 h-9 rounded-xl bg-surface-overlay" />
        </div>
      </div>
    </div>
  );
}

// Grid of n skeleton cards
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
