import { ChevronDown } from 'lucide-react'
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
      {title && (
        <h2 className="mb-[14px] font-display text-[19px] font-bold text-forest md:text-[22px]">
          {title}
        </h2>
      )}
      <div className="flex flex-col gap-[10px]">
        {items.map(({ question, answer }, i) => (
          <details
            key={i}
            className="group rounded-[14px] bg-white px-[16px] py-[13px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px] [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-[12px] text-[13px] font-bold text-forest">
              {question}
              <ChevronDown
                className="h-[15px] w-[15px] shrink-0 text-sage transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-[8px] text-[12.5px] leading-relaxed text-sage">{answer}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
