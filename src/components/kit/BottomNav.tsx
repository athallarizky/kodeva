'use client'

import { Store, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'
import { cartCount, useCartStore } from '@/lib/cart/store'

const SHOP_ROUTES = [/^\/produk/, /^\/keranjang$/]

/** Bottom nav 2 tab (Katalog · Keranjang) — mobile-only, area shop (ux-flow §2). */
export const BottomNav: React.FC = () => {
  const pathname = usePathname()
  const lines = useCartStore((s) => s.lines)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const count = hasHydrated ? cartCount(lines) : 0

  if (!SHOP_ROUTES.some((re) => re.test(pathname))) return null

  const onKatalog = pathname === '/produk' || pathname.startsWith('/produk/')
  const onKeranjang = pathname === '/keranjang'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Link
        href="/produk"
        className={cn(
          'flex flex-1 flex-col items-center gap-[3px] py-[9px] text-[10.5px]',
          onKatalog ? 'text-forest' : 'text-sage',
        )}
      >
        <Store className="h-[19px] w-[19px]" />
        Katalog
      </Link>
      <Link
        href="/keranjang"
        className={cn(
          'relative flex flex-1 flex-col items-center gap-[3px] py-[9px] text-[10.5px]',
          onKeranjang ? 'text-forest' : 'text-sage',
        )}
      >
        <ShoppingCart className="h-[19px] w-[19px]" />
        Keranjang
        {count > 0 ? (
          <span className="absolute right-[calc(50%-24px)] top-[5px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </Link>
    </nav>
  )
}
