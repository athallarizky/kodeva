import type { Metadata } from 'next'
import { MessageCircle, PackageOpen, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import { ProductCard } from '@/components/shop/ProductCard'
import { toProductDTO } from '@/components/shop/types'
import { PostHero } from '@/heros/PostHero'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { generateMeta } from '@/utilities/generateMeta'
import type { Product } from '@/payload-types'
import PageClient from './page.client'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return posts.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/blog/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const relatedProductDocs = (post.relatedProducts || []).filter(
    (p): p is Product => typeof p === 'object' && p !== null,
  )

  return (
    <article className="min-h-screen bg-page pb-24">
      <PageClient />
      <PayloadRedirects disableNotFound url={url} />
      {draft && <LivePreviewListener />}

      {/* Editorial Hero Header */}
      <PostHero post={post} />

      {/* Reading Surface */}
      <div className="container max-w-4xl mt-2">
        <div className="rounded-[24px] bg-white p-6 sm:p-10 md:p-12 border border-line/80 shadow-card">
          <RichText
            className="max-w-none text-forest prose prose-forest prose-headings:font-display prose-headings:font-bold prose-headings:text-forest prose-headings:tracking-tight prose-p:text-pine/90 prose-p:text-[15.5px] prose-p:leading-relaxed prose-li:text-pine/90 prose-strong:text-forest prose-a:text-brand prose-a:font-semibold hover:prose-a:underline"
            data={post.content}
            enableGutter={false}
          />
        </div>

        {/* Mid/Bottom Reassurance CTA */}
        <section
          aria-label="Solusi Kodeva"
          className="mt-10 rounded-[20px] bg-white p-6 sm:p-8 border border-line/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11.5px] font-bold uppercase tracking-wider">Solusi Nyata UMKM</span>
            </div>
            <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-forest tracking-tight">
              Tingkatkan efisiensi bisnis Anda bersama Kodeva
            </h2>
            <p className="text-[13px] text-sage leading-relaxed">
              Dapatkan modul kasir terintegrasi atau software HR dengan lisensi fleksibel mulai Rp149 ribu per bulan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/produk"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-forest-light active:scale-95 transition-all text-center"
            >
              <Store className="h-4 w-4" />
              <span>Lihat Katalog</span>
            </Link>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Kodeva,%20saya%20membaca%20artikel%20dan%20tertarik%20dengan%20solusi%20kasir/HR"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-[13px] font-bold text-forest hover:border-brand hover:text-brand active:scale-95 transition-all text-center"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Konsultasi WA</span>
            </a>
          </div>
        </section>

        {/* Produk Terkait — tautan produk dari artikel (brief: artikel menautkan produk) */}
        {relatedProductDocs.length > 0 && (
          <section aria-label="Modul Kodeva yang terkait" className="mt-14">
            <div className="flex items-center gap-2 text-brand mb-2">
              <PackageOpen className="h-4 w-4" />
              <span className="text-[11.5px] font-bold uppercase tracking-wider">
                Modul yang dibahas
              </span>
            </div>
            <h2 className="font-display text-[20px] sm:text-[22px] font-bold tracking-tight text-forest mb-4 [text-wrap:balance]">
              Pakai modul yang sama seperti di artikel ini
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {relatedProductDocs.map((p) => (
                <ProductCard key={p.id} product={toProductDTO(p)} />
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-14">
            <RelatedPosts
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          </div>
        )}
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
