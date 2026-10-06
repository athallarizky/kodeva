// Pure functions kuota — data-design.md §4. INVARIANT INTI:
// TOTAL lisensi per produk di seluruh keranjang ≤ promoQuota.remaining
// (bukan per baris!) — 1 lisensi = 1 unit kuota, berapa pun durasi/paketnya.
// Enforcement points: add-to-cart · qty change · rehidrasi · checkout submit.
import type { CartLine } from './cart/types'

export interface QuotaEntry {
  remaining: number
  active: boolean
}

/** index kuota per productId — dibangun dari produk di DB */
export type QuotaIndex = Record<number, QuotaEntry>

export interface QuotaViolation {
  productId: number
  used: number
  remaining: number
  excess: number
}

export interface QuotaResult {
  ok: boolean
  violations: QuotaViolation[]
}

/** Σ qty semua baris dengan productId sama (lintas paket & durasi) */
export function quotaUsageFor(cart: CartLine[], productId: number): number {
  return cart.filter((l) => l.productId === productId).reduce((sum, l) => sum + l.qty, 0)
}

/**
 * Maksimum lisensi yang masih bisa ditambahkan untuk produk ini.
 * Promo tidak aktif → tanpa batas (Infinity); tidak ada di index → 0 (defensif:
 * produk tak dikenal dianggap habis, bukan bocor).
 */
export function maxAddableFor(cart: CartLine[], index: QuotaIndex, productId: number): number {
  const entry = index[productId]
  if (!entry) return 0
  if (!entry.active) return Infinity
  const usage = quotaUsageFor(cart, productId)
  return Math.max(0, entry.remaining - usage)
}

/** Validasi seluruh keranjang terhadap index kuota (dipakai checkout & rehidrasi) */
export function validateCartAgainstQuota(cart: CartLine[], index: QuotaIndex): QuotaResult {
  const productIds = [...new Set(cart.map((l) => l.productId))]
  const violations: QuotaViolation[] = []

  for (const productId of productIds) {
    const entry = index[productId]
    if (!entry || !entry.active) continue // tak dikenal/tidak aktif → tidak divalidasi
    const used = quotaUsageFor(cart, productId)
    if (used > entry.remaining) {
      violations.push({
        productId,
        used,
        remaining: entry.remaining,
        excess: used - entry.remaining,
      })
    }
  }

  return { ok: violations.length === 0, violations }
}

/** Bangun QuotaIndex dari dokumen products hasil query DB */
export function buildQuotaIndex(
  products: { id: number; promoQuota?: { remaining: number; active?: boolean | null } | null }[],
): QuotaIndex {
  const index: QuotaIndex = {}
  for (const p of products) {
    if (p.promoQuota) {
      index[p.id] = {
        remaining: p.promoQuota.remaining,
        active: p.promoQuota.active !== false,
      }
    }
  }
  return index
}
