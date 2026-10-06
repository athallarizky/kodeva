import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  Lightbulb,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

/** Format tanggal Indonesia ringkas: "6 Okt 2026" */
const fmtDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
}

export interface PostCardData {
  slug: string
  title: string
  category: string | null
  publishedAt: string | null
  readMinutes: number | null
  excerpt?: string | null
}

function getCategoryIcon(category: string | null, slug: string): LucideIcon {
  const cat = (category || '').toLowerCase()
  const s = slug.toLowerCase()
  if (cat.includes('tips') || cat.includes('usaha') || s.includes('kasir')) return Store
  if (cat.includes('panduan') || cat.includes('guide') || s.includes('hr')) return BookOpen
  if (cat.includes('promo') || s.includes('promo')) return Tag
  if (cat.includes('studi') || cat.includes('kasus')) return TrendingUp
  return FileText
}

/** Kartu artikel blog premium — layout kartu responsif dengan ikon tematik, tag kategori, cuplikan ringkas, dan metadata baca. */
export const PostCard: React.FC<{
  post: PostCardData
  layout?: 'grid' | 'horizontal'
  className?: string
}> = ({ post, layout = 'grid', className }) => {
  const Icon = getCategoryIcon(post.category, post.slug)

  if (layout === 'horizontal') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          'group flex items-center gap-3.5 rounded-[14px] bg-white p-3.5 border border-line/80 shadow-2xs transition-all hover:border-brand/40 hover:shadow-card active:scale-[0.99]',
          className,
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand transition-colors group-hover:bg-brand group-hover:text-white">
          <Icon className="h-5 w-5 stroke-[2.2]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {post.category ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              {post.category}
            </span>
          ) : null}
          <span className="line-clamp-2 text-[13.5px] font-bold leading-snug text-forest group-hover:text-brand transition-colors">
            {post.title}
          </span>
          <span className="flex items-center gap-2 text-[11px] text-sage">
            {post.publishedAt ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>{fmtDate(post.publishedAt)}</span>
              </span>
            ) : null}
            {post.readMinutes ? (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{post.readMinutes} mnt</span>
                </span>
              </>
            ) : null}
          </span>
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex flex-col justify-between rounded-[18px] bg-white p-5 sm:p-6 border border-line/80 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card-hover active:scale-[0.99]',
        className,
      )}
    >
      <div>
        {/* Top Header: Category Icon & Pill */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-tint text-brand shadow-2xs transition-colors group-hover:bg-brand group-hover:text-white">
            <Icon className="h-5 w-5 stroke-[2.2]" />
          </span>
          {post.category ? (
            <span className="rounded-full bg-tint px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-brand">
              {post.category}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h2 className="mt-4 font-display text-[16px] sm:text-[17px] font-bold leading-snug text-forest transition-colors group-hover:text-brand line-clamp-2">
          {post.title}
        </h2>

        {/* Optional Excerpt */}
        {post.excerpt ? (
          <p className="mt-2 text-[13px] leading-relaxed text-sage line-clamp-2">
            {post.excerpt}
          </p>
        ) : null}
      </div>

      {/* Footer Meta */}
      <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3.5 text-[11.5px] text-sage">
        <div className="flex items-center gap-2">
          {post.publishedAt ? (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{fmtDate(post.publishedAt)}</span>
            </span>
          ) : null}
          {post.publishedAt && post.readMinutes ? <span>·</span> : null}
          {post.readMinutes ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readMinutes} mnt baca</span>
            </span>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-brand transition-transform group-hover:translate-x-1">
          <span className="text-[12px]">Baca</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      </div>
    </Link>
  )
}
