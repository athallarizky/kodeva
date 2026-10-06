'use client'

import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  Layers,
  Puzzle,
  Search,
  SearchX,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { Chip } from '@/components/kit/Chip'
import { StateScreen } from '@/components/kit/StateScreen'
import { useDebounce } from '@/utilities/useDebounce'
import { ProductCard } from './ProductCard'
import type { ProductDTO } from './types'

type Kategori = 'semua' | 'kasir' | 'hr' | 'addon'
type Urut = 'terbaru' | 'murah' | 'mahal'

const KATEGORI: {
  value: Kategori
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'semua', label: 'Semua Modul', icon: Layers },
  { value: 'kasir', label: 'Kasir', icon: Store },
  { value: 'hr', label: 'HR & Payroll', icon: Users },
  { value: 'addon', label: 'Add-on', icon: Puzzle },
]

const URUT_LABEL: Record<Urut, string> = {
  terbaru: 'Terbaru',
  murah: 'Harga termurah',
  mahal: 'Harga termahal',
}

const POPULAR_SEARCHES = ['Kasir', 'HR', 'WhatsApp', 'Invoice', 'Laporan']

/**
 * Katalog — SEMUA filter di URL (ux-flow §4): ?q=&kategori=&urut=
 * sehingga state bisa dibagikan / back-button browser bekerja sempurna.
 */
