import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

import configPromise from '@payload-config'
import { ProductCatalog } from '@/components/shop/ProductCatalog'
import { toProductDTO } from '@/components/shop/types'
import { SkeletonGrid } from '@/components/kit/SkeletonCard'

export const metadata: Metadata = {
  title: 'Katalog Modul & Lisensi — kodeva',
  description: 'Software operasional terintegrasi: aplikasi kasir, sistem HR & payroll, dan modul add-on siap pakai untuk UMKM Indonesia.',
}

export default async function ProdukPage() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    limit: 100,
    sort: '-createdAt',
  })

  const products = docs.map(toProductDTO)

  return (
    <main className="bg-page min-h-[calc(100vh-140px)]">
      <Suspense
        fallback={
          <div className="container py-8 sm:py-12">
            <SkeletonGrid count={6} />
          </div>
        }
      >
        <ProductCatalog products={products} />
      </Suspense>
    </main>
  )
}
