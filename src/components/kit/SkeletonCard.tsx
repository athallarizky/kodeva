import React from 'react'

/** Kartu skeleton katalog (states.html — SkTile + SkLine×3, warna #E9E6DD/#DCE9D2). */
export const SkeletonCard: React.FC = () => (
  <div className="rounded-[14px] bg-white p-[12px] outline outline-1 outline-line outline-offset-[-0.5px]">
    <div className="mb-[10px] h-[92px] w-full rounded-[10px] bg-skeleton" />
    <div className="mb-[6px] h-3 w-3/4 rounded-full bg-skeleton" />
    <div className="mb-[6px] h-2.5 w-full rounded-full bg-tint-2" />
    <div className="h-2.5 w-2/3 rounded-full bg-tint-2" />
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
