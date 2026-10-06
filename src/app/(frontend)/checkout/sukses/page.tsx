'use client'

import { PartyPopper } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'
import { Suspense } from 'react'

import { Button } from '@/components/kit/Button'
import { SummaryRow } from '@/components/kit/SummaryRow'
import { useCartStore } from '@/lib/cart/store'
import { formatIDR } from '@/lib/format'

function SuccessContent() {
  const params = useSearchParams()
  const clear = useCartStore((s) => s.clear)
  const cleared = useRef(false)

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

  return (
    <main className="bg-page">
      <div className="container flex max-w-[440px] flex-col items-center gap-[16px] pb-10 pt-10 text-center">
        {/* hero */}
        <div className="relative flex h-[92px] w-[92px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-tint-2 opacity-60 blur-xl" />
          <span className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-brand shadow-pop">
            <svg viewBox="0 0 24 24" className="h-[34px] w-[34px]" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <PartyPopper className="absolute -right-1 -top-1 h-[20px] w-[20px] text-warn-accent" />
        </div>

        <h1 className="font-display text-[23px] font-bold text-forest">Pembayaran Berhasil!</h1>

        <div className="flex items-center gap-[8px]">
          <span className="text-[11px] uppercase tracking-wide text-sage">No. pesanan</span>
          <span className="rounded-full bg-tint px-[12px] py-[5px] text-[12px] font-bold text-forest">
            {orderId}
          </span>
        </div>

        <p className="max-w-[300px] text-[13px] leading-relaxed text-sage">
          Terima kasih{name ? `, ${name}` : ''}! Lisensi kamu aktif dan struk sudah dikirim ke email.
        </p>

        {/* mini summary */}
        <div className="flex w-full flex-col gap-[8px] rounded-[16px] bg-white p-[16px] text-left shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <SummaryRow label="Isi pesanan" value={`${items} lisensi · ${count} produk`} />
          <SummaryRow label="Total dibayar" value={formatIDR(total)} />
          <SummaryRow label="Metode" value="Simulasi · QRIS" />
        </div>

        <div className="flex w-full flex-col gap-[10px] sm:flex-row">
          <Button href="/produk" arrow className="w-full">
            Jelajahi Produk Lagi
          </Button>
          <Button href="/" variant="outline" className="w-full">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutSuksesPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-page">
          <div className="container py-10">
            <div className="mx-auto h-[74px] w-[74px] rounded-full bg-skeleton" />
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
