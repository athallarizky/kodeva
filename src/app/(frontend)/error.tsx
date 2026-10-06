'use client'

import { TriangleAlert } from 'lucide-react'
import React from 'react'

import { StateScreen } from '@/components/kit/StateScreen'

/** Error boundary segment publik (ux-flow §10) — retry tanpa reload penuh. */
export default function FrontendError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="bg-page">
      <StateScreen
        icon={<TriangleAlert className="h-[24px] w-[24px]" />}
        tone="danger"
        title="Terjadi kesalahan"
        desc="Maaf, ada yang gagal dimuat. Coba lagi sebentar."
        actionLabel="Coba Lagi"
        onAction={reset}
      />
    </main>
  )
}
