'use client'

// Cart store — data-design.md §3. zustand + persist (localStorage `kodeva-cart`).
// INVARIANT: badge cart & render hanya setelah `hasHydrated` (anti mismatch SSR).
// Kuota: semua aksi menerima QuotaIndex (data server) sebagai parameter —
// store tidak fetch sendiri; enforcement pure functions di lib/quota.
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { AddResult, CartLine, Duration, PackageId } from './types'
import { cartLineKey } from './types'
import { maxAddableFor, quotaUsageFor, type QuotaIndex } from '@/lib/quota'

interface CartState {
  lines: CartLine[]
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void

  /** tambah lisensi — merge baris ber-key sama; clamp bila kuota penuh */
  addItem: (
    product: {
      id: number
      slug: string
      name: string
      packages: Record<PackageId, { priceMonthly: number; priceYearly?: number | null; originalPriceMonthly?: number | null }>
    },
    opts: { pkg: PackageId; duration: Duration; qty: number },
    index: QuotaIndex,
  ) => AddResult

  /** ubah qty baris — clamp ke sisa kuota (user action → hard clamp) */
  setQty: (key: string, qty: number, index: QuotaIndex) => void

  removeLine: (key: string) => void
  /** HANYA saat pembayaran sukses */
  clear: () => void

  /** rehidrasi: drop baris yatim (produk hilang dari DB) */
  reconcile: (validProductIds: number[]) => { dropped: number }
}

function unitPrice(
  product: Parameters<CartState['addItem']>[0],
  pkg: PackageId,
  duration: Duration,
): number {
  return duration === 'yearly' && product.packages[pkg].priceYearly
    ? product.packages[pkg].priceYearly
    : product.packages[pkg].priceMonthly
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      addItem: (product, opts, index) => {
        const { lines } = get()
        const key = cartLineKey({ productId: product.id, package: opts.pkg, duration: opts.duration })
        const existing = lines.find((l) => cartLineKey(l) === key)
        const maxAdd = maxAddableFor(lines, index, product.id)

        if (maxAdd <= 0) return { ok: false, added: 0, reason: 'quota' }

        const want = Math.min(opts.qty, maxAdd)
        const clamped = want < opts.qty

        if (existing) {
          const snapshotPreserved = existing.qty > 0 // snapshot harga dari add pertama dipertahankan
          set({
            lines: lines.map((l) =>
              cartLineKey(l) === key && snapshotPreserved
                ? { ...l, qty: l.qty + want }
                : l,
            ),
          })
        } else {
          const price = unitPrice(product, opts.pkg, opts.duration)
          set({
            lines: [
              ...lines,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                package: opts.pkg,
                duration: opts.duration,
                qty: want,
                unitPriceSnapshot: price,
                originalUnitPriceSnapshot:
                  product.packages[opts.pkg].originalPriceMonthly ?? undefined,
              },
            ],
          })
        }

        return clamped
          ? { ok: true, added: want, clampedTo: want, reason: 'quota' }
          : { ok: true, added: want }
      },

      setQty: (key, qty, index) => {
        const { lines } = get()
        set({
          lines: lines.map((l) => {
            if (cartLineKey(l) !== key) return l
            const next = Math.max(1, qty)
            const entry = index[l.productId]
            if (!entry || !entry.active) return { ...l, qty: next } // tanpa promo → bebas
            // kuota untuk baris ini = remaining − pemakaian baris LAIN
            const others = quotaUsageFor(lines, l.productId) - l.qty
            const maxForLine = Math.max(1, entry.remaining - others)
            return { ...l, qty: Math.min(next, Math.max(1, maxForLine)) }
          }),
        })
      },

      removeLine: (key) =>
        set({ lines: get().lines.filter((l) => cartLineKey(l) !== key) }),

      clear: () => set({ lines: [] }),

      reconcile: (validProductIds) => {
        const { lines } = get()
        const valid = new Set(validProductIds)
        const kept = lines.filter((l) => valid.has(l.productId))
        const dropped = lines.length - kept.length
        if (dropped > 0) set({ lines: kept })
        return { dropped }
      },
    }),
    {
      name: 'kodeva-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }), // HANYA lines yang persist
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

/** Σ qty semua baris — untuk badge cart (render 0 sebelum hydrate) */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0)
}
