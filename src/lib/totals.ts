// Perhitungan harga + voucher — data-design.md §5. Semua integer rupiah.
// Snapshot harga diambil SAAT add-to-cart; cart & checkout render tanpa fetch ulang.
import type { CartLine } from './cart/types'

export type DiscountType = 'nominal' | 'percent'

export interface VoucherRule {
  code: string
  discountType: DiscountType
  discountValue: number
  minSpend?: number | null
  active?: boolean | null
  expiresAt?: string | null
  usageQuota?: number | null
  usedCount?: number | null
}

export function lineTotal(line: CartLine): number {
  return line.unitPriceSnapshot * line.qty
}

export function subtotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + lineTotal(l), 0)
}

export function isVoucherEligible(v: VoucherRule, cartSubtotal: number): boolean {
  if (v.active === false) return false
  if (v.expiresAt && new Date(v.expiresAt).getTime() < Date.now()) return false
  if (typeof v.minSpend === 'number' && cartSubtotal < v.minSpend) return false
  if (typeof v.usageQuota === 'number' && (v.usedCount ?? 0) >= v.usageQuota) return false
  return true
}

/** Diskon voucher terhadap subtotal — nominal di-cap subtotal, percent di-floor */
export function voucherDiscount(v: VoucherRule, cartSubtotal: number): number {
  if (!isVoucherEligible(v, cartSubtotal)) return 0
  const raw =
    v.discountType === 'percent'
      ? Math.floor((cartSubtotal * v.discountValue) / 100)
      : Math.min(v.discountValue, cartSubtotal)
  return Math.max(0, Math.min(raw, cartSubtotal))
}

/** Total selalu ≥ 0 */
export function total(cart: CartLine[], voucher?: VoucherRule | null): number {
  const s = subtotal(cart)
  const discount = voucher ? voucherDiscount(voucher, s) : 0
  return Math.max(0, s - discount)
}
