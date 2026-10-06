import React from 'react'

import { SkeletonGrid } from '@/components/kit/SkeletonCard'

export default function ProdukLoading() {
  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[14px] py-5">
        <div className="h-6 w-32 rounded-full bg-skeleton" />
        <div className="h-[42px] w-full rounded-full bg-skeleton" />
        <SkeletonGrid count={6} />
      </div>
    </main>
  )
}
