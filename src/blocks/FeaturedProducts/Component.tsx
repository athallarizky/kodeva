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
      <div className="mb-[14px] flex items-end justify-between">
        {title ? (
          <h2 className="font-display text-[19px] font-bold text-forest md:text-[22px]">{title}</h2>
        ) : (
          <span />
        )}
        <Link
          href="/produk"
          className="flex items-center gap-[4px] text-[12.5px] font-bold text-brand hover:text-forest"
        >
          Lihat semua
          <ArrowRight className="h-[13px] w-[13px]" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-[12px] md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={toProductDTO(product)} />
        ))}
      </div>
      {showPrices === false ? null : null}
    </div>
  )
}
