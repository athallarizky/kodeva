import React from 'react'

export default function ProdukDetailLoading() {
  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[14px] py-4">
        <div className="h-[32px] w-[32px] rounded-full bg-skeleton" />
        <div className="aspect-[8/5] w-full rounded-[16px] bg-skeleton" />
        <div className="h-6 w-2/3 rounded-full bg-skeleton" />
        <div className="h-40 rounded-[16px] bg-skeleton" />
        <div className="h-40 rounded-[16px] bg-skeleton" />
      </div>
    </main>
  )
}
