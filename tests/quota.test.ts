// Test invariant inti — data-design.md §4 (contoh kerja WAJIB lolos persis).
import { describe, expect, it } from 'vitest'

import type { CartLine } from '@/lib/cart/types'
import { buildQuotaIndex, maxAddableFor, quotaUsageFor, validateCartAgainstQuota, type QuotaIndex } from '@/lib/quota'

const line = (productId: number, pkg: CartLine['package'], qty: number, duration: CartLine['duration'] = 'monthly'): CartLine => ({
  productId,
  slug: `produk-${productId}`,
  name: `Produk ${productId}`,
  package: pkg,
  duration,
  qty,
  unitPriceSnapshot: 100000,
})

// Contoh kerja data-design §4:
// Cart: [Kasir basic×3, Kasir pro×2, HR basic×5] · kasir remaining 50 · hr remaining 30
const cart = [line(1, 'basic', 3), line(1, 'pro', 2), line(2, 'basic', 5)]
const index: QuotaIndex = {
  1: { remaining: 50, active: true },
  2: { remaining: 30, active: true },
}

describe('quotaUsageFor — agregat lintas paket (bukan per baris)', () => {
  it('menjumlahkan qty semua baris produk sama, lintas paket', () => {
    expect(quotaUsageFor(cart, 1)).toBe(5) // 3 basic + 2 pro
    expect(quotaUsageFor(cart, 2)).toBe(5)
  })

  it('durasi berbeda tetap 1 unit per lisensi (yearly dihitung sama)', () => {
    const mixed = [line(1, 'basic', 2), line(1, 'pro', 3, 'yearly')]
    expect(quotaUsageFor(mixed, 1)).toBe(5)
  })
})

describe('maxAddableFor', () => {
  it('remaining − usage (contoh kerja: kasir 50−5=45)', () => {
    expect(maxAddableFor(cart, index, 1)).toBe(45)
  })

  it('promo tidak aktif → tanpa batas', () => {
    const idx = { 1: { remaining: 0, active: false } }
    expect(maxAddableFor([line(1, 'basic', 999)], idx, 1)).toBe(Infinity)
  })

  it('produk tak dikenal → 0 (defensif)', () => {
    expect(maxAddableFor(cart, {}, 999)).toBe(0)
  })

  it('kuota habis → 0', () => {
    expect(maxAddableFor([line(1, 'basic', 50)], index, 1)).toBe(0)
  })
})

describe('validateCartAgainstQuota — stale data', () => {
  it('cart valid → ok tanpa violation', () => {
    const r = validateCartAgainstQuota(cart, index)
    expect(r.ok).toBe(true)
    expect(r.violations).toHaveLength(0)
  })

  it('stale: DB turun ke 4 → usage 5 melanggar, excess 1 (JANGAN auto-clamp)', () => {
    const stale = { ...index, 1: { remaining: 4, active: true } }
    const r = validateCartAgainstQuota(cart, stale)
    expect(r.ok).toBe(false)
    expect(r.violations).toEqual([{ productId: 1, used: 5, remaining: 4, excess: 1 }])
  })

  it('promo tidak aktif → tidak divalidasi', () => {
    const idx = { 1: { remaining: 0, active: false } }
    expect(validateCartAgainstQuota([line(1, 'basic', 100)], idx).ok).toBe(true)
  })
})

describe('buildQuotaIndex', () => {
  it('dari dokumen products; active default true', () => {
    const idx = buildQuotaIndex([
      { id: 1, promoQuota: { remaining: 10, active: false } },
      { id: 2, promoQuota: { remaining: 7 } },
      { id: 3, promoQuota: null },
    ])
    expect(idx[1]).toEqual({ remaining: 10, active: false })
    expect(idx[2]).toEqual({ remaining: 7, active: true })
    expect(idx[3]).toBeUndefined()
  })
})
