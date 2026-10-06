import type { Metadata } from 'next/types'
import Link from 'next/link'
import { SearchX } from 'lucide-react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PostCard, type PostCardData } from '@/components/blog/PostCard'
import { Chip } from '@/components/kit/Chip'
import { StateScreen } from '@/components/kit/StateScreen'

export const dynamic = 'force-dynamic'

const PER_PAGE = 6

interface Props {
  searchParams: Promise<{ kategori?: string; page?: string }>
}

/** hitung durasi baca kasar dari richText (menit, pembulatan) */
function readMinutes(content: unknown): number | null {
  const words = JSON.stringify(content ?? '')
    .replace(/\\u[0-9a-f]{4}|\\n|\\/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  if (!words) return null
  return Math.max(1, Math.round(words / 120))
}

export default async function BlogPage({ searchParams }: Props) {
  const { kategori, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const payload = await getPayload({ config: configPromise })

  const [posts, categories] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 1,
      limit: PER_PAGE,
      page,
      overrideAccess: false,
      sort: '-publishedAt',
      ...(kategori ? { where: { 'categories.slug': { equals: kategori } } } : {}),
    }),
    payload.find({ collection: 'categories', limit: 20, sort: 'title' }),
  ])

  const cards: PostCardData[] = posts.docs.map((p) => ({
    slug: p.slug,
    title: p.title,
    category:
      (Array.isArray(p.categories) &&
        typeof p.categories[0] !== 'number' &&
        typeof p.categories[0] !== 'string' &&
        p.categories[0]?.title) ||
      null,
    publishedAt: p.publishedAt ?? null,
    readMinutes: readMinutes(p.content),
  }))

  const totalPages = posts.totalPages ?? 1
  const pageLink = (p: number) =>
    `/blog?${new URLSearchParams({ ...(kategori ? { kategori } : {}), page: String(p) }).toString()}`

  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[14px] pb-20 pt-5">
        <header className="flex flex-col gap-[6px]">
          <h1 className="font-display text-[22px] font-bold text-forest">Blog</h1>
          <p className="text-[12.5px] text-sage">Tips &amp; panduan untuk UMKM</p>
        </header>

        {/* chip kategori — filter di URL (?kategori=) */}
        <div className="no-scrollbar -mx-5 flex gap-[8px] overflow-x-auto px-5">
          <Link href="/blog">
            <Chip active={!kategori}>Semua</Chip>
          </Link>
          {categories.docs.map((c) => (
            <Link key={c.id} href={`/blog?kategori=${c.slug}`}>
              <Chip active={kategori === c.slug}>{c.title}</Chip>
            </Link>
          ))}
        </div>

        {cards.length === 0 ? (
          <StateScreen
            icon={<SearchX className="h-[24px] w-[24px]" />}
            title="Belum ada artikel"
            desc={kategori ? `Kategori "${kategori}" belum punya artikel.` : undefined}
            actionLabel="Lihat semua"
            actionHref="/blog"
          />
        ) : (
          <div className="grid gap-[10px] md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <PostCard key={c.slug} post={c} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="flex items-center justify-center gap-[8px] pt-2" aria-label="Halaman blog">
            {page > 1 ? (
              <Link
                href={pageLink(page - 1)}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint"
                aria-label="Halaman sebelumnya"
              >
                ‹
              </Link>
            ) : null}
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) {
                return p === 2 || p === totalPages - 1 ? (
                  <span key={p} className="text-[12px] text-sage">
                    …
                  </span>
                ) : null
              }
              return (
                <Link
                  key={p}
                  href={pageLink(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`flex h-[32px] min-w-[32px] items-center justify-center rounded-full px-2 text-[12.5px] ${
                    p === page
                      ? 'bg-forest font-bold text-white'
                      : 'bg-white text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint'
                  }`}
                >
                  {p}
                </Link>
              )
            })}
            {page < totalPages ? (
              <Link
                href={pageLink(page + 1)}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint"
                aria-label="Halaman berikutnya"
              >
                ›
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Blog — kodeva',
    description: 'Tips & panduan untuk UMKM Indonesia.',
  }
}
