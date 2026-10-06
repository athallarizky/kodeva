'use client'

import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Flame,
  Info,
  Lock,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { ProductIcon } from '@/components/kit/ProductIcon'
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

const POPULAR_RECOMMENDATIONS = [
  { name: 'Kodeva Kasir', href: '/produk/kodeva-kasir' },
  { name: 'HR & Payroll', href: '/produk/kodeva-hr-payroll' },
  { name: 'WhatsApp Notifier', href: '/produk/kodeva-wa-notifier' },
  { name: 'Invoice Pro', href: '/produk/kodeva-invoice-pro' },
]

export default function KeranjangPage() {
  const lines = useCartStore((s) => s.lines)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const setQty = useCartStore((s) => s.setQty)
  const removeLine = useCartStore((s) => s.removeLine)
  const reconcile = useCartStore((s) => s.reconcile)

  const [quotaIndex, setQuotaIndex] = useState<QuotaIndex | null>(null)
  const [droppedNotice, setDroppedNotice] = useState(0)

  // Ambil data produk segar dari API publik → QuotaIndex + drop baris yatim (ux-flow §6)
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
      <main className="bg-page min-h-[calc(100vh-140px)] py-8">
        <div className="container flex flex-col gap-6 max-w-4xl">
          <div className="h-8 w-48 rounded-full bg-skeleton/70 animate-pulse" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-7">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="lg:col-span-5">
              <div className="h-64 rounded-2xl bg-white/70 p-6 border border-line/60 animate-pulse shadow-card" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (lines.length === 0) {
    return (
      <main className="bg-page min-h-[calc(100vh-140px)] py-12 flex items-center justify-center">
        <div className="container max-w-lg">
          <StateScreen
            icon={<ShoppingBasket className="h-7 w-7 text-brand" />}
            title="Keranjang Belanja Masih Kosong"
            desc="Belum ada lisensi atau modul yang dipilih. Temukan solusi kasir, HR, atau add-on yang cocok untuk operasional bisnismu."
            actionLabel="Jelajahi Katalog Produk"
            actionHref="/produk"
          >
            <div className="flex flex-col items-center gap-2 pt-2">
              <span className="text-[11.5px] font-medium text-sage">Rekomendasi modul populer:</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {POPULAR_RECOMMENDATIONS.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-medium text-forest shadow-2xs transition-all hover:border-brand/40 hover:bg-tint/50 active:scale-95"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </StateScreen>
        </div>
      </main>
    )
  }

  const violationBy = new Map(violations.map((v) => [v.productId, v]))

  return (
    <main className="relative bg-page min-h-[calc(100vh-140px)] pb-32 pt-4 sm:pt-6 md:pb-16">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 bg-radial from-tint/60 via-transparent to-transparent blur-3xl opacity-60"
      />

      <div className="container flex flex-col gap-6">
        {/* Header Breadcrumb & Title */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-sage">
            <Link
              href="/produk"
              className="hover:text-forest transition-colors inline-flex items-center gap-1 font-medium"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Katalog</span>
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-forest font-semibold">Keranjang</span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
                Keranjang Belanja
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-white/90 px-3 py-1 text-xs font-semibold text-forest shadow-2xs tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span>
                {cartCount(lines)} lisensi • {lines.length} modul
              </span>
            </span>
          </div>
        </header>

        {/* Dropped Product Notice */}
        {droppedNotice > 0 ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn-bg p-3.5 text-xs text-warn shadow-2xs">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{droppedNotice} produk sudah tidak tersedia dan otomatis dihapus dari keranjangmu.</span>
          </div>
        ) : null}

        {/* Quota Violation Alert */}
        {locked ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-warn/40 bg-warn-bg p-3.5 text-xs text-warn shadow-2xs">
            <Flame className="h-4 w-4 shrink-0 mt-0.5 text-warn" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <strong className="font-semibold">Kuota promo terbatas berubah:</strong>
              <p className="leading-relaxed break-words">
                {violations
                  .map((v) => {
                    const name = lines.find((l) => l.productId === v.productId)?.name ?? `#${v.productId}`
                    return `${name}: di keranjang ${v.used}, sisa kuota promo ${v.remaining}`
                  })
                  .join('; ')}
                . Silakan kurangi jumlah lisensi agar dapat melanjutkan checkout.
              </p>
            </div>
          </div>
        ) : null}

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Left Column: Cart Items List */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="flex flex-col gap-3">
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
                    className="flex flex-col gap-3.5 rounded-2xl border border-line/70 bg-white p-4 sm:p-5 shadow-card transition-all duration-200 hover:border-brand/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <ProductIcon slug={line.slug} className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-2xs shrink-0" />
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <Link
                            href={`/produk/${line.slug}`}
                            className="font-display text-[14px] sm:text-base font-bold text-forest transition-colors hover:text-brand truncate block"
                          >
                            {line.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-pine/80">
                            <span className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-semibold text-forest shrink-0">
                              {PKG_LABEL[line.package]}
                            </span>
                            <span className="rounded-md bg-page px-2 py-0.5 text-[11px] font-medium text-sage border border-line/50 shrink-0">
                              {DUR_LABEL[line.duration]}
                            </span>
                            <span className="text-[11.5px] tabular-nums shrink-0">
                              {formatIDR(line.unitPriceSnapshot)}/lisensi
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Hapus ${line.name} dari keranjang`}
                        onClick={() => removeLine(key)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sage border border-transparent transition-all hover:bg-danger-bg hover:text-danger hover:border-danger/20 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-3">
                      <QtyStepper
                        size="sm"
                        value={line.qty}
                        onChange={(v) => setQty(key, v, quotaIndex)}
                        max={maxForLine}
                        maxLabel={v || maxForLine === line.qty ? `Maks ${maxForLine} (kuota sisa)` : null}
                      />
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-sage tabular-nums">
                          {line.qty} × {formatIDR(line.unitPriceSnapshot)}
                        </span>
                        <span className="font-display text-base sm:text-lg font-bold text-forest tabular-nums">
                          {formatIDR(line.unitPriceSnapshot * line.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Back to Catalog Action */}
            <div className="flex items-center justify-between pt-1">
              <Link
                href="/produk"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <span>+ Tambah modul atau lisensi lain</span>
              </Link>
            </div>

            {/* Reassurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-line/50 bg-white/70 p-3.5 shadow-2xs">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs">
                  <strong className="font-semibold text-forest">Garansi 14 Hari</strong>
                  <span className="text-sage leading-normal">Pengembalian dana penuh jika modul tidak sesuai.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-line/50 bg-white/70 p-3.5 shadow-2xs">
                <Zap className="h-4 w-4 shrink-0 text-brand mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs">
                  <strong className="font-semibold text-forest">Aktivasi Otomatis</strong>
                  <span className="text-sage leading-normal">Kunci lisensi aktif instan begitu bayar selesai.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="flex flex-col gap-4 rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between border-b border-line/50 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-brand" />
                  <h2 className="font-display text-base font-bold text-forest">
                    Ringkasan Pesanan
                  </h2>
                </div>
                <span className="text-xs text-sage tabular-nums">
                  {cartCount(lines)} lisensi
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <SummaryRow label="Subtotal Lisensi" value={formatIDR(itemsSubtotal)} />
                <p className="text-[11px] leading-relaxed text-sage">
                  Diskon voucher atau kode promo akan dihitung otomatis pada tahap checkout.
                </p>
              </div>

              <div className="border-t border-line/60 pt-3">
                <SummaryRow
                  label="Total Pembayaran"
                  value={formatIDR(itemsSubtotal)}
                  emphasis
                />
              </div>

              {locked ? (
                <Button variant="disabled" className="w-full justify-center py-3.5 text-xs sm:text-sm font-semibold" disabled>
                  Checkout Terkunci — Kurangi Kuota Dahulu
                </Button>
              ) : (
                <Button
                  href="/checkout"
                  arrow
                  className="w-full justify-center py-3.5 text-sm font-semibold shadow-xs active:scale-[0.98]"
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
                  Lanjut ke Checkout
                </Button>
              )}

              <div className="flex flex-col gap-2 border-t border-line/40 pt-3 text-[11px] text-sage">
                <div className="flex items-center gap-1.5 text-pine/80 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                  <span>Harga promo dikunci saat item berada di keranjang.</span>
                </div>
                <div className="flex items-center gap-1.5 text-pine/80 font-medium">
                  <Lock className="h-3.5 w-3.5 text-brand" />
                  <span>Enkripsi pembayaran aman via Midtrans &amp; QRIS.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

