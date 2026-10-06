import React from 'react'
import Link from 'next/link'

import type { FeaturedProductsBlock as FeaturedProductsBlockProps } from '@/payload-types'
import type { Product } from '@/payload-types'
import { Media } from '@/components/Media'
import { formatIDRShort, formatIDR } from '@/lib/format'

const ProductCard: React.FC<{ product: Product; showPrices: boolean }> = ({ product, showPrices }) => {
  const basic = product.packages?.basic
  const original = basic?.originalPriceMonthly
  const promo = product.promoQuota
  const promoActive = promo?.active && (promo.remaining ?? 0) > 0
  const image = product.features?.find((f) => f.image && typeof f.image !== 'string')?.image

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="border-border bg-card hover:border-primary/40 flex flex-col overflow-hidden rounded-lg border transition-colors"
    >
      <div className="bg-muted relative aspect-[8/5] w-full overflow-hidden">
        {image && typeof image !== 'string' ? (
          <Media
            resource={image}
            imgClassName="h-full w-full object-cover"
            size="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">Kodeva</div>
        )}
        {promoActive && (
          <span className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-medium">
            Sisa {promo.remaining} lisensi promo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold">{product.name}</h3>
        {product.tagline && <p className="text-muted-foreground line-clamp-2 text-sm">{product.tagline}</p>}
        {showPrices && basic && (
          <p className="mt-auto pt-2 text-sm">
            mulai{' '}
            <span className="text-primary font-semibold">{formatIDRShort(basic.priceMonthly)}</span>
            <span className="text-muted-foreground">/lisensi/bln</span>
            {promoActive && original ? (
              <span className="text-muted-foreground ml-2 line-through">{formatIDRShort(original)}</span>
            ) : null}
          </p>
        )}
      </div>
    </Link>
  )
}

export const FeaturedProductsBlock: React.FC<FeaturedProductsBlockProps> = ({ title, products, showPrices }) => {
  const items = (products || []).filter((p): p is Product => typeof p !== 'number' && typeof p !== 'string')
  if (!items.length) return null

  return (
    <div className="container">
      {title && <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} showPrices={showPrices !== false} />
        ))}
      </div>
    </div>
  )
}
