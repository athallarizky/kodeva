import { CodeXml } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

/** Logo kodeva — mark hijau + wordmark Funnel Sans (desain kodeva-ui). */
export const BrandLogo: React.FC<{ variant?: 'header' | 'footer'; href?: string | null }> = ({
  variant = 'header',
  href = '/',
}) => {
  const isFooter = variant === 'footer'
  const content = (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-[9px]',
          isFooter ? 'h-[26px] w-[26px] bg-tint-3' : 'h-[30px] w-[30px] bg-brand',
        )}
      >
        <CodeXml
          strokeWidth={2.2}
          className={cn(isFooter ? 'h-[15px] w-[15px] text-forest' : 'h-[17px] w-[17px] text-white')}
        />
      </span>
      <span
        className={cn(
          'font-display text-[19px] font-bold leading-none',
          isFooter ? 'text-white' : 'text-forest',
        )}
      >
        kodeva
      </span>
    </span>
  )
  if (!href) return content
  return (
    <Link href={href} aria-label="kodeva — beranda">
      {content}
    </Link>
  )
}
