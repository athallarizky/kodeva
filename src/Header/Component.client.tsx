'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { BrandLogo } from '@/components/kit/BrandLogo'
import { CartBadge } from '@/components/kit/CartBadge'
import { PromoBanner } from '@/components/kit/PromoBanner'

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
      className="sticky top-0 z-30 w-full border-b border-line bg-white/95 backdrop-blur"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      {isLanding ? <PromoBanner /> : null}
      <div className="container flex h-[60px] items-center justify-between gap-4">
        <BrandLogo />
        <div className="flex items-center gap-[18px]">
          <nav className="flex items-center gap-[18px]" aria-label="Navigasi utama">
            {navItems.map(({ link }, i) => {
              const href = link?.url || '#'
              return (
                <Link
                  key={i}
                  href={href}
                  className="text-[13.5px] leading-none text-forest hover:text-brand"
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
