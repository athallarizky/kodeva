'use client'

import { Minus, Plus } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/ui'

interface QtyStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** batas kuota untuk hint visual ( tombol + disabled bila menyentuh max ) */
  maxLabel?: string | null
  size?: 'sm' | 'md'
}

/** Stepper lisensi − / + (desain QtyStepper detail & keranjang). */
export const QtyStepper: React.FC<QtyStepperProps> = ({ value, onChange, min = 1, max, maxLabel, size = 'md' }) => {
  const atMax = typeof max === 'number' && value >= max
  const atMin = value <= min
  const btn =
    'flex items-center justify-center rounded-full border border-line text-forest bg-white hover:bg-tint active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 shadow-2xs'
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Kurangi lisensi"
          className={cn(btn, dim)}
          disabled={atMin}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className={icon} />
        </button>
        <span className="min-w-[70px] text-center text-[13.5px] font-semibold text-forest tabular-nums">
          {value} lisensi
        </span>
        <button
          type="button"
          aria-label="Tambah lisensi"
          className={cn(btn, dim)}
          disabled={atMax}
          onClick={() => onChange(value + 1)}
        >
          <Plus className={icon} />
        </button>
      </div>
      {maxLabel ? <span className="text-[11.5px] font-medium text-warn">{maxLabel}</span> : null}
    </div>
  )
}
