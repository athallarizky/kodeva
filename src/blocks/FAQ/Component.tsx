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
      {title && <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>}
      <div className="flex flex-col gap-3">
        {items.map(({ question, answer }, i) => (
          <details
            key={i}
            className="border-border bg-card group rounded-lg border px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
              {question}
              <span className="text-muted-foreground group-open:rotate-45 transition-transform" aria-hidden>
                +
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 leading-relaxed">{answer}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
