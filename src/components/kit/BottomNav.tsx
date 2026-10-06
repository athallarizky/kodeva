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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden shadow-lg">
      <Link
        href="/produk"
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-1 min-h-[50px] py-2 text-[11px] transition-colors active:scale-95',
          onKatalog ? 'text-forest font-semibold' : 'text-sage hover:text-forest',
        )}
      >
        <Store className={cn('h-5 w-5 transition-transform', onKatalog ? 'text-brand stroke-[2.2]' : 'text-sage')} />
        <span>Katalog</span>
      </Link>
      <Link
        href="/keranjang"
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[50px] py-2 text-[11px] transition-colors active:scale-95',
          onKeranjang ? 'text-forest font-semibold' : 'text-sage hover:text-forest',
        )}
      >
        <ShoppingCart className={cn('h-5 w-5 transition-transform', onKeranjang ? 'text-brand stroke-[2.2]' : 'text-sage')} />
        <span>Keranjang</span>
        {count > 0 ? (
          <span className="absolute right-[calc(50%-22px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold leading-none text-white shadow-2xs">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </Link>
    </nav>
  )
}
