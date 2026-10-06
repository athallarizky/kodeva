import React from 'react'

import { cn } from '@/utilities/ui'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Chip pill filter — aktif: forest; tidak: putih outline. */
export const Chip: React.FC<ChipProps> = ({ active, className, children, ...rest }) => (
  <button
    type="button"
    className={cn(
      'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium leading-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.97]',
      active
        ? 'bg-forest text-white shadow-2xs border border-forest font-semibold'
        : 'bg-white text-forest border border-line hover:border-brand/30 hover:bg-tint/50',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)
