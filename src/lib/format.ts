// Semua uang = integer rupiah (lihat architecture.md §8 — tidak ada float).
const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatIDR(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return idr.format(value)
}

// Ringkas untuk kartu: 149000 -> "Rp149 rb/bln"
export function formatIDRShort(value: number | null | undefined): string {
  if (typeof value !== 'number') return '-'
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID')} jt`
  if (value >= 1_000) return `Rp${Math.round(value / 1_000).toLocaleString('id-ID')} rb`
  return formatIDR(value)
}
