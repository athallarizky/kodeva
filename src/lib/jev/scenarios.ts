// Skenario generator — schema.md §4. β = proses sejati (ground truth) yang
// HANYA diketahui generator. Jev (black box) tidak melihat ini.
import type { ScenarioId, ScenarioSpec } from './types'

export const SCENARIOS: Record<ScenarioId, ScenarioSpec> = {
  // netral: konversi rata-rata ~13–16%
  baseline: {
    id: 'baseline',
    label: 'Baseline (in-distribution)',
    n: 1000,
    beta: { intercept: -2.7, instagram: 0.3, google: 0.8, waContact: 0.7, hourPeak: 0.4, landingIsProduk: 0.9 },
    sourceWeights: { instagram: 40, tiktok: 25, google: 15, direct: 15, whatsapp: 5 },
  },
  // covariate shift: trafik bergeser ke IG/tiktok + IG jadi 3x lebih panas
  'drift-source': {
    id: 'drift-source',
    label: 'Drift source (trafik IG/TikTok mendominasi)',
    n: 500,
    beta: { intercept: -2.7, instagram: 0.9, google: 0.8, waContact: 0.7, hourPeak: 0.4, landingIsProduk: 0.9 },
    sourceWeights: { instagram: 60, tiktok: 30, google: 4, direct: 4, whatsapp: 2 },
  },
  // concept shift: promo berakhir — baseline konversi jatuh ke ~6%
  'drift-price': {
    id: 'drift-price',
    label: 'Drift price (promo berakhir, konversi turun)',
    n: 500,
    beta: { intercept: -3.9, instagram: 0.3, google: 0.8, waContact: 0.7, hourPeak: 0.4, landingIsProduk: 0.9 },
    sourceWeights: { instagram: 40, tiktok: 25, google: 15, direct: 15, whatsapp: 5 },
  },
}

export function getScenario(id: ScenarioId): ScenarioSpec {
  return SCENARIOS[id]
}
