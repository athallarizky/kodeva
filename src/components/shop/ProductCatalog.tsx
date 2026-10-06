'use client'

import { Search, SearchX } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { Chip } from '@/components/kit/Chip'
import { StateScreen } from '@/components/kit/StateScreen'
import { useDebounce } from '@/utilities/useDebounce'
import { ProductCard } from './ProductCard'
import type { ProductDTO } from './types'

type Kategori = 'semua' | 'kasir' | 'hr' | 'addon'
type Urut = 'terbaru' | 'murah' | 'mahal'

const KATEGORI: { value: Kategori; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'hr', label: 'HR' },
  { value: 'addon', label: 'Add-on' },
]

const URUT_LABEL: Record<Urut, string> = {
  terbaru: 'Terbaru',
  murah: 'Harga_termurah',
  mahal: 'Harga_termahal',
}

/**
 * Katalog — SEMUA filter di URL (ux-flow §4): ?q=&kategori=&urut=
 * sehingga state bisa dibagikan/back-button bekerja.
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
    if (!value || value === 'semua' || (key === 'urut' && value === 'terbaru')) params.delete(key)
    else params.set(key, value)
    router.replace(`/produk${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  // sinkronkan input ter-debounce ke URL
  React.useEffect(() => {
    const urlQ = searchParams.get('q') ?? ''
    if (debouncedTerm !== urlQ) setParam('q', debouncedTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm])

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

  return (
    <div className="container flex flex-col gap-[14px] pb-24 pt-5 md:pb-10">
      <header className="flex flex-col gap-[6px]">
        <h1 className="font-display text-[22px] font-bold text-forest">Katalog</h1>
        <p className="text-[12.5px] text-sage">Semua yang bisnismu butuhkan, dalam satu langganan.</p>
      </header>

      {/* search */}
      <div className="flex h-[42px] items-center gap-[10px] rounded-full bg-white px-4 outline outline-1 outline-line outline-offset-[-0.5px]">
        <Search className="h-[15px] w-[15px] shrink-0 text-sage" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Cari produk…"
          aria-label="Cari produk"
          className="w-full bg-transparent text-[13px] text-forest outline-none placeholder:text-sage"
        />
      </div>

      {/* sort + count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <span className="text-[12px] text-sage">Urut:</span>
          <select
            aria-label="Urutkan produk"
            value={urut}
            onChange={(e) => setParam('urut', e.target.value)}
            className="cursor-pointer rounded-full bg-white px-[12px] py-[6px] text-[12px] text-forest outline outline-1 outline-line outline-offset-[-0.5px]"
          >
            <option value="terbaru">Terbaru</option>
            <option value="murah">Harga termurah</option>
            <option value="mahal">Harga termahal</option>
          </select>
        </div>
        <span className="text-[11.5px] text-sage">{filtered.length} produk</span>
      </div>

      {/* chips kategori */}
      <div className="no-scrollbar -mx-5 flex gap-[8px] overflow-x-auto px-5">
        {KATEGORI.map((k) => (
          <Chip key={k.value} active={kategori === k.value} onClick={() => setParam('kategori', k.value)}>
            {k.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <StateScreen
          icon={<SearchX className="h-[24px] w-[24px]" />}
          title="Tidak ada produk"
          desc={`"${debouncedTerm || kategori}" tidak ditemukan`}
          actionLabel="Reset Filter"
          onAction={() => {
            setTerm('')
            router.replace('/produk', { scroll: false })
          }}
        />
      ) : grouped ? (
        <>
          <section className="flex flex-col gap-[12px]">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-sage">Kasir &amp; HR</h2>
            <div className="grid grid-cols-2 gap-[12px] md:grid-cols-3 lg:grid-cols-4">
              {main.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
          {addons.length > 0 ? (
            <section className="flex flex-col gap-[12px]">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-sage">Add-on</h2>
              <div className="grid grid-cols-2 gap-[12px] md:grid-cols-3 lg:grid-cols-4">
                {addons.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-[12px] md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
