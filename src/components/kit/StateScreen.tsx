import React from 'react'

import { cn } from '@/utilities/ui'
import { Button } from './Button'

type Tone = 'default' | 'warn' | 'danger'

const tones: Record<Tone, string> = {
  default: 'bg-tint text-brand',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
}

interface StateScreenProps {
  icon: React.ReactNode
  tone?: Tone
  title: string
  desc?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  children?: React.ReactNode
}

/** State kosong / error / gagal — pola MiniIcon+Title+Desc+Btn dari states.html. */
export const StateScreen: React.FC<StateScreenProps> = ({
  icon,
  tone = 'default',
  title,
  desc,
  actionLabel,
  onAction,
  actionHref,
  children,
}) => (
  <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white/70 p-8 text-center backdrop-blur-xs shadow-2xs sm:p-12">
    <span className={cn('mb-2 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xs ring-4 ring-tint/50', tones[tone])}>
      {icon}
    </span>
    <h2 className="font-display text-[17px] sm:text-[19px] font-bold text-forest tracking-tight">{title}</h2>
    {desc ? <p className="mt-1 max-w-[340px] text-[12.5px] sm:text-[13px] leading-relaxed text-pine/80">{desc}</p> : null}
    {actionLabel ? (
      <Button variant="primary" className="mt-4 active:scale-[0.98]" onClick={onAction} href={actionHref} arrow={false}>
        {actionLabel}
      </Button>
    ) : null}
    {children ? <div className="mt-5 w-full">{children}</div> : null}
  </div>
)
