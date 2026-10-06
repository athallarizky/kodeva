import type { Metadata } from 'next/types'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  SearchX,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { PostCard, type PostCardData } from '@/components/blog/PostCard'
import { Chip } from '@/components/kit/Chip'
import { StateScreen } from '@/components/kit/StateScreen'

export const dynamic = 'force-dynamic'

const PER_PAGE = 6

interface Props {
  searchParams: Promise<{ kategori?: string; page?: string }>
}

/** Hitung durasi baca kasar dari richText (menit, pembulatan) */
function readMinutes(content: unknown): number | null {
  const words = JSON.stringify(content ?? '')
    .replace(/\\u[0-9a-f]{4}|\\n|\\/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  if (!words) return null
  return Math.max(1, Math.round(words / 120))
}

/** Ekstrak cuplikan ringkasan artikel */
function extractExcerpt(
  post: { meta?: { description?: string | null }; content?: unknown },
): string | null {
  if (post.meta?.description && post.meta.description.trim().length > 0) {
    return post.meta.description.trim()
  }
  try {
    const raw = JSON.stringify(post.content ?? '')
    const matches = raw.match(/"text":"([^"]+)"/g)
    if (matches && matches.length > 0) {
      const text = matches
        .map((m) => m.replace(/"text":"/, '').replace(/"$/, ''))
        .join(' ')
        .replace(/\\"/g, '"')
        .trim()
      if (text.length > 130) return text.slice(0, 130).trim() + '…'
      return text || null
    }
  } catch {
    // fallback
  }
  return null
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
    excerpt: extractExcerpt(p),
  }))

  const totalPages = posts.totalPages ?? 1
  const pageLink = (p: number) =>
    `/blog?${new URLSearchParams({ ...(kategori ? { kategori } : {}), page: String(p) }).toString()}`

  return (
    <main className="min-h-[85vh] bg-page pb-24 pt-6 sm:pt-8">
      <div className="container max-w-6xl">
        {/* Header Hero Section */}
        <header className="mb-8 flex flex-col gap-2.5 border-b border-line/70 pb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Wawasan &amp; Edukasi Bisnis</span>
          </div>
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold text-forest tracking-tight">
            Blog &amp; Panduan UMKM
          </h1>
          <p className="max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-sage">
            Kumpulan panduan praktis pengelolaan kasir, optimasi absensi &amp; payroll karyawan, serta studi kasus nyata
            pertumbuhan usaha dari ekosistem Kodeva.
          </p>
        </header>

        {/* Filter Kategori Chips */}
        <section aria-label="Filter kategori artikel" className="mb-8">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 pb-1">
            <Link href="/blog">
              <Chip active={!kategori}>Semua Artikel</Chip>
            </Link>
            {categories.docs.map((c) => (
              <Link key={c.id} href={`/blog?kategori=${c.slug}`}>
                <Chip active={kategori === c.slug}>{c.title}</Chip>
              </Link>
            ))}
          </div>
        </section>

        {/* Post Grid or Empty State */}
        {cards.length === 0 ? (
          <div className="py-12">
            <StateScreen
              icon={<SearchX className="h-7 w-7 text-sage" />}
              title="Belum Ada Artikel"
              desc={
                kategori
                  ? `Kategori "${kategori}" saat ini belum memiliki artikel yang dipublikasikan.`
                  : 'Belum ada artikel yang tersedia saat ini.'
              }
              actionLabel="Lihat Semua Kategori"
              actionHref="/blog"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <PostCard key={c.slug} post={c} />
            ))}
          </div>
        )}

        {/* Numbered Pagination */}
        {totalPages > 1 ? (
          <nav
            className="mt-12 flex items-center justify-center gap-2 border-t border-line/60 pt-6"
            aria-label="Navigasi halaman blog"
          >
            {page > 1 ? (
              <Link
                href={pageLink(page - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest border border-line shadow-2xs transition-colors hover:border-brand hover:bg-tint active:scale-95"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : null}

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) {
                return p === 2 || p === totalPages - 1 ? (
                  <span key={p} className="px-1 text-[13px] text-sage">
                    …
                  </span>
                ) : null
              }
              return (
                <Link
                  key={p}
                  href={pageLink(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-semibold transition-all active:scale-95 ${
                    p === page
                      ? 'bg-forest text-white shadow-sm font-bold'
                      : 'bg-white text-forest border border-line hover:border-brand/40 hover:bg-tint/50'
                  }`}
                >
                  {p}
                </Link>
              )
            })}

            {page < totalPages ? (
              <Link
                href={pageLink(page + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest border border-line shadow-2xs transition-colors hover:border-brand hover:bg-tint active:scale-95"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </nav>
        ) : null}

        {/* Reassurance Consultation Banner */}
        <section className="mt-16 rounded-[20px] bg-white p-6 sm:p-8 border border-line/80 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-brand">
                <Sparkles className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">Konsultasi Bisnis Gratis</span>
              </div>
              <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-forest tracking-tight">
                Ingin berdiskusi tentang sistem kasir atau HR untuk usaha Anda?
              </h2>
              <p className="text-[13px] text-sage leading-relaxed">
                Tim spesialis Kodeva siap membantu membedah alur operasional dan memilihkan paket lisensi paling hemat
                untuk bisnis Anda.
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Kodeva,%20saya%20membaca%20blog%20dan%20ingin%20konsultasi%20solusi%20untuk%20usaha%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-[13.5px] font-bold text-white shadow-md hover:bg-brand-hover hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Tanya Tim Spesialis</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Blog & Panduan UMKM — Kodeva',
    description: 'Kumpulan tips praktis, panduan operasional software kasir dan HR, serta wawasan bisnis untuk UMKM Indonesia.',
  }
}
