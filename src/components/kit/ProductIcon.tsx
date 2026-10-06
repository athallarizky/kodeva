import {
  CloudUpload,
  FileText,
  MessageCircleMore,
  ReceiptText,
  Store,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/ui'

/** Map slug produk → ikon lucide (desain katalog/detail kodeva-ui). */
const ICONS: Record<string, LucideIcon> = {
  'kodeva-kasir': Store,
  'kodeva-hr-payroll': UsersRound,
  'kodeva-invoice-pro': FileText,
  'kodeva-backup-cloud': CloudUpload,
  'kodeva-wa-notifier': MessageCircleMore,
  'kodeva-e-faktur': ReceiptText,
}

const FALLBACK: Record<string, LucideIcon> = {
  kasir: Store,
  hr: UsersRound,
  addon: FileText,
}

/** Tile ikon produk — hijau muda, ikon forest. */
export const ProductIcon: React.FC<{ slug?: string; category?: string; className?: string }> = ({
  slug,
  category,
  className,
}) => {
  const Icon = (slug && ICONS[slug]) || FALLBACK[category ?? ''] || FileText
  return (
    <span
      className={cn(
        'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-tint-2 text-forest',
        className,
      )}
    >
      <Icon className="h-[20px] w-[20px]" strokeWidth={2} />
    </span>
  )
}

export function productIcon(slug?: string, category?: string): LucideIcon {
  return (slug && ICONS[slug]) || FALLBACK[category ?? ''] || FileText
}
