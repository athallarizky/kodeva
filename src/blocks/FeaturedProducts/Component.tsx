import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { FeaturedProductsBlock as FeaturedProductsBlockProps } from '@/payload-types'
import type { Product } from '@/payload-types'
import { ProductCard } from '@/components/shop/ProductCard'
import { toProductDTO } from '@/components/shop/types'

/** Produk unggulan di landing — kartu desain baru + "Lihat semua". */
export const FeaturedProductsBlock: React.FC<FeaturedProductsBlockProps> = ({
  title,
  products,
  showPrices,
}) => {
  const items = (products || []).filter((p): p is Product => typeof p !== 'number' && typeof p !== 'string')
  if (!items.length) return null

  return (
    <div className="container">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
            Pilihan Modul
          </span>
          {title ? (
            <h2 className="font-display text-[24px] md:text-[28px] font-bold tracking-[-0.025em] text-forest [text-wrap:balance]">
              {title}
            </h2>
          ) : null}
          <p className="text-[13px] md:text-[14px] text-pine/80">
            Mulai dari aplikasi kasir hingga payroll — bayar per lisensi per bulan tanpa kontrak panjang.
          </p>
        </div>
        <Link
          href="/produk"
          className="group inline-flex items-center gap-1.5 self-start py-1 text-[13px] font-bold text-brand transition-colors duration-150 hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md sm:self-end shrink-0"
        >
          Lihat semua modul
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={toProductDTO(product)} />
        ))}
      </div>
      {showPrices === false ? null : null}
    </div>
  )
}
