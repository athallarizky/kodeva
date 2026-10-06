import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

type Variant = 'primary' | 'outline' | 'disabled'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full text-[14px] leading-none whitespace-nowrap transition-colors px-[22px] py-[13px]'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-forest active:bg-forest',
  outline: 'text-forest outline outline-1 outline-line outline-offset-[-0.5px] bg-white hover:bg-tint',
  disabled: 'bg-disabled text-white cursor-not-allowed',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** tampilkan panah kanan (desain BtnPrimary) */
  arrow?: boolean
  href?: string
}

/** Button pill kodeva — primary #2D5E3A / outline / disabled; `href` → render <Link>. */
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', arrow, href, className, children, ...rest }) => {
  const cls = cn(base, variants[variant], className)
  if (href && variant !== 'disabled') {
    return (
      <Link href={href} className={cls}>
        {children}
        {arrow ? <ArrowRight className="h-[15px] w-[15px]" /> : null}
      </Link>
    )
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
      {arrow ? <ArrowRight className="h-[15px] w-[15px]" /> : null}
    </button>
  )
}
