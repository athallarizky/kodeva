import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'
import { notFound } from 'next/navigation'

import configPromise from '@payload-config'
import { ProductDetail } from '@/components/shop/ProductDetail'
import { toProductDTO } from '@/components/shop/types'
import { buildQuotaIndex } from '@/lib/quota'

interface Props {
  params: Promise<{ slug: string }>
}

async function queryProductBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({ collection: 'products', limit: 100 })
  return docs.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug(slug)
  if (!product) return { title: 'Produk tidak ditemukan — kodeva' }
  return {
    title: `${product.name} — kodeva`,
    description: product.tagline ?? undefined,
  }
}

export default async function ProdukDetailPage({ params }: Props) {
  const { slug } = await params
  const doc = await queryProductBySlug(slug)
  if (!doc) notFound()

  const product = toProductDTO(doc)
  const quotaIndex = buildQuotaIndex([doc])

  return (
    <main className="bg-page">
      <ProductDetail product={product} quotaIndex={quotaIndex} />
    </main>
  )
}
