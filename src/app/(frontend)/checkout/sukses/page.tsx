'use client'

import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Home,
  LifeBuoy,
  MailCheck,
  PartyPopper,
  ReceiptText,
  Sparkles,
  Store,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'

import { Button } from '@/components/kit/Button'
import { SummaryRow } from '@/components/kit/SummaryRow'
import { useCartStore } from '@/lib/cart/store'
import { formatIDR } from '@/lib/format'

function SuccessContent() {
  const params = useSearchParams()
  const clear = useCartStore((s) => s.clear)
  const cleared = useRef(false)
  const [copied, setCopied] = useState(false)

  const orderId = params.get('orderId') ?? '—'
  const total = Number(params.get('total') ?? '0')
  const items = params.get('items') ?? '0'
  const count = params.get('count') ?? '0'
  const name = params.get('name') ?? ''

  // clear() HANYA saat sukses (kontrak store) — sekali per mount
  useEffect(() => {
    if (cleared.current) return
    cleared.current = true
    clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyOrderId = () => {
    if (orderId && orderId !== '—') {
      navigator.clipboard.writeText(orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="min-h-[85vh] bg-page pb-20 pt-10 sm:pt-14">
      <div className="container max-w-xl">
        <div className="flex flex-col items-center text-center">
          {/* Animated Hero Illustration */}
          <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
            {/* Ambient background glows */}
            <span className="absolute inset-0 rounded-full bg-tint-2 opacity-80 blur-xl animate-pulse" />
            <span className="absolute -left-2 top-2 h-3.5 w-3.5 rounded-full bg-tint-2 border-2 border-white shadow-2xs" />
            <span className="absolute -right-2 top-4 h-3 w-3 rounded-full bg-brand/40 border border-white" />
            <span className="absolute bottom-1 right-3 h-4 w-4 rounded-full bg-tint border-2 border-white" />

            {/* Core check sphere */}
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 ring-8 ring-white/80">
              <Check className="h-10 w-10 stroke-[3]" />
            </span>

            {/* Celebration chip */}
            <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-warn-bg text-warn border border-warn-line shadow-sm">
              <PartyPopper className="h-4 w-4" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Transaksi Berhasil</span>
          </div>

          <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-forest tracking-tight">
            Pembayaran Berhasil!
          </h1>

          {/* Order ID Chip with Quick Copy */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] font-medium text-sage">No. Pesanan:</span>
            <button
              type="button"
              onClick={copyOrderId}
              title="Salin nomor pesanan"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12.5px] font-bold text-forest border border-line shadow-2xs transition-colors hover:border-brand active:scale-95"
            >
              <span className="font-mono tracking-wider text-brand">{orderId}</span>
              {copied ? (
                <span className="text-[10px] font-semibold text-brand">Tersalin!</span>
              ) : (
                <Copy className="h-3 w-3 text-sage" />
              )}
            </button>
          </div>

          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-sage">
            Terima kasih{name ? `, ${name}` : ''}! Lisensi digital kamu telah aktif secara instan dan bukti transaksi
            telah kami kirimkan ke alamat email.
          </p>

          {/* Digital Receipt Card */}
          <div className="mt-8 w-full rounded-[18px] bg-white p-5 sm:p-6 shadow-card border border-line/90 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-brand" />
                <h2 className="text-[13.5px] font-bold text-forest">Rincian Transaksi Digital</h2>
              </div>
              <span className="rounded-full bg-tint px-2 py-0.5 text-[10.5px] font-bold text-brand">
                Lunas (Instant)
              </span>
            </div>

            <div className="space-y-1">
              <SummaryRow label="Isi Pesanan" value={`${items} Lisensi · ${count} Modul`} />
              <SummaryRow label="Total Dibayar" value={formatIDR(total)} emphasis />
              <SummaryRow label="Metode Pembayaran" value="Simulasi Instant · QRIS" />
              <SummaryRow label="Status Lisensi" value="Aktif Otomatis" className="text-brand font-semibold" />
            </div>
          </div>

          {/* Next Steps Guidance */}
          <div className="mt-6 w-full rounded-[18px] bg-white/70 p-5 shadow-2xs border border-line/60 text-left space-y-3.5">
            <h3 className="text-[12.5px] font-bold text-forest uppercase tracking-wider">
              Langkah Selanjutnya
            </h3>
            <div className="space-y-3 text-[12.5px]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-brand">
                  <MailCheck className="h-3 w-3" />
                </span>
                <p className="text-sage leading-relaxed">
                  <strong className="text-forest">Periksa Email Masuk:</strong> Serial key lisensi dan tautan
                  unduhan dikirim ke kotak masuk email kamu.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-brand">
                  <Download className="h-3 w-3" />
                </span>
                <p className="text-sage leading-relaxed">
                  <strong className="text-forest">Aktivasi di Aplikasi:</strong> Salin serial key dan masukkan ke menu
                  pengaturan aplikasi Kodeva untuk aktivasi penuh.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-brand">
                  <LifeBuoy className="h-3 w-3" />
                </span>
                <p className="text-sage leading-relaxed">
                  <strong className="text-forest">Bantuan Teknis:</strong> Jika mengalami kendala aktivasi, tim
                  support kami siap membantu 7x24 jam via live chat atau email.
                </p>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Button href="/produk" className="w-full justify-center shadow-md hover:shadow-lg">
              <Store className="mr-2 h-4 w-4" />
              <span>Jelajahi Produk Lagi</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button href="/" variant="outline" className="w-full justify-center">
              <Home className="mr-2 h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutSuksesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-page py-16">
          <div className="container max-w-md text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-skeleton" />
            <div className="mx-auto mt-4 h-6 w-48 rounded-full bg-skeleton" />
            <div className="mx-auto mt-2 h-4 w-64 rounded-full bg-skeleton" />
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
