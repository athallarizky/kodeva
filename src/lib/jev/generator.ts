// Synthetic outcome generator — schema.md §4. Deterministik per seed.
// Kita MENGETAHUI pTrue (proses sejati) — inilah ground truth audit Jev.
import type { LeadFeatures, LeadSource, ScenarioId, ScenarioSpec, SyntheticLeadData } from './types'

/** PRNG deterministik (mulberry32) — seed sama ⇒ sampel identik */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function logit(p: number): number {
  const clipped = Math.min(Math.max(p, 1e-6), 1 - 1e-6)
  return Math.log(clipped / (1 - clipped))
}

/** kurva aktivitas bisnis: puncak ~13:00, melebar ±beberapa jam */
export function hourPeakValue(hourLocal: number): number {
  return Math.exp(-((hourLocal - 13) ** 2) / 18)
}

function weightedPick<T extends string>(rng: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [k, w] of entries) {
    r -= w
    if (r <= 0) return k
  }
  return entries[entries.length - 1][0]
}

/** proses sejati: logit(pTrue) = β · features — PURE, diketahui hanya generator */
export function pTrueOf(features: LeadFeatures, scenario: ScenarioSpec): number {
  const b = scenario.beta
  const z =
    b.intercept +
    (features.utmSource === 'instagram' ? b.instagram : 0) +
    (features.utmSource === 'google' ? b.google : 0) +
    (features.contactType === 'wa' ? b.waContact : 0) +
    b.hourPeak * hourPeakValue(features.hourLocal) +
    (features.landingPath.startsWith('/produk') ? b.landingIsProduk : 0)
  return sigmoid(z)
}

/** sampel satu lead sintetis — semua keacakan dari rng (deterministik per seed) */
export function sampleFeatures(rng: () => number, scenario: ScenarioSpec): LeadFeatures {
  const source = weightedPick<LeadSource>(rng, scenario.sourceWeights)
  const hourLocal = Math.floor(rng() * 24)
  const contactType: LeadFeatures['contactType'] = rng() < 0.45 ? 'wa' : 'email'
  const onProduk = rng() < 0.35
  const elapsed = Math.round(4_000 + rng() * 120_000) // 4s..~2m (di atas anti-spam 3s)
  const nameLength = Math.round(3 + rng() * 25)

  return {
    utmSource: source,
    utmMedium: source === 'google' ? 'cpc' : source === 'direct' ? 'none' : 'social',
    utmCampaign: 'promo-akhir-tahun',
    contactType,
    landingPath: onProduk ? '/produk/kodeva-kasir' : '/',
    hourLocal,
    formElapsedMs: elapsed,
    nameLength,
  }
}

/** satu lead sintetis lengkap (features + ground truth) — unit kerja generator */
export function generateSyntheticLead(scenario: ScenarioSpec, seed: number): SyntheticLeadData {
  const rng = mulberry32(seed)
  const features = sampleFeatures(rng, scenario)
  const pTrue = pTrueOf(features, scenario)
  const converted = rng() < pTrue // Bernoulli(pTrue) — masih dari rng yang sama
  return { seed, scenario: scenario.id, features, pTrue, converted }
}

/** batch untuk satu skenario — seed = hashStabil(scenario, index) */
export function generateBatch(scenario: ScenarioSpec, n: number, seedBase: number): SyntheticLeadData[] {
  return Array.from({ length: n }, (_, i) => generateSyntheticLead(scenario, seedBase + i * 7919))
}
