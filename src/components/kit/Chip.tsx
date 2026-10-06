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
      'shrink-0 rounded-full px-[14px] py-[8px] text-[12.5px] leading-none transition-colors',
      active ? 'bg-forest text-white' : 'bg-white text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)
