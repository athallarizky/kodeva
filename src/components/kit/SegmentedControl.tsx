'use client'

import React from 'react'

import { cn } from '@/utilities/ui'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  badge?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  'aria-label'?: string
}

/** Segmented control pill (paket Basic/Pro/Business & durasi Bulanan/Tahunan). */
export function SegmentedControl<T extends string>({ options, value, onChange, ...rest }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className="flex w-full gap-[6px] rounded-full bg-tint p-[4px]"
      {...rest}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-[6px] rounded-full px-[10px] py-[9px] text-[12.5px] leading-none transition-all',
              active ? 'bg-white text-forest shadow-seg' : 'text-sage hover:text-forest',
            )}
          >
            <span className="capitalize">{opt.label}</span>
            {opt.badge ? (
              <span className="rounded-full bg-tint-2 px-[7px] py-[3px] text-[10px] font-bold text-forest">
                {opt.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
