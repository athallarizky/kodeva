import type { BannerBlock as BannerBlockProps } from 'src/payload-types'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'

type Props = {
  className?: string
} & BannerBlockProps

/** Banner promo dalam-alur (terjadwal via CMS) — desain kartu pengumuman engaging. */
export const BannerBlock: React.FC<Props> = ({ className, content, style, publishAt, unpublishAt }) => {
  // Jadwal promo (opsional): hanya tampil dalam rentang publishAt..unpublishAt
  const now = Date.now()
  if (publishAt && new Date(publishAt).getTime() > now) return null
  if (unpublishAt && new Date(unpublishAt).getTime() < now) return null

  const tones: Record<string, string> = {
    info: 'bg-gradient-to-r from-forest via-[#1f422e] to-forest text-white border border-brand/50 shadow-md',
    error: 'bg-danger-bg text-danger border border-danger/30 shadow-2xs',
    success: 'bg-gradient-to-r from-tint-2 to-tint text-forest border border-line shadow-xs',
    warning: 'bg-warn-bg text-warn border border-warn-line shadow-xs',
  }

  const isInfo = (style ?? 'info') === 'info'

  return (
    <div className={cn('container mx-auto w-full', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[18px] px-5 py-3.5 sm:px-6 sm:py-4 shadow-card transition-all duration-300',
          tones[style ?? 'info'] ?? tones.info,
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isInfo ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-tint-3">
                <Sparkles className="h-4 w-4" />
              </span>
            ) : null}
            <RichText
              className="text-[13px] md:text-[14px] font-medium leading-relaxed [&_p]:m-0 [text-wrap:pretty]"
              data={content}
              enableGutter={false}
              enableProse={false}
            />
          </div>
          {isInfo ? (
            <Link
              href="/produk"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white text-forest px-4 py-1.5 text-[12px] font-bold shadow-xs hover:bg-tint transition-all hover:scale-102 shrink-0"
            >
              Lihat Detail Promo
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
