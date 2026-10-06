import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Voucher } from '../../../payload-types'

export const revalidateVoucher: CollectionAfterChangeHook<Voucher> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateTag('vouchers', 'max')
  }

  return doc
}
