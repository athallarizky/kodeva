import React from 'react'

import type { TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'
import { Media } from '@/components/Media'

/** Testimoni — kartu putih, avatar inisial hijau (desain kodeva-ui). */
export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ title, items }) => {
  if (!items?.length) return null

  return (
    <div className="container">
      {title && (
        <h2 className="mb-[14px] font-display text-[19px] font-bold text-forest md:text-[22px]">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3">
        {items.map(({ quote, name, role, avatar }, i) => (
          <figure
            key={`${name}-${i}`}
            className="flex h-full flex-col gap-[12px] rounded-[14px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]"
          >
            <blockquote className="flex-1 text-[12.5px] leading-relaxed text-forest">
              &ldquo;{quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-[10px]">
              {avatar && typeof avatar !== 'string' ? (
                <Media
                  resource={avatar}
                  className="h-[36px] w-[36px] shrink-0 overflow-hidden rounded-full"
                  imgClassName="h-[36px] w-[36px] rounded-full object-cover"
                />
              ) : (
                <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-tint-2 text-[13px] font-bold text-forest">
                  {name.charAt(0)}
                </span>
              )}
              <span className="flex flex-col">
                <span className="text-[12.5px] font-bold text-forest">{name}</span>
                {role ? <span className="text-[11px] text-sage">{role}</span> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
