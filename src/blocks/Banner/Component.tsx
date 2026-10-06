import type { BannerBlock as BannerBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
} & BannerBlockProps

/** Banner promo dalam-alur (terjadwal via CMS) — bahasa visual kodeva-ui. */
export const BannerBlock: React.FC<Props> = ({ className, content, style, publishAt, unpublishAt }) => {
  // Jadwal promo (opsional): hanya tampil dalam rentang publishAt..unpublishAt
  const now = Date.now()
  if (publishAt && new Date(publishAt).getTime() > now) return null
  if (unpublishAt && new Date(unpublishAt).getTime() < now) return null

  const tones: Record<string, string> = {
    info: 'bg-forest text-white [&_a]:underline',
    error: 'bg-danger-bg text-danger outline outline-1 outline-danger/30',
    success: 'bg-tint-2 text-forest outline outline-1 outline-line',
    warning: 'bg-warn-bg text-warn outline outline-1 outline-warn-line',
  }

  return (
    <div className={cn('mx-auto w-full', className)}>
      <div
        className={cn(
          'rounded-[14px] px-[18px] py-[14px] shadow-card',
          tones[style ?? 'info'] ?? tones.info,
        )}
      >
        <RichText
          className="text-[13px] leading-relaxed [&_p]:m-0"
          data={content}
          enableGutter={false}
          enableProse={false}
        />
      </div>
    </div>
  )
}
