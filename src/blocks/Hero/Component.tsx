'use client'

import React from 'react'
import Link from 'next/link'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'
import { Media } from '@/components/Media'
import { trackLandingCtaClick } from '@/lib/tracking'

export const HeroBlock: React.FC<HeroBlockProps> = ({ kicker, title, subtitle, image, primaryCta, secondaryCta }) => {
  const primaryLabel = primaryCta?.label || 'Lihat Produk'
  const secondaryLabel = secondaryCta?.label || ''

  return (
    <div className="container">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          {kicker && (
            <span className="text-primary border-primary bg-primary/5 rounded-full border px-3 py-1 text-sm font-medium">
              {kicker}
            </span>
          )}
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          {subtitle && <p className="text-muted-foreground max-w-md text-lg">{subtitle}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={primaryCta?.href || '/produk'}
              onClick={() => trackLandingCtaClick(primaryLabel, 'hero')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center rounded-md px-6 text-base font-medium"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryCta?.href && (
              <Link
                href={secondaryCta.href}
                className="border-border text-foreground hover:bg-accent inline-flex h-11 items-center rounded-md border px-6 text-base font-medium"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
        {image && typeof image !== 'string' && (
          <Media
            resource={image}
            className="rounded-lg border border-border object-cover shadow-sm"
            imgClassName="h-auto w-full"
          />
        )}
      </div>
    </div>
  )
}
