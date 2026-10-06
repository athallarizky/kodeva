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
      className="flex w-full gap-1 rounded-full bg-tint/80 p-1 border border-line/50"
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
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium leading-none transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              active
                ? 'bg-white text-forest font-semibold shadow-xs border border-line/40'
                : 'text-sage hover:text-forest hover:bg-white/40',
            )}
          >
            <span className="capitalize">{opt.label}</span>
            {opt.badge ? (
              <span className="rounded-full bg-forest text-white px-2 py-0.5 text-[9.5px] font-bold tracking-tight shadow-2xs">
                {opt.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
