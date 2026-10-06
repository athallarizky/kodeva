import { Star } from 'lucide-react'
import React from 'react'

import type { TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'
import { Media } from '@/components/Media'

/** Testimoni — kartu interaktif dengan rating bintang, verified badge, & aksen visual. */
export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ title, items }) => {
  if (!items?.length) return null

  return (
    <div className="container">
      <div className="mb-5 flex flex-col gap-1 md:mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
          Cerita Sukses Mitra
        </span>
        {title ? (
          <h2 className="font-display text-[24px] md:text-[28px] font-bold tracking-[-0.025em] text-forest [text-wrap:balance]">
            {title}
          </h2>
        ) : null}
        <p className="text-[13px] md:text-[14px] text-pine/80">
          Bagaimana operasional toko jadi lebih tertib dan laporan kasir selesai tanpa lembur.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        {items.map(({ quote, name, role, avatar }, i) => (
          <figure
            key={`${name}-${i}`}
            className="group relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-[20px] bg-gradient-to-b from-white to-tint/20 p-5 sm:p-6 border border-line/75 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop hover:border-brand/30"
          >
            {/* Top gradient highlight on hover */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-warn-accent" aria-hidden>
                  {[0, 1, 2, 3, 4].map((starIdx) => (
                    <Star key={starIdx} className="h-3.5 w-3.5 fill-warn-accent text-warn-accent" />
                  ))}
                </div>
                <span className="inline-flex items-center rounded-full bg-tint/80 border border-line/60 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-brand">
                  Terverifikasi
                </span>
              </div>
              <blockquote className="text-[13px] md:text-[13.5px] leading-relaxed text-forest [text-wrap:pretty]">
                &ldquo;{quote}&rdquo;
              </blockquote>
            </div>

            <figcaption className="flex items-center gap-3 pt-3 border-t border-line/40">
              {avatar && typeof avatar !== 'string' ? (
                <Media
                  resource={avatar}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-tint-2"
                  imgClassName="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint-2 text-[13.5px] font-bold text-forest ring-2 ring-tint-2/80 shadow-2xs">
                  {name.charAt(0)}
                </span>
              )}
              <span className="flex flex-col">
                <span className="text-[13px] font-bold text-forest">{name}</span>
                {role ? <span className="text-[11.5px] text-pine/80 leading-tight">{role}</span> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
