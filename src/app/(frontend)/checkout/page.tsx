'use client'

import { CircleCheck, Lock, TicketPercent, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { SummaryRow } from '@/components/kit/SummaryRow'
import { useCartStore } from '@/lib/cart/store'
import { cartLineKey, type CartLine } from '@/lib/cart/types'
import { formatIDR } from '@/lib/format'
import { subtotal as cartSubtotal, isVoucherEligible, voucherDiscount, type VoucherRule } from '@/lib/totals'
import { getUtm } from '@/lib/utm'

const PKG_LABEL: Record<CartLine['package'], string> = {
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
}
const DUR_LABEL: Record<CartLine['duration'], string> = {
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

type FieldErrors = Partial<Record<'name' | 'email', string>>
type Simulate = 'success' | 'failure'

interface AppliedVoucher extends VoucherRule {
  code: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const lines = useCartStore((s) => s.lines)
  const hasHydrated = useCartStore((s) => s.hasHydrated)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [simulate, setSimulate] = useState<Simulate>('success')

  const [voucherInput, setVoucherInput] = useState('')
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null)
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)
  const [conflict, setConflict] = useState(false)

  const itemsSubtotal = useMemo(() => cartSubtotal(lines), [lines])
  const discount = voucher ? voucherDiscount(voucher, itemsSubtotal) : 0
  const grandTotal = itemsSubtotal - discount

  useEffect(() => {
    if (hasHydrated && lines.length === 0 && !failed) {
      router.replace('/keranjang')
    }
  }, [hasHydrated, lines.length, failed, router])

  if (!hasHydrated) {
    return (
      <main className="bg-page">
        <div className="container flex flex-col gap-[10px] py-6">
          <div className="h-6 w-40 rounded-full bg-skeleton" />
          <div className="h-40 rounded-[14px] bg-skeleton" />
        </div>
      </main>
    )
  }

  const validateField = (field: 'name' | 'email', value: string): string | undefined => {
    if (field === 'name') {
      if (value.trim().length < 2) return 'Nama minimal 2 huruf.'
    }
    if (field === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Format email tidak valid.'
    }
    return undefined
  }

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase()
    setVoucherMsg(null)
    if (!code) return
    try {
      const r = await fetch(`/api/vouchers?where[code][equals]=${encodeURIComponent(code)}&limit=1&depth=0`)
      const j = (await r.json()) as { docs?: VoucherRule[] }
      const found = j.docs?.[0]
      if (!found || !found.active) {
        setVoucher(null)
        setVoucherMsg('Kode tidak ditemukan atau tidak aktif. Coba kode lain: HEMAT10 (min. Rp300rb)')
        return
      }
      if (!isVoucherEligible(found, itemsSubtotal)) {
        setVoucher(null)
        setVoucherMsg(
          found.minSpend
            ? `Belum memenuhi minimum belanja ${formatIDR(found.minSpend)}.`
            : 'Voucher tidak berlaku untuk keranjang ini.',
        )
        return
      }
      setVoucher({ ...found, code })
      setVoucherMsg(null)
    } catch {
      setVoucherMsg('Gagal memeriksa voucher — coba lagi.')
    }
  }

  const submit = async () => {
    const nextErrors: FieldErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.email) return

    setSubmitting(true)
    setFailed(false)
    setConflict(false)
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: { name: name.trim(), email: email.trim() },
          items: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            name: l.name,
            package: l.package,
            duration: l.duration,
            qty: l.qty,
            unitPriceSnapshot: l.unitPriceSnapshot,
            ...(l.originalUnitPriceSnapshot ? { originalUnitPriceSnapshot: l.originalUnitPriceSnapshot } : {}),
          })),
          ...(voucher ? { voucher: voucher.code } : {}),
          utm: getUtm() ?? undefined,
          campaign: 'promo-akhir-tahun',
          simulate,
        }),
      })

      if (r.status === 201) {
        const j = (await r.json()) as { orderId: string }
        const params = new URLSearchParams({
          orderId: j.orderId,
          total: String(grandTotal),
          items: String(lines.reduce((n, l) => n + l.qty, 0)),
          count: String(lines.length),
          name: name.trim().split(' ')[0],
        })
        router.push(`/checkout/sukses?${params.toString()}`)
        return
      }

      if (r.status === 402) {
        setFailed(true) // gagal bayar (demo) — keranjang TIDAK di-clear
        return
      }

      if (r.status === 409) {
        setConflict(true) // kuota berubah → minta user kembali ke keranjang
        return
      }

      setVoucherMsg('Terjadi kesalahan — coba lagi.')
    } catch {
      setVoucherMsg('Koneksi bermasalah — coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (failed) {
    return (
      <main className="bg-page">
        <div className="container py-6">
          <div className="flex flex-col items-center gap-[10px] rounded-[16px] bg-white p-8 text-center shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
            <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-danger-bg text-danger">
              <TriangleAlert className="h-[24px] w-[24px]" />
            </span>
            <h1 className="font-display text-[17px] font-bold text-forest">Pembayaran gagal</h1>
            <p className="max-w-[280px] text-[12.5px] text-sage">
              Keranjang tetap aman — coba lagi
            </p>
            <Button className="mt-2" onClick={() => setFailed(false)}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-page">
      <div className="container flex flex-col gap-[14px] pb-16 pt-5">
        <header className="flex flex-col gap-[6px]">
          <h1 className="font-display text-[22px] font-bold text-forest">Checkout</h1>
          <p className="text-[12px] text-sage">Simulasi — tidak ada tagihan sungguhan.</p>
        </header>

        {/* step bar */}
        <div className="flex items-center gap-[8px]" aria-hidden>
          {[1, 2, 3].map((n) => (
            <React.Fragment key={n}>
              <span
                className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[11px] font-bold ${
                  n <= 2 ? 'bg-brand text-white' : 'bg-tint text-sage'
                }`}
              >
                {n}
              </span>
              {n < 3 ? <span className="h-[2px] flex-1 rounded bg-tint" /> : null}
            </React.Fragment>
          ))}
        </div>

        {conflict ? (
          <div className="flex items-start gap-[8px] rounded-[12px] border border-warn-line bg-warn-bg px-[12px] py-[10px]">
            <TriangleAlert className="mt-[1px] h-[14px] w-[14px] shrink-0 text-warn" />
            <p className="text-[11.5px] leading-snug text-warn">
              Kuota promo berubah sejak kamu menambahkan ke keranjang.{' '}
              <Link href="/keranjang" className="font-bold underline">
                Periksa keranjang
              </Link>
              .
            </p>
          </div>
        ) : null}

        {/* data pembeli */}
        <section className="flex flex-col gap-[10px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-sage">Data Pembeli</h2>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11.5px] text-forest">Nama lengkap</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setErrors((p) => ({ ...p, name: validateField('name', name) }))}
              placeholder="cth. Budi Santoso"
              className="rounded-[10px] bg-white px-[12px] py-[10px] text-[13px] text-forest outline outline-1 outline-line outline-offset-[-0.5px] placeholder:text-sage focus:outline-brand"
            />
            {errors.name ? <span className="text-[10.5px] text-danger">{errors.name}</span> : null}
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11.5px] text-forest">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setErrors((p) => ({ ...p, email: validateField('email', email) }))}
              placeholder="cth. budi@warungnya.id"
              className="rounded-[10px] bg-white px-[12px] py-[10px] text-[13px] text-forest outline outline-1 outline-line outline-offset-[-0.5px] placeholder:text-sage focus:outline-brand"
            />
            {errors.email ? <span className="text-[10.5px] text-danger">{errors.email}</span> : null}
            <span className="text-[10.5px] text-sage">Tiket digital dikirim ke email ini.</span>
          </label>
        </section>

        {/* ringkasan */}
        <section className="flex flex-col gap-[10px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-sage">Ringkasan</h2>
          {lines.map((l) => (
            <SummaryRow
              key={cartLineKey(l)}
              label={`${l.name} · ${PKG_LABEL[l.package]} ×${l.qty}`}
              value={formatIDR(l.unitPriceSnapshot * l.qty)}
            />
          ))}
          <SummaryRow label="Subtotal" value={formatIDR(itemsSubtotal)} className="border-t border-line pt-[10px]" />

          {/* voucher */}
          <div className="flex flex-col gap-[6px] border-t border-line pt-[10px]">
            <div className="flex items-center gap-[8px]">
              <TicketPercent className="h-[15px] w-[15px] shrink-0 text-sage" />
              <input
                type="text"
                value={voucher ? voucher.code : voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                disabled={!!voucher}
                placeholder="Kode voucher"
                aria-label="Kode voucher"
                className="w-full rounded-[10px] bg-white px-[12px] py-[9px] text-[12.5px] uppercase text-forest outline outline-1 outline-line outline-offset-[-0.5px] placeholder:normal-case placeholder:text-sage focus:outline-brand disabled:text-sage"
              />
              {voucher ? (
                <button
                  type="button"
                  onClick={() => {
                    setVoucher(null)
                    setVoucherInput('')
                  }}
                  className="shrink-0 text-[11.5px] text-sage underline"
                >
                  hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyVoucher}
                  className="shrink-0 rounded-full bg-forest px-[14px] py-[9px] text-[11.5px] text-white"
                >
                  Terapkan
                </button>
              )}
            </div>
            {voucher ? (
              <SummaryRow label={`Voucher ${voucher.code}`} value={`−${formatIDR(discount)}`} />
            ) : null}
            {voucherMsg ? <p className="text-[10.5px] text-warn">{voucherMsg}</p> : null}
          </div>

          <SummaryRow label="Total bayar" value={formatIDR(grandTotal)} emphasis className="border-t border-line pt-[10px]" />
        </section>

        {/* pembayaran */}
        <section className="flex flex-col gap-[10px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-sage">Pembayaran (Simulasi)</h2>
          {(
            [
              { value: 'success' as Simulate, label: 'Sukses', desc: 'Simulasi pembayaran berhasil' },
              { value: 'failure' as Simulate, label: 'Gagal', desc: 'Lihat halaman gagal (demo reviewer)' },
            ] as const
          ).map((opt) => {
            const active = simulate === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSimulate(opt.value)}
                className={`flex items-center gap-[10px] rounded-[12px] px-[12px] py-[11px] text-left outline outline-1 outline-offset-[-0.5px] ${
                  active ? 'outline-brand' : 'outline-line'
                }`}
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full outline outline-1 ${
                    active ? 'outline-brand' : 'outline-line'
                  }`}
                >
                  {active ? <span className="h-[10px] w-[10px] rounded-full bg-brand" /> : null}
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-bold text-forest">{opt.label}</span>
                  <span className="text-[11px] text-sage">{opt.desc}</span>
                </span>
              </button>
            )
          })}
        </section>

        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? 'Memproses…' : `Bayar — ${formatIDR(grandTotal)}`}
        </Button>

        <p className="flex items-center justify-center gap-[6px] text-[10.5px] text-sage">
          <Lock className="h-[12px] w-[12px]" />
          Data terenkripsi · transaksi simulasi
        </p>
      </div>
    </main>
  )
}
