import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

import configPromise from '@payload-config'
import { ProductCatalog } from '@/components/shop/ProductCatalog'
import { toProductDTO } from '@/components/shop/types'
import { SkeletonGrid } from '@/components/kit/SkeletonCard'

export const metadata: Metadata = {
  title: 'Katalog — kodeva',
  description: 'Aplikasi kasir, HR & payroll, dan add-on untuk UMKM Indonesia.',
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
    <main className="bg-page">
      <Suspense
        fallback={
          <div className="container py-6">
            <SkeletonGrid count={6} />
          </div>
        }
      >
        <ProductCatalog products={products} />
      </Suspense>
    </main>
  )
}
