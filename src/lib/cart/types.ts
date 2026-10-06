// Tipe cart — data-design.md §3. Store zustand (client) memakai tipe ini;
// pure functions (quota/totals) hanya butuh CartLine → tidak bergantung zustand.
export type PackageId = 'basic' | 'pro' | 'business'
export type Duration = 'monthly' | 'yearly'

export interface CartLine {
  productId: number
  slug: string
  name: string // display tanpa fetch ulang
  package: PackageId
  duration: Duration // default 'monthly'
  qty: number // jumlah lisensi
  unitPriceSnapshot: number // harga satuan SAAT add (integer rupiah)
  originalUnitPriceSnapshot?: number // utk harga coret
}

/** key baris — baris dengan key sama di-merge saat add */
export function cartLineKey(line: Pick<CartLine, 'productId' | 'package' | 'duration'>): string {
  return `${line.productId}:${line.package}:${line.duration}`
}

export interface AddResult {
  ok: boolean
  added: number
  clampedTo?: number
  reason?: 'quota'
}
