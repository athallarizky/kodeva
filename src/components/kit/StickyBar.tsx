import React from 'react'

import { cn } from '@/utilities/ui'

/** Bar aksi sticky di bawah viewport (AddBar detail, bar checkout) — mobile. */
export const StickyBar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-[16px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-[12px] backdrop-blur',
      'md:static md:mb-6 md:rounded-[14px] md:border md:border-line md:px-[18px] md:py-[14px] md:shadow-card',
      className,
    )}
  >
    <div className="container md:max-w-none md:p-0">{children}</div>
  </div>
)
