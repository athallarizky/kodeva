'use client'

import {
  ArrowLeft,
  Check,
  CircleAlert,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  TriangleAlert,
  User,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/kit/Button'
import { ProductIcon } from '@/components/kit/ProductIcon'
import { SummaryRow } from '@/components/kit/SummaryRow'
import { useCartStore } from '@/lib/cart/store'
import { cartLineKey, type CartLine } from '@/lib/cart/types'
import { formatIDR } from '@/lib/format'
import { subtotal as cartSubtotal, isVoucherEligible, voucherDiscount, type VoucherRule } from '@/lib/totals'
import { getUtm } from '@/lib/utm'
import { cn } from '@/utilities/ui'

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
  const totalItemCount = useMemo(() => lines.reduce((acc, l) => acc + l.qty, 0), [lines])

  useEffect(() => {
    if (hasHydrated && lines.length === 0 && !failed) {
      router.replace('/keranjang')
    }
  }, [hasHydrated, lines.length, failed, router])

  if (!hasHydrated) {
    return (
      <main className="min-h-[70vh] bg-page py-8">
        <div className="container max-w-5xl">
          <div className="mb-6 h-6 w-40 rounded-full bg-skeleton" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="h-44 rounded-[16px] bg-skeleton" />
              <div className="h-40 rounded-[16px] bg-skeleton" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-64 rounded-[16px] bg-skeleton" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  const validateField = (field: 'name' | 'email', value: string): string | undefined => {
    if (field === 'name') {
      if (value.trim().length < 2) return 'Nama minimal 2 karakter.'
    }
    if (field === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Format email tidak valid.'
    }
    return undefined
  }

  const handleApplyVoucherCode = async (codeToApply?: string) => {
    const code = (codeToApply ?? voucherInput).trim().toUpperCase()
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
      setVoucherInput('')
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

      setVoucherMsg('Terjadi kesalahan sistem saat memproses pesanan — silakan coba lagi.')
    } catch {
      setVoucherMsg('Koneksi internet bermasalah — silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (failed) {
    return (
      <main className="min-h-[75vh] bg-page py-12">
        <div className="container max-w-lg">
          <div className="flex flex-col items-center rounded-[20px] bg-white p-8 sm:p-10 text-center shadow-card border border-line/80">
            <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg text-danger shadow-inner">
              <TriangleAlert className="h-8 w-8 stroke-[2.2]" />
            </span>
            <span className="mb-1 rounded-full bg-danger/10 px-3 py-1 text-[11px] font-bold text-danger">
              Simulasi Status 402
            </span>
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-forest tracking-tight">
              Pembayaran Belum Berhasil
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-sage">
              Skenario simulasi pembayaran gagal telah diproses. Seluruh item keranjang belanja kamu tetap tersimpan aman.
            </p>

            <div className="mt-6 flex w-full flex-col gap-3">
              <Button
                className="w-full"
                onClick={() => {
                  setFailed(false)
                  setSimulate('success')
                }}
              >
                Coba Lagi (Ganti ke Sukses)
              </Button>
              <Button href="/keranjang" variant="outline" className="w-full">
                Kembali ke Keranjang
              </Button>
            </div>

            <p className="mt-6 text-[11.5px] text-sage">
              Ada pertanyaan? Hubungi tim support Kodeva di{' '}
              <a href="mailto:halo@kodeva.id" className="font-semibold text-forest underline hover:text-brand">
                halo@kodeva.id
              </a>
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[85vh] bg-page pb-20 pt-6 sm:pt-8">
      <div className="container max-w-6xl">
        {/* Top Header & Breadcrumb */}
        <div className="mb-6 flex flex-col gap-4">
          <Link
            href="/keranjang"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sage transition-colors hover:text-forest active:scale-95 w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Keranjang</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-line/70 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand mb-1.5">
                <Sparkles className="h-3 w-3" />
                <span>Simulasi Transaksi</span>
              </div>
              <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-forest tracking-tight">
                Checkout Pesanan
              </h1>
              <p className="text-[13px] text-sage">
                Lingkungan simulasi evaluasi — tidak ada biaya atau tagihan riil.
              </p>
            </div>

            {/* Stepper Indicator */}
            <nav aria-label="Progress checkout" className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-brand">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="hidden sm:inline">Keranjang</span>
              </div>
              <span className="h-0.5 w-4 rounded bg-brand" />
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white">
                  2
                </span>
                <span>Checkout</span>
              </div>
              <span className="h-0.5 w-4 rounded bg-tint" />
              <div className="flex items-center gap-1.5 text-sage">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tint text-[11px] font-bold text-sage">
                  3
                </span>
                <span className="hidden sm:inline">Selesai</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Quota Conflict Alert */}
        {conflict ? (
          <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-warn-line bg-warn-bg p-4">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <div className="flex-1 text-[13px] text-forest">
              <span className="font-bold">Kuota promo telah berubah!</span> Sejak kamu menambahkan modul ke keranjang,
              stok lisensi promo diperbarui oleh sistem.{' '}
              <Link href="/keranjang" className="font-bold underline text-brand hover:text-brand-hover">
                Periksa keranjang belanja sekarang →
              </Link>
            </div>
          </div>
        ) : null}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column (Forms & Options) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Card 1: Data Pembeli */}
            <section className="rounded-[16px] bg-white p-5 sm:p-6 shadow-card border border-line/80">
              <div className="mb-4 flex items-center justify-between border-b border-line/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                    <User className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-bold text-forest">Data Pembeli</h2>
                    <p className="text-[11.5px] text-sage">Informasi identitas penerima lisensi</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-sage">* Wajib diisi</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="checkout-name" className="mb-1.5 block text-[12.5px] font-semibold text-forest">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                    <input
                      id="checkout-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                      }}
                      onBlur={() => setErrors((p) => ({ ...p, name: validateField('name', name) }))}
                      placeholder="cth. Budi Santoso"
                      className={cn(
                        'w-full rounded-[11px] bg-white pl-10 pr-3.5 py-2.5 text-[13.5px] text-forest border border-line/90 placeholder:text-sage/70 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
                        errors.name && 'border-danger focus:border-danger focus:ring-danger/20',
                      )}
                    />
                  </div>
                  {errors.name ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger">
                      <CircleAlert className="h-3 w-3" />
                      <span>{errors.name}</span>
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="checkout-email" className="mb-1.5 block text-[12.5px] font-semibold text-forest">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                      }}
                      onBlur={() => setErrors((p) => ({ ...p, email: validateField('email', email) }))}
                      placeholder="cth. budi@warungnya.id"
                      className={cn(
                        'w-full rounded-[11px] bg-white pl-10 pr-3.5 py-2.5 text-[13.5px] text-forest border border-line/90 placeholder:text-sage/70 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
                        errors.email && 'border-danger focus:border-danger focus:ring-danger/20',
                      )}
                    />
                  </div>
                  {errors.email ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger">
                      <CircleAlert className="h-3 w-3" />
                      <span>{errors.email}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-sage">
                      Serial key lisensi digital dan invoice resmi akan dikirim otomatis ke alamat ini.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Card 2: Metode Pembayaran (Simulasi Reviewer) */}
            <section className="rounded-[16px] bg-white p-5 sm:p-6 shadow-card border border-line/80">
              <div className="mb-4 flex items-center justify-between border-b border-line/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-bold text-forest">Skenario Pembayaran (Simulasi)</h2>
                    <p className="text-[11.5px] text-sage">Pilih hasil transaksi untuk demo evaluasi</p>
                  </div>
                </div>
                <span className="rounded-full bg-tint px-2.5 py-0.5 text-[10.5px] font-bold text-brand">
                  QRIS Demo
                </span>
              </div>

              <div className="space-y-3" role="radiogroup" aria-label="Simulasi Hasil Pembayaran">
                {[
                  {
                    value: 'success' as Simulate,
                    label: 'Simulasi Sukses (Rekomendasi)',
                    desc: 'Menerbitkan pesanan, mengaktifkan lisensi, dan mengarahkan ke halaman sukses (Status 201).',
                    badge: 'Happy Path',
                  },
                  {
                    value: 'failure' as Simulate,
                    label: 'Simulasi Gagal Bayar',
                    desc: 'Menguji skenario kegagalan pembayaran (Status 402). Keranjang tetap aman dan tidak hilang.',
                    badge: 'Error Path',
                  },
                ].map((opt) => {
                  const active = simulate === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSimulate(opt.value)}
                      className={cn(
                        'flex w-full items-start gap-3.5 rounded-[13px] p-3.5 text-left border transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                        active
                          ? 'border-brand bg-tint/25 shadow-2xs'
                          : 'border-line/80 bg-white hover:border-forest/30 hover:bg-tint/10',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          active ? 'border-brand bg-white' : 'border-line bg-white',
                        )}
                      >
                        {active ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-[13.5px] font-bold',
                              active ? 'text-forest' : 'text-forest/80',
                            )}
                          >
                            {opt.label}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              active ? 'bg-brand text-white' : 'bg-tint text-sage',
                            )}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-sage">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Reassurance Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 rounded-[12px] bg-white/70 p-3 border border-line/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint text-brand">
                  <Zap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-forest">Aktivasi Instan</p>
                  <p className="text-[11px] text-sage truncate">Serial key langsung aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[12px] bg-white/70 p-3 border border-line/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint text-brand">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-forest">Garansi 14 Hari</p>
                  <p className="text-[11px] text-sage truncate">Jaminan uang kembali</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[12px] bg-white/70 p-3 border border-line/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint text-brand">
                  <Lock className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-forest">Enkripsi Aman</p>
                  <p className="text-[11px] text-sage truncate">Privasi terjamin 100%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sticky Order Summary) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-[18px] bg-white p-5 sm:p-6 shadow-card border border-line/90 space-y-5">
              <div className="flex items-center justify-between border-b border-line/60 pb-3.5">
                <h2 className="font-display text-[16px] font-bold text-forest tracking-tight">
                  Ringkasan Pesanan
                </h2>
                <span className="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  {totalItemCount} Lisensi
                </span>
              </div>

              {/* Items Line List */}
              <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1 divide-y divide-line/40">
                {lines.map((l) => (
                  <div key={cartLineKey(l)} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductIcon slug={l.slug} className="h-8 w-8 rounded-[8px]" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-forest truncate">{l.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-sage">
                          <span className="rounded bg-tint px-1.5 py-0.2 font-medium text-forest">
                            {PKG_LABEL[l.package]}
                          </span>
                          <span>·</span>
                          <span>{DUR_LABEL[l.duration]}</span>
                          <span>·</span>
                          <span className="font-semibold text-forest">×{l.qty}</span>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-forest tabular-nums">
                      {formatIDR(l.unitPriceSnapshot * l.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Voucher Code Form */}
              <div className="rounded-[12px] bg-tint/30 p-3 border border-line/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-forest">
                    <TicketPercent className="h-3.5 w-3.5 text-brand" />
                    <span>Kupon / Voucher Promo</span>
                  </div>
                  {voucher ? (
                    <button
                      type="button"
                      onClick={() => {
                        setVoucher(null)
                        setVoucherInput('')
                      }}
                      className="text-[11px] font-semibold text-danger hover:underline"
                    >
                      Hapus
                    </button>
                  ) : null}
                </div>

                {voucher ? (
                  <div className="flex items-center justify-between rounded-[9px] bg-white px-3 py-2 border border-brand/40 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-tint px-1.5 py-0.5 text-[10px] font-bold text-brand uppercase">
                        {voucher.code}
                      </span>
                      <span className="text-[12px] font-semibold text-brand">Voucher Aktif</span>
                    </div>
                    <span className="text-[12.5px] font-bold text-brand tabular-nums">
                      −{formatIDR(discount)}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyVoucherCode()
                        }
                      }}
                      placeholder="Masukkan kode promo"
                      aria-label="Kode voucher promo"
                      className="flex-1 rounded-[9px] bg-white px-3 py-1.5 text-[12.5px] uppercase font-semibold text-forest border border-line placeholder:normal-case placeholder:font-normal placeholder:text-sage focus:border-brand focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucherCode()}
                      className="rounded-[9px] bg-forest px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-forest-light active:scale-95"
                    >
                      Pakai
                    </button>
                  </div>
                )}

                {/* Suggestions or Error */}
                {voucherMsg ? (
                  <p className="text-[11px] font-medium text-warn flex items-center gap-1">
                    <CircleAlert className="h-3 w-3 shrink-0" />
                    <span>{voucherMsg}</span>
                  </p>
                ) : !voucher ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-sage">
                    <span>Saran:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyVoucherCode('KODEVA50')}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-forest border border-line/80 hover:border-brand hover:text-brand"
                    >
                      KODEVA50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyVoucherCode('HEMAT10')}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-forest border border-line/80 hover:border-brand hover:text-brand"
                    >
                      HEMAT10
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 border-t border-line/60 pt-3">
                <SummaryRow label="Subtotal Produk" value={formatIDR(itemsSubtotal)} />
                {voucher ? (
                  <SummaryRow
                    label={`Diskon Kupon (${voucher.code})`}
                    value={`−${formatIDR(discount)}`}
                    className="text-brand font-semibold"
                  />
                ) : null}
                <div className="my-2 border-t border-line/80" />
                <SummaryRow
                  label="Total Pembayaran"
                  value={formatIDR(grandTotal)}
                  emphasis
                  note="Sudah termasuk pajak & simulasi PPN"
                />
              </div>

              {/* Action Button */}
              <Button
                className="w-full justify-center text-[15px] font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                onClick={submit}
                disabled={submitting}
              >
                <ShieldCheck className="mr-2 h-4.5 w-4.5 stroke-[2.2]" />
                {submitting ? 'Memproses Transaksi…' : `Bayar Sekarang — ${formatIDR(grandTotal)}`}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-sage">
                <Lock className="h-3 w-3" />
                <span>Simulasi aman · Tanpa kartu kredit sungguhan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
