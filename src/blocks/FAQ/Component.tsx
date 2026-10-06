import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { FaqBlock as FaqBlockProps } from '@/payload-types'

// Accordion native <details> — tanpa JS, ramah mobile & aksesibel.
// JSON-LD FAQPage dirender untuk SEO (rich result).
export const FaqBlock: React.FC<FaqBlockProps> = ({ title, items }) => {
  if (!items?.length) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
        {/* Left Column: Context & Support Help */}
        <div className="flex flex-col gap-2 lg:col-span-5 lg:sticky lg:top-24">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
            Pusat Bantuan
          </span>
          {title ? (
            <h2 className="font-display text-[26px] md:text-[32px] font-bold tracking-[-0.025em] text-forest leading-tight [text-wrap:balance]">
              {title}
            </h2>
          ) : null}
          <p className="text-[13.5px] leading-relaxed text-pine/80 md:text-[14.5px]">
            Semua yang perlu kamu ketahui tentang cara kerja lisensi, upgrade paket, dan garansi Kodeva.
          </p>

          <div className="mt-4 rounded-[18px] bg-gradient-to-b from-white to-tint/30 border border-line/75 p-5 shadow-2xs">
            <h3 className="text-[13px] font-bold text-forest">Butuh informasi lebih detail?</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-pine/80">
              Tim spesialis kami siap membantu menjelaskan integrasi outlet usahamu.
            </p>
            <Link
              href="/produk"
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand transition-colors hover:text-forest"
            >
              Lihat panduan modul
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Numbered Accordions */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          {items.map(({ question, answer }, i) => (
            <details
              key={i}
              className="group rounded-[18px] bg-white px-5 py-4 border border-line/75 shadow-card transition-all duration-200 open:border-l-4 open:border-l-brand open:border-line/75 open:bg-tint/20 open:shadow-md [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-[14px] font-bold text-forest transition-colors duration-150 group-hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg py-0.5">
                <span className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tabular-nums text-sage/90">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{question}</span>
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-sage transition-transform duration-200 group-open:rotate-180 group-open:text-brand"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-[13px] md:text-[13.5px] leading-relaxed text-pine/90 pt-3 border-t border-line/40 pl-7 [text-wrap:pretty]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
