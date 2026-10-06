'use client'

import {
  ArrowRight,
  Check,
  ChevronLeft,
  CircleCheck,
  Flame,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { QtyStepper } from '@/components/kit/QtyStepper'
import { SegmentedControl } from '@/components/kit/SegmentedControl'
import { StickyBar } from '@/components/kit/StickyBar'
import { useCartStore } from '@/lib/cart/store'
import type { Duration, PackageId } from '@/lib/cart/types'
import { formatIDR, formatIDRShort } from '@/lib/format'
import { maxAddableFor, type QuotaIndex } from '@/lib/quota'
import { trackAddToCart, trackViewItem } from '@/lib/tracking'
import type { ProductDTO } from './types'

const PKGS: { value: PackageId; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

const PKG_DESC: Record<PackageId, string> = {
  basic: 'Fitur standar untuk 1 outlet/cabang usaha.',
  pro: 'Paling populer: modul lengkap untuk bisnis berkembang.',
  business: 'Dukungan prioritas respons 2 jam & kapasitas multi-cabang.',
}

const CAT_LABEL: Record<ProductDTO['category'], string> = {
  kasir: 'Kasir',
  hr: 'HR & Payroll',
  addon: 'Add-on',
}

export const ProductDetail: React.FC<{ product: ProductDTO; quotaIndex: QuotaIndex }> = ({
  product,
  quotaIndex,
}) => {
  const addItem = useCartStore((s) => s.addItem)
  const lines = useCartStore((s) => s.lines)

  const [pkg, setPkg] = useState<PackageId>('pro')
  const [duration, setDuration] = useState<Duration>('monthly')
  const [qty, setQty] = useState(1)
  const [flash, setFlash] = useState<string | null>(null)
  const viewed = useRef(false)

  const prices = product.packages[pkg]
  const unit = duration === 'yearly' && prices.yearly ? prices.yearly : prices.monthly
  const unitSuffix = duration === 'monthly' ? '/lisensi/bln' : '/lisensi/thn'
  const original = duration === 'monthly' ? prices.originalMonthly : null

  // Badge hemat tahunan dihitung dari harga vs 12× bulanan
  const yearlySaving = useMemo(() => {
    const y = product.packages[pkg].yearly
    const m = product.packages[pkg].monthly
    if (!y || !m) return null
    const pct = Math.round((1 - y / (m * 12)) * 100)
    return pct > 0 ? `−${pct}%` : null
  }, [product, pkg])

  const promoActive = product.promo.active && product.promo.remaining > 0
  const maxAdd = promoActive ? maxAddableFor(lines, quotaIndex, product.id) : Infinity
  const maxQty = Number.isFinite(maxAdd) ? Math.max(1, maxAdd) : undefined
  const total = unit * qty

  // view_item SEKALI per produk (pengecualian useEffect ber-lisensi, api-contract §4)
  React.useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    trackViewItem({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category,
      price: unit,
      quantity: 1,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onAdd = () => {
    const toPkgInput = (p: ProductDTO['packages'][PackageId]) => ({
      priceMonthly: p.monthly,
      priceYearly: p.yearly,
      originalPriceMonthly: p.originalMonthly,
    })
    const result = addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        packages: {
          basic: toPkgInput(product.packages.basic),
          pro: toPkgInput(product.packages.pro),
          business: toPkgInput(product.packages.business),
        },
      },
      { pkg, duration, qty },
      quotaIndex,
    )
    if (!result.ok) {
      setFlash('Kuota promo sudah habis — tidak bisa menambah lisensi.')
      return
    }
    trackAddToCart(
      { item_id: product.slug, item_name: product.name, item_category: product.category, price: unit, quantity: result.added },
      unit * result.added,
    )
    setFlash(
      result.clampedTo !== undefined
        ? `Ditambahkan ${result.added} lisensi (dipangkas ke sisa kuota promo).`
        : `${result.added} lisensi berhasil ditambahkan ke keranjang ✓`,
    )
  }

  return (
    <div className="relative bg-page pb-28 pt-3 md:pb-16 sm:pt-5">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-80 w-full max-w-5xl -translate-x-1/2 bg-radial from-tint/70 via-transparent to-transparent blur-3xl opacity-60"
      />

      <div className="container flex flex-col gap-6">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/produk"
            aria-label="Kembali ke katalog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-forest border border-line shadow-2xs transition-all hover:bg-tint active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <nav className="flex items-center gap-1.5 text-xs text-sage" aria-label="Breadcrumb">
            <Link href="/produk" className="hover:text-forest transition-colors">
              Katalog
            </Link>
            <span className="opacity-50">/</span>
            <span className="font-medium text-forest">{product.name}</span>
          </nav>
        </div>

        {/* Main Two-Column Grid on Desktop */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Left Column: Visual Gallery + Header + Features + Guarantees */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Gallery / Hero Preview */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/70 shadow-card bg-gradient-to-br from-tint/90 to-tint-2/40">
              <Image
                src="/images/pos-terminal.jpg"
                alt={`${product.name} — tampilan aplikasi`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover transition-transform duration-500 hover:scale-102"
              />
              {/* Overlay badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-forest/90 text-white px-3 py-1 text-[11px] font-semibold backdrop-blur-xs shadow-2xs">
                <Sparkles className="h-3 w-3 text-brand" />
                <span>{CAT_LABEL[product.category]}</span>
                <span className="opacity-60">•</span>
                <span>Lisensi Original</span>
              </div>
              {/* Live capability pill on bottom */}
              <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 rounded-full bg-white/90 text-forest px-3 py-1 text-[11px] font-medium backdrop-blur-xs shadow-2xs border border-line/60">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span>Cloud Sync &amp; Akses Real-Time</span>
              </div>
            </div>

            {/* Product Header / Title & Social Proof */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-tint px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-forest border border-forest/10">
                  {CAT_LABEL[product.category]}
                </span>
                {promoActive ? (
                  <span className="rounded-full bg-warn-bg px-2.5 py-0.5 text-[10.5px] font-bold text-warn border border-warn/20">
                    Promo Terbatas ({product.promo.remaining} lisensi)
                  </span>
                ) : null}
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              {product.tagline ? (
                <p className="text-[13.5px] sm:text-[15px] leading-relaxed text-pine/85">
                  {product.tagline}
                </p>
              ) : null}

              {/* Social Proof & Rating */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-sage">
                <div className="flex items-center gap-1 text-amber-500">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-forest ml-0.5">4.9</span>
                  <span className="text-sage">(312 ulasan)</span>
                </div>
                <span>•</span>
                <span className="font-medium text-forest">2.100+ pengguna aktif</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-brand font-medium">
                  <Check className="h-3 w-3 stroke-[3]" />
                  Terverifikasi
                </span>
              </div>
            </div>

            {/* Fitur & Kemampuan Section */}
            {product.features.length > 0 ? (
              <section className="flex flex-col gap-4 rounded-2xl border border-line/70 bg-white p-5 sm:p-7 shadow-card">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-tint text-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-forest">
                      Ringkasan Fitur &amp; Kemampuan
                    </h2>
                  </div>
                  <p className="text-xs sm:text-[12.5px] text-sage">
                    Dirancang spesifik untuk mempercepat alur transaksi dan menghilangkan pencatatan manual.
                  </p>
                </div>

                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
                  {product.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 rounded-xl border border-line/50 bg-tint/20 p-3 text-[12.5px] sm:text-[13px] text-forest transition-colors hover:bg-tint/40"
                    >
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand stroke-[2.2]" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Garansi & Komitmen Nilai */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5 rounded-xl border border-line/60 bg-white/80 p-4 shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-display text-[13px] font-bold text-forest">Garansi 14 Hari</h3>
                <p className="text-[11.5px] leading-relaxed text-sage">
                  Uang kembali 100% jika modul tidak cocok untuk operasional bisnismu.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-line/60 bg-white/80 p-4 shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-display text-[13px] font-bold text-forest">Aktivasi Instan</h3>
                <p className="text-[11.5px] leading-relaxed text-sage">
                  Kunci lisensi aktif otomatis langsung setelah pembayaran terverifikasi.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-line/60 bg-white/80 p-4 shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-display text-[13px] font-bold text-forest">Gratis Update</h3>
                <p className="text-[11.5px] leading-relaxed text-sage">
                  Dapatkan perbaikan bug dan fitur baru berkala tanpa biaya lisensi tambahan.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Buy Box */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="flex flex-col gap-5 rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-card">
              {/* Buy Box Header */}
              <div className="flex items-center justify-between border-b border-line/50 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage">
                  Konfigurasi Lisensi
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Siap Diaktivasi
                </span>
              </div>

              {/* Step 1: Pilih Paket */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
                    Pilih Paket
                  </span>
                  <span className="text-[11px] text-sage">Sesuai skala outlet</span>
                </div>
                <SegmentedControl options={PKGS} value={pkg} onChange={setPkg} aria-label="Pilih paket" />
                <p className="text-[11.5px] text-pine/80 leading-normal pl-0.5">
                  {PKG_DESC[pkg]}
                </p>
              </div>

              {/* Price Row */}
              <div className="rounded-xl border border-line/60 bg-tint/30 p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold tracking-tight text-forest tabular-nums sm:text-3xl">
                      {formatIDR(unit)}
                    </span>
                    <span className="text-xs font-normal text-sage">{unitSuffix}</span>
                  </div>
                  {original && original > unit ? (
                    <span className="text-xs font-medium text-sage/80 line-through tabular-nums">
                      {formatIDRShort(original)}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Step 2: Durasi */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
                    Periode Langganan
                  </span>
                  {yearlySaving ? (
                    <span className="text-[11px] font-semibold text-brand">Hemat tahunan</span>
                  ) : null}
                </div>
                <SegmentedControl
                  options={[
                    { value: 'monthly' as Duration, label: 'Bulanan' },
                    { value: 'yearly' as Duration, label: 'Tahunan', badge: yearlySaving ?? undefined },
                  ]}
                  value={duration}
                  onChange={setDuration}
                  aria-label="Pilih durasi"
                />
              </div>

              {/* Step 3: Jumlah Lisensi Stepper */}
              <div className="flex flex-col gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
                  Jumlah Lisensi
                </span>
                <QtyStepper
                  value={qty}
                  onChange={(v) => setQty(Math.max(1, v))}
                  max={maxQty}
                  maxLabel={
                    promoActive && maxQty === qty
                      ? `Maksimal ${maxQty} lisensi (sisa kuota promo)`
                      : null
                  }
                />
              </div>

              {/* Promo Quota Warning Banner */}
              {promoActive ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn-bg p-3 text-[12px] leading-relaxed text-warn">
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  <span>
                    Sisa kuota promo <strong>{product.promo.remaining} lisensi</strong> — berlaku untuk semua tier paket saat ini.
                  </span>
                </div>
              ) : null}

              {/* Total Calculation & Add to Cart (Desktop) */}
              <div className="hidden lg:flex flex-col gap-3 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage text-xs">
                    Subtotal ({qty} lisensi × {formatIDRShort(unit)})
                  </span>
                  <span className="font-display text-xl font-bold text-forest tabular-nums">
                    {formatIDR(total)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  onClick={onAdd}
                  className="w-full justify-center py-3.5 text-sm font-semibold shadow-xs active:scale-[0.98]"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
              </div>

              {/* Feedback Flash Notification */}
              {flash ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-brand/30 bg-tint/80 px-3.5 py-2.5 text-xs font-medium text-forest animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-brand" />
                    <span>{flash}</span>
                  </div>
                  <Link
                    href="/keranjang"
                    className="font-bold text-brand hover:underline inline-flex items-center gap-0.5 text-xs shrink-0"
                  >
                    Keranjang
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile Only - lg:hidden) */}
      <StickyBar>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10.5px] text-sage tabular-nums">
              {qty} × {formatIDRShort(unit)} {duration === 'monthly' ? '/bln' : '/thn'}
            </span>
            <span className="text-[17px] font-bold leading-tight text-forest tabular-nums font-display">
              {formatIDR(total)}
            </span>
          </div>
          <Button onClick={onAdd} className="shrink-0 active:scale-[0.98] py-2.5 px-5">
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Tambah ke Keranjang
          </Button>
        </div>
      </StickyBar>
    </div>
  )
}

