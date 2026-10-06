'use client'

import { ChevronLeft, CircleCheck, Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { QtyStepper } from '@/components/kit/QtyStepper'
import { SegmentedControl } from '@/components/kit/SegmentedControl'
import { StickyBar } from '@/components/kit/StickyBar'
import { SummaryRow } from '@/components/kit/SummaryRow'
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

const CAT_LABEL: Record<ProductDTO['category'], string> = {
  kasir: 'Kasir',
  hr: 'HR',
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
  const original =
    duration === 'monthly' ? prices.originalMonthly : null

  // badge hemat tahunan dihitung dari harga vs 12× bulanan
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
        : `${result.added} lisensi ditambahkan ke keranjang ✓`,
    )
  }

  return (
    <div className="bg-page pb-28 md:pb-10">
      <div className="container flex flex-col gap-[14px] pt-4">
        {/* back + breadcrumb */}
        <div className="flex items-center gap-[10px]">
          <Link
            href="/produk"
            aria-label="Kembali ke katalog"
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-forest outline outline-1 outline-line outline-offset-[-0.5px] hover:bg-tint"
          >
            <ChevronLeft className="h-[16px] w-[16px]" />
          </Link>
          <nav className="text-[12px] text-sage" aria-label="Breadcrumb">
            <Link href="/produk" className="hover:text-forest">
              Katalog
            </Link>
            <span className="mx-[4px]">/</span>
            <span className="text-forest">{product.name}</span>
          </nav>
        </div>

        {/* gallery */}
        <div className="relative aspect-[8/5] w-full overflow-hidden rounded-[16px] shadow-card">
          <Image
            src="/images/pos-terminal.jpg"
            alt={`${product.name} — tampilan aplikasi`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
        </div>

        {/* head */}
        <div className="flex flex-col gap-[6px]">
          <span className="w-fit rounded-full bg-tint px-[10px] py-[4px] text-[10px] font-bold uppercase tracking-wide text-forest">
            {CAT_LABEL[product.category]}
          </span>
          <h1 className="font-display text-[23px] font-bold leading-tight text-forest">{product.name}</h1>
          {product.tagline ? <p className="text-[13px] text-sage">{product.tagline}</p> : null}
          <p className="text-[11.5px] text-sage">4.9 (312 ulasan) · 2.100+ pengguna</p>
        </div>

        {/* buy box */}
        <div className="flex flex-col gap-[14px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <div className="flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-wide text-sage">Pilih paket</span>
            <SegmentedControl options={PKGS} value={pkg} onChange={setPkg} aria-label="Pilih paket" />
          </div>

          <div className="flex items-baseline gap-[8px]">
            <span className="text-[19px] font-bold text-forest">
              {formatIDR(unit)}
              <span className="text-[12px] font-normal text-sage">{unitSuffix}</span>
            </span>
            {original && original > unit ? (
              <span className="text-[12px] text-sage line-through">{formatIDRShort(original)}</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-wide text-sage">Durasi</span>
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

          <div className="flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-wide text-sage">Jumlah lisensi</span>
            <QtyStepper
              value={qty}
              onChange={(v) => setQty(Math.max(1, v))}
              max={maxQty}
              maxLabel={
                promoActive && maxQty === qty
                  ? `Maks ${maxQty} (kuota sisa)`
                  : null
              }
            />
          </div>

          {promoActive ? (
            <p className="flex items-start gap-[6px] rounded-[10px] bg-warn-bg px-[10px] py-[8px] text-[11.5px] leading-snug text-warn">
              <Info className="mt-[1px] h-[13px] w-[13px] shrink-0" />
              Sisa kuota promo {product.promo.remaining} lisensi — berlaku untuk paket apa saja.
            </p>
          ) : null}
        </div>

        {/* fitur */}
        {product.features.length > 0 ? (
          <section className="flex flex-col gap-[10px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
            <h2 className="font-display text-[16px] font-bold text-forest">Ringkasan Fitur</h2>
            {product.tagline ? <p className="text-[12px] text-sage">{product.tagline}</p> : null}
            <ul className="flex flex-col gap-[8px]">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-[8px] text-[13px] text-forest">
                  <CircleCheck className="mt-[1px] h-[15px] w-[15px] shrink-0 text-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {flash ? <p className="text-center text-[12.5px] text-brand">{flash}</p> : null}
      </div>

      {/* sticky add bar */}
      <StickyBar>
        <div className="flex items-center justify-between gap-[12px]">
          <div className="flex flex-col">
            <span className="text-[10.5px] text-sage">
              {qty} × {formatIDRShort(unit)} {duration === 'monthly' ? '/bln' : '/thn'}
            </span>
            <span className="text-[16px] font-bold leading-tight text-forest">{formatIDR(total)}</span>
          </div>
          <Button onClick={onAdd} className="shrink-0">
            Tambah ke Keranjang
          </Button>
        </div>
      </StickyBar>
    </div>
  )
}
