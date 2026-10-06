// DTO produk ringan untuk komponen client (serializable, tanpa relasi Media penuh).
import type { Product } from '@/payload-types'
import type { PackageId } from '@/lib/cart/types'

export interface PackagePriceDTO {
  monthly: number
  originalMonthly: number | null
  yearly: number | null
}

export interface ProductDTO {
  id: number
  slug: string
  name: string
  tagline: string | null
  category: 'kasir' | 'hr' | 'addon'
  createdAt: string
  packages: Record<PackageId, PackagePriceDTO>
  promo: { remaining: number; active: boolean }
  features: string[]
}

/** Map dokumen Payload → DTO client (aman untuk dilempar lintas server→client). */
export function toProductDTO(p: Product): ProductDTO {
  const pkg = (pid: PackageId): PackagePriceDTO => {
    const src = p.packages?.[pid]
    return {
      monthly: src?.priceMonthly ?? 0,
      originalMonthly: src?.originalPriceMonthly ?? null,
      yearly: src?.priceYearly ?? null,
    }
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? null,
    category: p.category,
    createdAt: p.createdAt,
    packages: { basic: pkg('basic'), pro: pkg('pro'), business: pkg('business') },
    promo: {
      remaining: p.promoQuota?.remaining ?? 0,
      active: p.promoQuota?.active !== false,
    },
    features: (p.features || []).map((f) => f.title).filter(Boolean),
  }
}
