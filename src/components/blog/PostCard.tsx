import { CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

/** tanggal Indonesia ringkas: "6 Okt 2026" */
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
}

/** Kartu post horizontal — thumb tile ikon + kategori + judul + meta (desain blog). */
export const PostCard: React.FC<{ post: PostCardData }> = ({ post }) => (
  <Link
    href={`/blog/${post.slug}`}
    className="flex items-stretch gap-[12px] rounded-[14px] bg-white p-[12px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px] transition-shadow hover:shadow-pop"
  >
    <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[10px] bg-tint font-display text-[20px] font-bold text-brand">
      {post.title.trim().charAt(0).toUpperCase()}
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
      {post.category ? (
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage">
          {post.category}
        </span>
      ) : null}
      <span className="line-clamp-2 text-[13.5px] font-bold leading-snug text-forest">
        {post.title}
      </span>
      <span className="flex items-center gap-[10px] text-[10.5px] text-sage">
        {post.publishedAt ? (
          <span className="flex items-center gap-[4px]">
            <CalendarDays className="h-[11px] w-[11px]" />
            {fmtDate(post.publishedAt)}
          </span>
        ) : null}
        {post.readMinutes ? (
          <span className="flex items-center gap-[4px]">
            <Clock className="h-[11px] w-[11px]" />
            {post.readMinutes} mnt
          </span>
        ) : null}
      </span>
    </span>
  </Link>
)
