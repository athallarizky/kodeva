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
}) => (
  <div className="flex flex-col items-center gap-[10px] px-6 py-12 text-center">
    <span className={cn('flex h-[54px] w-[54px] items-center justify-center rounded-full', tones[tone])}>
      {icon}
    </span>
    <h2 className="font-display text-[17px] font-bold text-forest">{title}</h2>
    {desc ? <p className="max-w-[280px] text-[12.5px] text-sage">{desc}</p> : null}
    {actionLabel ? (
      <Button variant="primary" className="mt-2" onClick={onAction} href={actionHref} arrow={!actionHref ? false : false}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)
