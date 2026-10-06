import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FaqBlock } from '@/blocks/FAQ/Component'
import { FeaturedProductsBlock } from '@/blocks/FeaturedProducts/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { LeadFormBlock } from '@/blocks/LeadForm/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'

import { cn } from '@/utilities/ui'

const blockComponents = {
  archive: ArchiveBlock,
  banner: BannerBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  faq: FaqBlock,
  'featured-products': FeaturedProductsBlock,
  hero: HeroBlock,
  'lead-form': LeadFormBlock,
  mediaBlock: MediaBlock,
  testimonials: TestimonialsBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              const spacingClass =
                blockType === 'banner'
                  ? 'my-4 md:my-6 first:mt-0'
                  : 'my-12 md:my-16 first:mt-2'

              return (
                <div className={cn(spacingClass)} key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
