import Link from 'next/link'
import React from 'react'

import { Chip } from '@/components/kit/Chip'
import { PriceRow } from '@/components/kit/PriceRow'
import { ProductIcon } from '@/components/kit/ProductIcon'
import type { ProductDTO } from './types'

/** Kartu produk katalog — ikon tile + kuota promo + harga coret (desain katalog). */
export const ProductCard: React.FC<{ product: ProductDTO }> = ({ product }) => {
  const basic = product.packages.basic
  const promoActive = product.promo.active && product.promo.remaining > 0

  const isPopular = product.slug === 'kodeva-kasir'

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group relative flex flex-col justify-between gap-3 rounded-[18px] bg-white p-3.5 border border-line/70 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.99]"
    >
      <div className="flex flex-col gap-2.5">
        <div className="relative flex h-[100px] items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-b from-tint/90 to-tint-2/40 border border-line/50 transition-all duration-300 group-hover:from-tint group-hover:to-tint-2/70">
          <ProductIcon
            slug={product.slug}
            category={product.category}
            className="h-[48px] w-[48px] rounded-[14px] bg-white shadow-2xs transition-transform duration-300 group-hover:scale-108"
          />
          {isPopular ? (
            <span className="absolute top-2 right-2 rounded-full bg-forest text-white px-2 py-0.5 text-[9.5px] font-bold tracking-wider uppercase shadow-2xs">
              Terlaris
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[14.5px] font-bold leading-snug text-forest transition-colors duration-150 group-hover:text-brand">
            {product.name}
          </h3>
          {product.tagline ? (
            <p className="line-clamp-2 text-[11.5px] leading-relaxed text-pine/80">{product.tagline}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-1 border-t border-line/40">
        {promoActive ? (
          <Chip
            active={false}
            className="w-fit cursor-pointer border border-line/60 px-2 py-0.5 text-[10px] font-medium"
            tabIndex={-1}
          >
            Sisa {product.promo.remaining} lisensi promo
          </Chip>
        ) : null}
        <div className="flex items-center justify-between">
          <div className="tabular-nums">
            <PriceRow price={basic.monthly} original={promoActive ? basic.originalMonthly : null} suffix="/bln" />
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-brand transition-colors duration-150 group-hover:text-forest">
            Lihat
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
