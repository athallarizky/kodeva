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
  <div className={cn('flex items-center justify-between', className)}>
    <span className={cn('text-[12.5px]', emphasis ? 'font-bold text-forest' : 'text-sage')}>{label}</span>
    <span className="flex flex-col items-end">
      <span className={cn('text-[13px]', emphasis ? 'text-[15px] font-bold text-forest' : 'text-forest')}>
        {value}
      </span>
      {note ? <span className="text-[10.5px] text-sage">{note}</span> : null}
    </span>
  </div>
)
