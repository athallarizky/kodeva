import React from 'react'

import { formatIDRShort } from '@/lib/format'

/** Harga promo + harga asli dicoret (desain PriceRow katalog/detail). */
export const PriceRow: React.FC<{ price: number; original?: number | null; suffix?: string; size?: 'sm' | 'lg' }> = ({
  price,
  original,
  suffix = '/bln',
  size = 'sm',
}) => (
  <span className="flex items-baseline gap-[6px]">
    <span className={size === 'lg' ? 'text-[19px] font-bold text-forest' : 'text-[14px] font-bold text-forest'}>
      {formatIDRShort(price)}
      {suffix ? <span className="font-normal text-sage"> {suffix}</span> : null}
    </span>
    {original && original > price ? (
      <span className="text-[11px] text-sage line-through">{formatIDRShort(original)}</span>
    ) : null}
  </span>
)
