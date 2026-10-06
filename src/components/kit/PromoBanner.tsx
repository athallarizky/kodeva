'use client'

import { PartyPopper, X } from 'lucide-react'
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
    <div className="flex w-full items-center gap-[10px] bg-forest px-4 py-[9px]">
      <PartyPopper className="h-[13px] w-[13px] shrink-0 text-white" />
      <p className="flex-1 text-[12px] leading-tight text-white">
        Promo Akhir Tahun: hemat hingga 17% paket tahunan
      </p>
      <button
        type="button"
        aria-label="Tutup banner promo"
        className="flex h-5 w-5 shrink-0 items-center justify-center text-white/70 hover:text-white"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1')
          setShow(false)
        }}
      >
        <X className="h-[14px] w-[14px]" />
      </button>
    </div>
  )
}
