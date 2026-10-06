import React from 'react'

import { cn } from '@/utilities/ui'

/** Bar aksi sticky di bawah viewport (AddBar detail, bar checkout) — mobile. */
export const StickyBar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-white/90 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md shadow-lg',
      'lg:hidden',
      className,
    )}
  >
    <div className="container">{children}</div>
  </div>
)
