'use client'

import { PartyPopper, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const DISMISS_KEY = 'kodeva-promo-dismissed'

/** Banner promo atas (desain landing) — bisa ditutup, ingat penutupan sesi ini. */
export const PromoBanner: React.FC = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // cek sesudah mount agar SSR/CSR konsisten (tidak render di server)
    if (typeof window !== 'undefined' && !sessionStorage.getItem(DISMISS_KEY)) setShow(true)
  }, [])

  if (!show) return null
  return (
    <div className="flex w-full items-center justify-between gap-3 bg-forest px-4 py-2 border-b border-forest/40 text-white shadow-2xs">
      <div className="container mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
        <PartyPopper className="h-3.5 w-3.5 shrink-0 text-tint-3" />
        <p className="text-[12px] font-medium leading-normal text-white [text-wrap:pretty]">
          Promo Akhir Tahun: hemat hingga 17% untuk paket tahunan.
        </p>
        <Link
          href="/produk"
          className="text-[11.5px] font-bold text-tint-3 underline underline-offset-2 hover:text-white transition-colors"
        >
          Lihat Diskon →
        </Link>
      </div>
      <button
        type="button"
        aria-label="Tutup banner promo"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1')
          setShow(false)
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
