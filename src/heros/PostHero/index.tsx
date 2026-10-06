import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'
import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

/** Format tanggal Indonesia: "6 Oktober 2026" */
function formatIndonesianDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
}

/** Hitung durasi baca kasar dari richText */
function calculateReadingMinutes(content: unknown): number {
  const words = JSON.stringify(content ?? '')
    .replace(/\\u[0-9a-f]{4}|\\n|\\/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  if (!words) return 3
  return Math.max(1, Math.round(words / 120))
}

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title, content } = post

  const hasAuthors =
    Boolean(populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== '')
  const authorName = (hasAuthors ? formatAuthors(populatedAuthors!) : '') || 'Tim Editorial Kodeva'
  const authorInitial = authorName.trim().charAt(0).toUpperCase()
  const readMinutes = calculateReadingMinutes(content)

  return (
    <section className="w-full bg-page pb-6 pt-6 sm:pt-8">
      <div className="container max-w-4xl">
        {/* Back navigation */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sage transition-colors hover:text-forest active:scale-95 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Semua Artikel</span>
        </Link>

        {/* Categories & Reading Time */}
        <div className="flex flex-wrap items-center gap-2.5">
          {categories?.map((category, index) => {
            if (typeof category === 'object' && category !== null) {
              const categoryTitle = category.title || 'Artikel'
              return (
                <span
                  key={index}
                  className="rounded-full bg-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand shadow-2xs"
                >
                  {categoryTitle}
                </span>
              )
            }
            return null
          })}

          <div className="flex items-center gap-1 text-[12px] font-medium text-sage">
            <span>·</span>
            <Clock className="h-3.5 w-3.5 ml-0.5" />
            <span>{readMinutes} menit baca</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-4 font-display text-[26px] sm:text-[36px] md:text-[42px] font-bold leading-[1.25] text-forest tracking-tight text-balance">
          {title}
        </h1>

        {/* Author & Publication Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line/70 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand text-white font-display text-[15px] font-bold shadow-2xs">
              {authorInitial || <User className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-[13.5px] font-bold text-forest">{authorName}</p>
              <p className="text-[11.5px] text-sage">Spesialis Solusi Digital UMKM</p>
            </div>
          </div>

          {publishedAt ? (
            <div className="flex items-center gap-1.5 text-[12.5px] text-sage">
              <CalendarDays className="h-4 w-4 text-brand" />
              <time dateTime={publishedAt} className="font-medium text-forest/90">
                {formatIndonesianDate(publishedAt)}
              </time>
            </div>
          ) : null}
        </div>

        {/* Hero Image (if available) */}
        {heroImage && typeof heroImage !== 'string' ? (
          <div className="mt-8 overflow-hidden rounded-[20px] border border-line/80 shadow-card bg-tint">
            <Media priority resource={heroImage} imgClassName="w-full h-auto max-h-[460px] object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
