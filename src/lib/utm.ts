// UTM capture — api-contract.md §5. sessionStorage `kodeva-utm`, LAST-TOUCH:
// kedatangan dengan UTM baru MENIMPA nilai lama. Bertahan lintas navigasi
// (sessionStorage) — dipakai submit lead form & checkout.
import type { UtmObject } from './schemas'

const STORAGE_KEY = 'kodeva-utm'

export interface StoredUtm extends UtmObject {
  capturedAt: string
  landingPath: string
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'] as const
const CLICK_IDS = ['gclid', 'fbclid'] as const

/** Baca query string → UtmObject (null bila tidak ada parameter UTM sama sekali). */
export function utmFromSearch(search: string): UtmObject | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(search)
  const out: Record<string, string> = {}
  let any = false
  for (const key of UTM_KEYS) {
    const v = params.get(`utm_${key}`)
    if (v) {
      out[key] = v.slice(0, 120) // batas utmSchema
      any = true
    }
  }
  for (const key of CLICK_IDS) {
    const v = params.get(key)
    if (v) {
      out[key] = v.slice(0, 120)
      any = true
    }
  }
  return any ? (out as UtmObject) : null
}

/**
 * Simpan UTM dari URL saat ini — dipanggil <UtmCapture/> SEKALI per mount
 * (last-touch: menimpa). Return nilai yang tersimpan (untuk debug drawer).
 */
export function captureFromLocation(): StoredUtm | null {
  if (typeof window === 'undefined') return null
  const utm = utmFromSearch(window.location.search)
  if (!utm) return null
  const stored: StoredUtm = {
    ...utm,
    capturedAt: new Date().toISOString(),
    landingPath: window.location.pathname,
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // sessionStorage penuh/diblok — atribusi hilang untuk sesi ini, bukan fatal
  }
  return stored
}

/** UtmObject tersimpan untuk payload lead/checkout — null bila belum ada. */
export function getUtm(): UtmObject | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { capturedAt: _c, landingPath: _l, ...utm } = JSON.parse(raw) as StoredUtm
    return Object.keys(utm).length ? utm : null
  } catch {
    return null
  }
}

/** Versi lengkap (dengan capturedAt/landingPath) — untuk tracking drawer. */
export function getStoredUtm(): StoredUtm | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredUtm) : null
  } catch {
    return null
  }
}
