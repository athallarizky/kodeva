// Satu pintu dataLayer (GA4 shape) — api-contract.md §4.
// ATURAN ANTI-DUPLIKAT: event HANYA ditembakkan di intent handler
// (click / submit sukses / aksi store) — DILARANG di useEffect re-run.

type DataLayerItem = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: DataLayerItem[]
  }
}

export function track(event: DataLayerItem): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ...event })
}

export type TrackEcommerceItem = {
  item_id: string
  item_name: string
  item_category?: string
  item_variant?: string
  price: number
  quantity: number
}

/** klik CTA hero/banner — event #4 di api-contract */
export function trackLandingCtaClick(ctaLabel: string, ctaLocation: 'hero' | 'banner'): void {
  track({
    event: 'landing_cta_click',
    campaign: 'promo-akhir-tahun',
    cta_label: ctaLabel,
    cta_location: ctaLocation,
  })
}

/** lihat halaman produk — HANYA sekali per produk (guard useRef di komponen) */
export function trackViewItem(item: TrackEcommerceItem): void {
  track({
    event: 'view_item',
    ecommerce: { items: [item] },
  })
}

/** tambah ke keranjang berhasil — value = total baris (api-contract §4) */
export function trackAddToCart(item: TrackEcommerceItem, value: number): void {
  track({
    event: 'add_to_cart',
    ecommerce: { items: [item], value },
  })
}

/** mulai checkout — sekali per intent (klik lanjut ke checkout) */
export function trackBeginCheckout(items: TrackEcommerceItem[], value: number): void {
  track({
    event: 'begin_checkout',
    ecommerce: { items, value },
  })
}
