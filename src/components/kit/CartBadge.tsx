'use client'

import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cartCount, useCartStore } from '@/lib/cart/store'

/** Tombol cart + badge Σqty — render 0 sebelum hydrate (anti-flash, ux-flow §2). */
export const CartBadge: React.FC = () => {
  const lines = useCartStore((s) => s.lines)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const count = hasHydrated ? cartCount(lines) : 0

  return (
    <Link
      href="/keranjang"
      aria-label={`Keranjang — ${count} lisensi`}
      className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint"
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {count > 0 ? (
        <span className="absolute -right-[5px] -top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
