'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { BrandLogo } from '@/components/kit/BrandLogo'
import { CartBadge } from '@/components/kit/CartBadge'
import { PromoBanner } from '@/components/kit/PromoBanner'

import { cn } from '@/utilities/ui'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const isLanding = pathname === '/'

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const navItems = data?.navItems || []

  return (
    <header
      className="sticky top-0 z-30 w-full border-b border-line/80 bg-white/95 backdrop-blur-md shadow-2xs"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      {isLanding ? <PromoBanner /> : null}
      <div className="container flex h-[62px] items-center justify-between gap-4">
        <BrandLogo />
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Navigasi utama">
            {navItems.map(({ link }, i) => {
              const href = link?.url || '#'
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={i}
                  href={href}
                  className={cn(
                    'text-[13.5px] leading-none transition-colors duration-150 py-1.5 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    isActive
                      ? 'text-brand font-bold bg-tint/60'
                      : 'text-forest hover:text-brand font-medium hover:bg-tint/30',
                  )}
                >
                  {link?.label}
                </Link>
              )
            })}
          </nav>
          <CartBadge />
        </div>
      </div>
    </header>
  )
}
