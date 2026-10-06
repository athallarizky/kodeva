'use client'

import { ArrowRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'
import { trackLandingCtaClick } from '@/lib/tracking'

/** Hero landing — desain kodeva-ui: kicker, display font, CTA row, foto, trust row. */
export const HeroBlock: React.FC<HeroBlockProps> = ({
  kicker,
  title,
  subtitle,
  image,
  primaryCta,
  secondaryCta,
}) => {
  const primaryLabel = primaryCta?.label || 'Lihat Produk'
  const secondaryLabel = secondaryCta?.label || ''
  const heroImage =
    image && typeof image !== 'string' && image.url ? image.url : '/images/hero-warung.jpg'

  return (
    <section className="container flex flex-col gap-[18px] pb-8 pt-7">
      <div className="flex flex-col items-start gap-[14px] md:items-center md:text-center">
        {kicker ? (
          <span className="rounded-full bg-tint px-[12px] py-[5px] text-[10.5px] font-bold uppercase tracking-wide text-forest">
            {kicker}
          </span>
        ) : null}
        <h1 className="font-display text-[29px] font-bold leading-[1.12] text-forest md:max-w-[560px] md:text-[38px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-[420px] text-[13.5px] leading-relaxed text-sage md:max-w-[520px] md:text-[15px]">
            {subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-[10px] md:justify-center">
          <Link
            href={primaryCta?.href || '/produk'}
            onClick={() => trackLandingCtaClick(primaryLabel, 'hero')}
            className="inline-flex items-center gap-[8px] rounded-full bg-brand px-[22px] py-[13px] text-[14px] text-white transition-colors hover:bg-forest"
          >
            {primaryLabel}
            <ArrowRight className="h-[15px] w-[15px]" />
          </Link>
          {secondaryLabel && secondaryCta?.href ? (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center rounded-full bg-white px-[18px] py-[13px] text-[14px] text-forest outline outline-1 outline-line outline-offset-[-0.5px] transition-colors hover:bg-tint"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] shadow-pop md:aspect-[21/9]">
        <Image
          src={heroImage}
          alt="Pemilik warung menggunakan aplikasi kodeva"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 900px"
          className="object-cover"
        />
      </div>

      <p className="flex items-center justify-center gap-[6px] text-[11.5px] text-sage">
        <span className="flex gap-[2px]" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-[13px] w-[13px] fill-warn-accent text-warn-accent" />
          ))}
        </span>
        Dipercaya 2.400+ UMKM
      </p>
    </section>
  )
}
