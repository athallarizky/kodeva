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

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="flex flex-col gap-[10px] rounded-[14px] bg-white p-[12px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px] transition-shadow hover:shadow-pop"
    >
      <div className="flex h-[92px] items-center justify-center rounded-[10px] bg-tint">
        <ProductIcon slug={product.slug} category={product.category} className="h-[48px] w-[48px] rounded-[13px] bg-white" />
      </div>
      <div className="flex flex-col gap-[3px]">
        <h3 className="text-[13.5px] font-bold leading-tight text-forest">{product.name}</h3>
        {product.tagline ? (
          <p className="line-clamp-2 text-[11.5px] leading-snug text-sage">{product.tagline}</p>
        ) : null}
      </div>
      {promoActive ? (
        <Chip active={false} className="w-fit cursor-pointer px-[10px] py-[5px] text-[10.5px]" tabIndex={-1}>
          Sisa {product.promo.remaining} lisensi promo
        </Chip>
      ) : null}
      <PriceRow price={basic.monthly} original={promoActive ? basic.originalMonthly : null} suffix="/bln" />
    </Link>
  )
}
