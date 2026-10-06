// Test perhitungan harga & voucher — data-design.md §5.
import { describe, expect, it } from 'vitest'

import type { CartLine } from '@/lib/cart/types'
import { isVoucherEligible, lineTotal, subtotal, total, voucherDiscount, type VoucherRule } from '@/lib/totals'

const line = (qty: number, price: number, original?: number): CartLine => ({
  productId: 1,
  slug: 'kodeva-kasir',
  name: 'Kodeva Kasir',
  package: 'pro',
  duration: 'monthly',
  qty,
  unitPriceSnapshot: price,
  originalUnitPriceSnapshot: original,
})

const KODEVA50: VoucherRule = { code: 'KODEVA50', discountType: 'nominal', discountValue: 50000, minSpend: 500000, active: true }
const HEMAT10: VoucherRule = { code: 'HEMAT10', discountType: 'percent', discountValue: 10, minSpend: 300000, active: true }

describe('lineTotal & subtotal — snapshot harga saat add', () => {
  it('unitPriceSnapshot × qty (bukan harga DB terkini)', () => {
    expect(lineTotal(line(3, 299000))).toBe(897000)
  })

  it('subtotal menjumlah semua baris', () => {
    expect(subtotal([line(3, 299000), line(5, 199000)])).toBe(1_892_000)
  })
})

describe('voucherDiscount', () => {
  it('nominal: min(value, subtotal)', () => {
    expect(voucherDiscount(KODEVA50, 600_000)).toBe(50_000)
    // cap subtotal diuji dengan voucher TANPA minSpend:
    const noMin: VoucherRule = { code: 'NOMIN', discountType: 'nominal', discountValue: 50_000, active: true }
    expect(voucherDiscount(noMin, 40_000)).toBe(40_000) // di-cap subtotal
  })

  it('nominal: di bawah minSpend → 0', () => {
    expect(voucherDiscount(KODEVA50, 499_000)).toBe(0)
  })

  it('percent: floor ke rupiah', () => {
    expect(voucherDiscount(HEMAT10, 349_000)).toBe(34_900)
    expect(voucherDiscount(HEMAT10, 355_555)).toBe(35_555) // 35555.5 → floor
  })

  it('percent: di bawah minSpend → 0', () => {
    expect(voucherDiscount(HEMAT10, 299_000)).toBe(0)
  })

  it('nonaktif / kedaluwarsa / kuota habis → 0', () => {
    expect(voucherDiscount({ ...KODEVA50, active: false }, 600_000)).toBe(0)
    expect(voucherDiscount({ ...KODEVA50, expiresAt: '2020-01-01T00:00:00Z' }, 600_000)).toBe(0)
    expect(voucherDiscount({ ...KODEVA50, usageQuota: 10, usedCount: 10 }, 600_000)).toBe(0)
  })
})

describe('total', () => {
  it('subtotal − diskon, selalu ≥ 0', () => {
    const cart = [line(3, 299000)] // 897.000
    expect(total(cart, KODEVA50)).toBe(847_000)
    expect(total(cart, null)).toBe(897_000)
  })
})

describe('isVoucherEligible', () => {
  it('syarat lengkap dipisah dari hitung diskon', () => {
    expect(isVoucherEligible(KODEVA50, 500_000)).toBe(true)
    expect(isVoucherEligible(KODEVA50, 499_999)).toBe(false)
  })
})
