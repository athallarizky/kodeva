'use client'

import { ArrowRight, Star, TrendingUp, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'
import { trackLandingCtaClick } from '@/lib/tracking'

/** Hero landing — ditingkatkan dengan ambient glow, floating SaaS widgets, & micro-interaksi. */
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
    <section className="relative container flex flex-col gap-6 pb-8 pt-4 sm:gap-8 md:gap-9">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[340px] w-full max-w-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-tint via-tint/30 to-transparent blur-3xl -z-10"
        aria-hidden
      />

      <div className="flex flex-col items-start gap-4 sm:gap-5 md:items-center md:text-center">
        {kicker ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-line/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-forest shadow-2xs backdrop-blur-xs">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            {kicker}
          </span>
        ) : null}
        <h1 className="font-display text-[34px] sm:text-[42px] md:text-[50px] font-bold leading-[1.07] tracking-[-0.03em] text-forest [text-wrap:balance] md:max-w-[680px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-[480px] text-[14.5px] leading-relaxed text-pine/90 md:max-w-[560px] md:text-[16px] [text-wrap:pretty]">
            {subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1.5 md:justify-center">
          <Link
            href={primaryCta?.href || '/produk'}
            onClick={() => trackLandingCtaClick(primaryLabel, 'hero')}
            className="group relative inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-full bg-brand px-7 py-3.5 text-[14px] font-medium text-white shadow-card transition-all duration-200 hover:bg-forest hover:shadow-pop hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          {secondaryLabel && secondaryCta?.href ? (
            <Link
              href={secondaryCta.href}
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-white/90 px-6 py-3.5 text-[14px] font-medium text-forest border border-line/80 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:bg-tint hover:border-forest/20 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Frame Gambar dengan Floating SaaS Widgets */}
      <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-[20px] md:rounded-[26px] border border-line/80 bg-white shadow-pop md:aspect-[21/9]">
        <Image
          src={heroImage}
          alt="Pemilik warung menggunakan aplikasi kodeva"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1000px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
        />
        <div className="pointer-events-none absolute inset-0 rounded-[20px] md:rounded-[26px] ring-1 ring-inset ring-black/5" />

        {/* Floating Widget 1: Live Omzet */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-pop backdrop-blur-md border border-line/80 transition-transform duration-300 hover:scale-105">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-tint text-brand">
            <TrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-medium text-sage">Omzet Real-time</span>
            <span className="text-[12.5px] sm:text-[14px] font-bold text-forest tabular-nums">
              Rp 2.450.000 <span className="text-[10px] sm:text-[11px] text-brand font-semibold">+18%</span>
            </span>
          </div>
        </div>

        {/* Floating Widget 2: Speed Badge */}
        <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-10 flex items-center gap-2 rounded-xl sm:rounded-2xl bg-forest/90 px-3 py-1.5 sm:px-4 sm:py-2 text-white shadow-pop backdrop-blur-md border border-forest/60 transition-transform duration-300 hover:scale-105">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warn-accent shrink-0 fill-warn-accent" />
          <span className="text-[11px] sm:text-[12.5px] font-semibold">Cetak struk &lt; 1 detik</span>
        </div>
      </div>

      {/* Social Proof Trust Badge */}
      <div className="inline-flex items-center justify-center self-center gap-2.5 rounded-full bg-white/80 border border-line/70 px-4 py-2 shadow-2xs backdrop-blur-xs">
        <span className="flex gap-0.5 text-warn-accent" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-warn-accent text-warn-accent" />
          ))}
        </span>
        <span className="text-[12px] font-medium text-pine">
          Dipercaya <strong className="font-semibold text-forest">2.400+</strong> pelaku usaha di Indonesia
        </span>
      </div>
    </section>
  )
}
