import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Product } from '../../../payload-types'

// Tag dipakai sisi baca: payload.find({ next: { tags: ['products'] } }) — api-contract.md §6
export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateTag('products', 'max')
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Product> = ({ req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('products', 'max')
  }
}