export const ProductCatalog: React.FC<{ products: ProductDTO[] }> = ({ products }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [term, setTerm] = useState(searchParams.get('q') ?? '')
  const debouncedTerm = useDebounce(term, 300)

  const kategori = (searchParams.get('kategori') as Kategori) || 'semua'
  const urut = (searchParams.get('urut') as Urut) || 'terbaru'

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'semua' || (key === 'urut' && value === 'terbaru')) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.replace(`/produk${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  // Sinkronkan input ter-debounce ke URL
  React.useEffect(() => {
    const urlQ = searchParams.get('q') ?? ''
    if (debouncedTerm !== urlQ) setParam('q', debouncedTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm])

  const handleClearSearch = () => {
    setTerm('')
    setParam('q', '')
  }

  const handleResetAll = () => {
    setTerm('')
    router.replace('/produk', { scroll: false })
  }

  const handleQuickSearch = (keyword: string) => {
    setTerm(keyword)
    setParam('q', keyword)
  }

  // Hitung jumlah produk per kategori dari dataset penuh
  const categoryCounts = useMemo(
    () => ({
      semua: products.length,
      kasir: products.filter((p) => p.category === 'kasir').length,
      hr: products.filter((p) => p.category === 'hr').length,
      addon: products.filter((p) => p.category === 'addon').length,
    }),
    [products],
  )

  const filtered = useMemo(() => {
    let list = [...products]
    if (kategori !== 'semua') list = list.filter((p) => p.category === kategori)
    if (debouncedTerm) {
      const q = debouncedTerm.toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.tagline ?? '').toLowerCase().includes(q),
      )
    }
    if (urut === 'murah') list.sort((a, b) => a.packages.basic.monthly - b.packages.basic.monthly)
    else if (urut === 'mahal') list.sort((a, b) => b.packages.basic.monthly - a.packages.basic.monthly)
    else list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return list
  }, [products, kategori, debouncedTerm, urut])

  const main = filtered.filter((p) => p.category !== 'addon')
  const addons = filtered.filter((p) => p.category === 'addon')
  const grouped = kategori === 'semua' && !debouncedTerm
  const hasActiveFilters = Boolean(debouncedTerm || kategori !== 'semua' || urut !== 'terbaru')

  return (
    <div className="relative pb-24 pt-4 sm:pt-6 md:pb-12">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 bg-radial from-tint/60 via-transparent to-transparent blur-3xl opacity-60"
      />

      <div className="container flex flex-col gap-6">
        {/* Header Hero Banner */}
        <header className="relative flex flex-col gap-3 rounded-2xl border border-line/60 bg-gradient-to-br from-white/90 via-page/80 to-tint/40 p-5 shadow-2xs backdrop-blur-xs sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-tint/80 px-2.5 py-0.5 text-[11px] font-semibold text-brand backdrop-blur-xs">
              <Sparkles className="h-3 w-3 text-brand" />
              <span>Ekosistem Kodeva</span>
            </span>
            <span className="hidden text-[11px] text-sage sm:inline-block">•</span>
            <span className="text-[11px] font-medium text-sage">Lisensi Resmi &amp; Update Berkala</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl md:text-4xl">
              Katalog Modul &amp; Lisensi
            </h1>
            <p className="max-w-2xl text-[13px] leading-relaxed text-pine/85 sm:text-[14px]">
              Software operasional terintegrasi untuk bisnis modern. Pilih aplikasi inti kasir dan HR, lalu lengkapi
              dengan modul add-on fleksibel sesuai kebutuhan usahamu tanpa komitmen rumit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-line/40 text-[11.5px] text-pine/80">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Aktivasi instan langsung aktif
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Garansi 14 hari uang kembali
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Dukungan setup &amp; onboarding
            </span>
          </div>
        </header>

        {/* Search Bar & Filter Controls */}
        <div className="flex flex-col gap-3.5">
          {/* Search Input */}
          <div className="relative flex h-11 w-full items-center gap-2.5 rounded-full border border-line/80 bg-white px-4 shadow-2xs transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 focus-within:shadow-card sm:h-12">
            <Search className="h-4 w-4 shrink-0 text-sage transition-colors duration-150 group-focus-within:text-brand" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Cari modul atau fitur (mis. Kasir, HR, WhatsApp, Invoice, Laporan)…"
              aria-label="Cari produk di katalog"
              className="w-full bg-transparent text-[13px] sm:text-[13.5px] text-forest outline-none placeholder:text-sage"
            />
            {term ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Hapus kata kunci pencarian"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sage hover:bg-tint hover:text-forest transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Chips Kategori + Controls Row */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Chips Scrollable */}
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 sm:-mx-0 sm:px-0">
              {KATEGORI.map((k) => {
                const Icon = k.icon
                const isActive = kategori === k.value
                return (
                  <Chip
                    key={k.value}
                    active={isActive}
                    onClick={() => setParam('kategori', k.value)}
                    className="min-h-[38px] px-3.5 py-1.5 text-[12.5px]"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span>{k.label}</span>
                    <span
                      className={`text-[10.5px] font-semibold tabular-nums ${
                        isActive ? 'text-white/80' : 'text-sage'
                      }`}
                    >
                      ({categoryCounts[k.value]})
                    </span>
                  </Chip>
                )
              })}
            </div>

            {/* Sort & Count Controls */}
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              {/* Custom Sort Select Pill */}
              <div className="relative flex items-center">
                <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-brand" />
                <select
                  aria-label="Urutkan produk"
                  value={urut}
                  onChange={(e) => setParam('urut', e.target.value)}
                  className="h-9 cursor-pointer appearance-none rounded-full border border-line/80 bg-white pl-8 pr-8 text-[12px] font-medium text-forest shadow-2xs transition-all hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 active:scale-[0.98]"
                >
                  <option value="terbaru">Urut: Terbaru</option>
                  <option value="murah">Urut: Harga termurah</option>
                  <option value="mahal">Urut: Harga termahal</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-sage" />
              </div>

              {/* Total Count Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-forest shadow-2xs tabular-nums">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span>
                  <strong>{filtered.length}</strong> modul
                </span>
              </div>
            </div>
          </div>

          {/* Active Filter Indicators Bar */}
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line/50 bg-tint/30 px-3 py-2 text-[11.5px]">
              <span className="font-semibold text-pine/80">Filter aktif:</span>

              {debouncedTerm ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line/70 bg-white px-2.5 py-0.5 font-medium text-forest shadow-2xs">
                  Kata kunci: &ldquo;{debouncedTerm}&rdquo;
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="ml-0.5 text-sage hover:text-danger"
                    aria-label="Hapus filter pencarian"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null}

              {kategori !== 'semua' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line/70 bg-white px-2.5 py-0.5 font-medium text-forest shadow-2xs">
                  Kategori: {KATEGORI.find((k) => k.value === kategori)?.label}
                  <button
                    type="button"
                    onClick={() => setParam('kategori', 'semua')}
                    className="ml-0.5 text-sage hover:text-danger"
                    aria-label="Hapus filter kategori"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null}

              {urut !== 'terbaru' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line/70 bg-white px-2.5 py-0.5 font-medium text-forest shadow-2xs">
                  {URUT_LABEL[urut]}
                  <button
                    type="button"
                    onClick={() => setParam('urut', 'terbaru')}
                    className="ml-0.5 text-sage hover:text-danger"
                    aria-label="Reset urutan"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null}

              <button
                type="button"
                onClick={handleResetAll}
                className="ml-auto font-semibold text-brand underline decoration-brand/40 underline-offset-2 hover:text-forest"
              >
                Reset Semua
              </button>
            </div>
          ) : null}
        </div>

        {/* Content Body: Empty State OR Grid */}
        {filtered.length === 0 ? (
          <StateScreen
            icon={<SearchX className="h-6 w-6 text-brand" />}
            title="Tidak ada modul yang cocok"
            desc={`Pencarian untuk "${debouncedTerm || kategori}" tidak menemukan modul. Coba kata kunci lain atau pilih rekomendasi di bawah.`}
            actionLabel="Reset Semua Filter"
            onAction={handleResetAll}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11.5px] font-medium text-sage">Pencarian populer:</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {POPULAR_SEARCHES.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => handleQuickSearch(keyword)}
                    className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-medium text-forest shadow-2xs transition-all hover:border-brand/40 hover:bg-tint/50 active:scale-95"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </StateScreen>
        ) : grouped ? (
          <div className="flex flex-col gap-8">
            {/* Group 1: Kasir & HR */}
            <section className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-[15px] font-bold text-forest sm:text-[16px]">
                      Aplikasi Inti (Kasir &amp; HR)
                    </h2>
                    <p className="text-[11.5px] text-sage">
                      Sistem pondasi untuk operasional transaksi dan manajemen tim
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-line/60 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-sage shadow-2xs tabular-nums">
                  {main.length} modul
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {main.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>

            {/* Group 2: Add-ons */}
            {addons.length > 0 ? (
              <section className="flex flex-col gap-3.5 pt-2">
                <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint text-brand">
                      <Puzzle className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-[15px] font-bold text-forest sm:text-[16px]">
                        Modul Add-on &amp; Ekstensi
                      </h2>
                      <p className="text-[11.5px] text-sage">
                        Tingkatkan kapabilitas dengan modul tambahan fleksibel sesuai kebutuhan
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-line/60 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-sage shadow-2xs tabular-nums">
                    {addons.length} modul
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {addons.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <span className="text-[12px] font-medium text-sage">
                Menampilkan hasil untuk {kategori !== 'semua' ? `kategori "${KATEGORI.find((k) => k.value === kategori)?.label}"` : 'semua kategori'}
                {debouncedTerm ? ` dengan kata kunci "${debouncedTerm}"` : ''}
              </span>
              <span className="rounded-full border border-line/60 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-sage shadow-2xs tabular-nums">
                {filtered.length} modul
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Reassurance Banner / Konsultasi Card */}
        <section className="mt-4 rounded-2xl border border-line/70 bg-gradient-to-br from-tint/70 via-white to-tint-2/40 p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-xl flex-col gap-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Konsultasi Paket &amp; Kebutuhan Usaha</span>
              </div>
              <h3 className="font-display text-lg font-bold text-forest sm:text-xl">
                Butuh rekomendasi modul yang pas untuk bisnismu?
              </h3>
              <p className="text-xs leading-relaxed text-pine/85 sm:text-[13px]">
                Ceritakan alur operasional usahamu kepada tim spesialis Kodeva. Kami bantu siapkan paket lisensi yang
                paling hemat dan terintegrasi penuh.
              </p>
            </div>
            <Link
              href="/#demo"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-xs font-semibold text-white shadow-2xs transition-all duration-200 hover:bg-forest/90 active:scale-[0.98] sm:text-sm"
            >
              <span>Jadwalkan Demo &amp; Diskusi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

