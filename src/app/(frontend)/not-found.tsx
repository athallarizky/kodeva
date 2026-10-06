import { PackageSearch } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { StateScreen } from '@/components/kit/StateScreen'

/** 404 publik — state "produk/halaman tidak ditemukan" (brief Bagian B) dalam bahasa desain kodeva. */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-page">
      <div className="container flex flex-col items-center">
        <span
          className="mb-2 font-display text-[64px] font-bold leading-none tracking-tight text-tint-3 tabular-nums select-none"
          aria-hidden
        >
          404
        </span>
        <StateScreen
          icon={<PackageSearch className="h-[24px] w-[24px]" />}
          title="Halaman tidak ditemukan"
          desc="Produk atau halaman yang kamu cari mungkin sudah dipindahkan atau tidak tersedia."
          actionLabel="Kembali ke Katalog"
          actionHref="/produk"
        />
        <Link
          href="/"
          className="mt-1 text-[12.5px] font-semibold text-sage underline-offset-4 transition-colors hover:text-forest hover:underline"
        >
          atau kembali ke beranda
        </Link>
      </div>
    </main>
  )
}
