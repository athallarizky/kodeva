import React from 'react'
import { Sparkles } from 'lucide-react'
import RichText from '@/components/RichText'
import { PostCard, type PostCardData } from '@/components/blog/PostCard'
import type { Post } from '@/payload-types'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

export type RelatedPostsProps = {
  className?: string
  docs?: (Post | string)[]
  introContent?: DefaultTypedEditorState
}

export const RelatedPosts: React.FC<RelatedPostsProps> = ({ className, docs, introContent }) => {
  const validDocs = (docs || []).filter((d): d is Post => typeof d === 'object' && d !== null)

  if (validDocs.length === 0 && !introContent) return null

  return (
    <section className={cn('w-full space-y-6', className)} aria-label="Artikel Terkait">
      {introContent ? (
        <RichText data={introContent} enableGutter={false} />
      ) : (
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <Sparkles className="h-4 w-4 text-brand" />
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-forest tracking-tight">
            Artikel Terkait Lainnya
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {validDocs.map((doc) => {
          const cardData: PostCardData = {
            slug: doc.slug,
            title: doc.title,
            category:
              (Array.isArray(doc.categories) &&
                typeof doc.categories[0] === 'object' &&
                doc.categories[0]?.title) ||
              null,
            publishedAt: doc.publishedAt ?? null,
            readMinutes: 4,
            excerpt: doc.meta?.description ?? null,
          }

          return <PostCard key={doc.slug} post={cardData} />
        })}
      </div>
    </section>
  )
}
