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
    'flex items-center justify-center rounded-full outline outline-1 outline-line outline-offset-[-0.5px] text-forest bg-white hover:bg-tint disabled:opacity-40 disabled:hover:bg-white'
  const dim = size === 'sm' ? 'h-[26px] w-[26px]' : 'h-[30px] w-[30px]'
  const icon = size === 'sm' ? 'h-[13px] w-[13px]' : 'h-[15px] w-[15px]'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          aria-label="Kurangi lisensi"
          className={cn(btn, dim)}
          disabled={atMin}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className={icon} />
        </button>
        <span className="min-w-[64px] text-center text-[13px] text-forest">
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
      {maxLabel ? <span className="text-[11px] text-warn">{maxLabel}</span> : null}
    </div>
  )
}
