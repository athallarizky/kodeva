import React from 'react'

import { SkeletonCard } from '@/components/kit/SkeletonCard'

export default function BlogLoading() {
  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[10px] py-5">
        <div className="h-6 w-24 rounded-full bg-skeleton" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[30px] w-20 rounded-full bg-skeleton" />
          ))}
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  )
}
