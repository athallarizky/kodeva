import React from 'react'

/** Kartu skeleton katalog (states.html — SkTile + SkLine×3, warna #E9E6DD/#DCE9D2). */
export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-[18px] bg-white p-3.5 border border-line/70 shadow-card flex flex-col gap-3">
    <div className="h-[100px] w-full rounded-[14px] bg-skeleton/70" />
    <div className="flex flex-col gap-2 pt-0.5">
      <div className="h-4 w-3/4 rounded-md bg-skeleton/80" />
      <div className="h-3 w-full rounded-md bg-tint-2/70" />
      <div className="h-3 w-1/2 rounded-md bg-tint-2/70" />
    </div>
    <div className="mt-1 flex items-center justify-between border-t border-line/40 pt-2.5">
      <div className="h-4 w-20 rounded-md bg-skeleton/70" />
      <div className="h-3 w-10 rounded-md bg-tint-2/70" />
    </div>
  </div>
)

/** Grid skeleton — dipakai loading.tsx katalog & fallback hydrate. */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 gap-[12px] md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)
