'use client'

import { Info, ShieldCheck, ShoppingBasket, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { QtyStepper } from '@/components/kit/QtyStepper'
import { SkeletonCard } from '@/components/kit/SkeletonCard'
import { StateScreen } from '@/components/kit/StateScreen'
import { SummaryRow } from '@/components/kit/SummaryRow'
import { cartCount, useCartStore } from '@/lib/cart/store'
import { cartLineKey, type CartLine } from '@/lib/cart/types'
import { formatIDR } from '@/lib/format'
import { buildQuotaIndex, validateCartAgainstQuota, type QuotaIndex } from '@/lib/quota'
import { subtotal } from '@/lib/totals'
import { trackBeginCheckout } from '@/lib/tracking'

const PKG_LABEL: Record<CartLine['package'], string> = {
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
}
const DUR_LABEL: Record<CartLine['duration'], string> = {
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

export default function KeranjangPage() {
  const lines = useCartStore((s) => s.lines)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const setQty = useCartStore((s) => s.setQty)
  const removeLine = useCartStore((s) => s.removeLine)
  const reconcile = useCartStore((s) => s.reconcile)

  const [quotaIndex, setQuotaIndex] = useState<QuotaIndex | null>(null)
  const [droppedNotice, setDroppedNotice] = useState(0)

  // ambil data produk segar dari API publik → QuotaIndex + drop baris yatim (ux-flow §6)
  useEffect(() => {
    if (!hasHydrated) return
    let alive = true
    fetch('/api/products?limit=100&depth=0')
      .then((r) => r.json())
      .then((j: { docs?: { id: number; promoQuota?: { remaining: number; active?: boolean | null } | null }[] }) => {
        if (!alive || !j.docs) return
        setQuotaIndex(buildQuotaIndex(j.docs))
        const { dropped } = reconcile(j.docs.map((d) => d.id))
        if (dropped > 0) setDroppedNotice(dropped)
      })
      .catch(() => {
        /* gagal ambil → keranjang tetap tampil, validasi kuota dijaga server saat order */
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated])

  const validation = useMemo(
    () => (quotaIndex ? validateCartAgainstQuota(lines, quotaIndex) : null),
    [lines, quotaIndex],
  )
  const violations = validation?.ok === false ? validation.violations : []
  const locked = violations.length > 0
  const itemsSubtotal = subtotal(lines)

  if (!hasHydrated || !quotaIndex) {
    return (
      <main className="bg-page">
        <div className="container flex flex-col gap-[12px] py-5">
          <div className="h-6 w-40 rounded-full bg-skeleton" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    )
  }

  if (lines.length === 0) {
    return (
      <main className="bg-page">
        <StateScreen
          icon={<ShoppingBasket className="h-[24px] w-[24px]" />}
          title="Keranjangmu masih kosong"
          desc="Isi dengan produk pertamamu →"
          actionLabel="Jelajahi Produk"
          actionHref="/produk"
        />
      </main>
    )
  }

  const violationBy = new Map(violations.map((v) => [v.productId, v]))

  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[14px] pb-24 pt-5 md:pb-10">
        <header className="flex flex-col gap-[6px]">
          <h1 className="font-display text-[22px] font-bold text-forest">Keranjang</h1>
          <p className="text-[12.5px] text-sage">
            {cartCount(lines)} lisensi · {lines.length} produk
          </p>
        </header>

        {droppedNotice > 0 ? (
          <p className="rounded-[10px] bg-warn-bg px-[10px] py-[8px] text-[11.5px] text-warn">
            {droppedNotice} produk sudah tidak tersedia dan dihapus dari keranjangmu.
          </p>
        ) : null}

        {locked ? (
          <div className="flex items-start gap-[8px] rounded-[12px] border border-warn-line bg-warn-bg px-[12px] py-[10px]">
            <Info className="mt-[1px] h-[14px] w-[14px] shrink-0 text-warn" />
            <p className="text-[11.5px] leading-snug text-warn">
              Kuota promo berubah — {violations
                .map((v) => {
                  const name = lines.find((l) => l.productId === v.productId)?.name ?? `#${v.productId}`
                  return `${name}: keranjang ${v.used}, sisa ${v.remaining}`
                })
                .join('; ')}
              . Kurangi lisensi untuk lanjut.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-[10px]">
          {lines.map((line) => {
            const key = cartLineKey(line)
            const v = violationBy.get(line.productId)
            const entry = quotaIndex[line.productId]
            const others = lines
              .filter((l) => l.productId === line.productId && cartLineKey(l) !== key)
              .reduce((n, l) => n + l.qty, 0)
            const maxForLine =
              entry && entry.active ? Math.max(1, entry.remaining - others) : undefined

            return (
              <div
                key={key}
                className="flex flex-col gap-[10px] rounded-[14px] bg-white p-[14px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]"
              >
                <div className="flex items-start justify-between gap-[8px]">
                  <div className="flex flex-col gap-[2px]">
                    <Link href={`/produk/${line.slug}`} className="text-[13.5px] font-bold text-forest hover:text-brand">
                      {line.name}
                    </Link>
                    <span className="text-[11.5px] text-sage">
                      {PKG_LABEL[line.package]} · {DUR_LABEL[line.duration]} ·{' '}
                      {formatIDR(line.unitPriceSnapshot)}/lisensi
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus ${line.name} dari keranjang`}
                    onClick={() => removeLine(key)}
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sage hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <QtyStepper
                    size="sm"
                    value={line.qty}
                    onChange={(v) => setQty(key, v, quotaIndex)}
                    max={maxForLine}
                    maxLabel={v || maxForLine === line.qty ? `Maks ${maxForLine} (kuota sisa)` : null}
                  />
                  <span className="text-[14px] font-bold text-forest">
                    {formatIDR(line.unitPriceSnapshot * line.qty)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-[10px] rounded-[14px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <SummaryRow label="Subtotal" value={formatIDR(itemsSubtotal)} emphasis />
          <p className="text-[10.5px] text-sage">Diskon voucher dihitung di checkout.</p>
          <p className="flex items-center gap-[6px] border-t border-line pt-[10px] text-[10.5px] text-sage">
            <ShieldCheck className="h-[13px] w-[13px]" />
            Harga promo dikunci saat kamu menambahkan ke keranjang.
          </p>
        </div>

        {locked ? (
          <Button variant="disabled" className="w-full" disabled>
            Checkout terkunci — kurangi lisensi{' '}
            {lines.find((l) => l.productId === violations[0]?.productId)?.name ?? 'promo'} dahulu
          </Button>
        ) : (
          <Button
            href="/checkout"
            arrow
            className="w-full"
            onClick={() =>
              trackBeginCheckout(
                lines.map((l) => ({
                  item_id: l.slug,
                  item_name: l.name,
                  item_variant: `${PKG_LABEL[l.package]} · ${DUR_LABEL[l.duration]}`,
                  price: l.unitPriceSnapshot,
                  quantity: l.qty,
                })),
                itemsSubtotal,
              )
            }
          >
            Checkout
          </Button>
        )}
      </div>
    </main>
  )
}
