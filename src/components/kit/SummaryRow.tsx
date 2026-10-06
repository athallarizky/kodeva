import React from 'react'

import { cn } from '@/utilities/ui'

/** Baris ringkasan harga (label kiri, nilai kanan) — SummaryCard keranjang/checkout. */
export const SummaryRow: React.FC<{
  label: string
  value: string
  emphasis?: boolean
  note?: string
  className?: string
}> = ({ label, value, emphasis, note, className }) => (
  <div className={cn('flex items-center justify-between py-1', className)}>
    <span className={cn('text-[13px]', emphasis ? 'font-bold text-forest text-[14px]' : 'text-pine/80')}>
      {label}
    </span>
    <span className="flex flex-col items-end">
      <span
        className={cn(
          'tabular-nums',
          emphasis ? 'text-[17px] sm:text-[18px] font-bold text-forest font-display' : 'text-[13.5px] font-semibold text-forest',
        )}
      >
        {value}
      </span>
      {note ? <span className="text-[11px] text-sage">{note}</span> : null}
    </span>
  </div>
)
