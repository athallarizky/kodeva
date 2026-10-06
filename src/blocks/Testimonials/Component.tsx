import React from 'react'

import type { TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'
import { Media } from '@/components/Media'

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ title, items }) => {
  if (!items?.length) return null

  return (
    <div className="container">
      {title && <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map(({ quote, name, role, avatar }) => (
          <figure
            key={name}
            className="border-border bg-card flex h-full flex-col gap-4 rounded-lg border p-6"
          >
            <blockquote className="text-foreground/90 flex-1 text-sm leading-relaxed">
              &ldquo;{quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3">
              {avatar && typeof avatar !== 'string' ? (
                <Media
                  resource={avatar}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                  imgClassName="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold">
                  {name.charAt(0)}
                </div>
              )}
              <div className="text-sm">
                <div className="font-medium">{name}</div>
                {role && <div className="text-muted-foreground">{role}</div>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
