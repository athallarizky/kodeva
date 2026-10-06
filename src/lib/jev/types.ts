// Tipe JEV — sprint-2 schema.md §2. Arah data SATU: features → p.
// Jev tidak pernah menerima pTrue/outcome (ground truth milik kita).
export type LeadSource = 'instagram' | 'tiktok' | 'google' | 'direct' | 'whatsapp'

export interface LeadFeatures {
  utmSource: LeadSource
  utmMedium: string
  utmCampaign: string
  contactType: 'email' | 'wa'
  landingPath: string
  hourLocal: number // 0..23
  formElapsedMs: number
  nameLength: number
}

/** kontrak terkunci api-contract.md §7 + latencyMs (audit cost) */
export interface JevDecision {
  p: number // noul — klaim: p(convert) terkalibrasi 0–1
  margin?: number // angka confidence kedua — diuji RQ3 (probabilitas atau margin?)
  model: string
  raw: unknown
  latencyMs: number
}

export interface JevClient {
  /** throw = caller WAJIB catch (advisory-only: gagal tidak boleh menggagalkan lead) */
  decide(features: LeadFeatures): Promise<JevDecision>
}

export type ScenarioId = 'baseline' | 'drift-source' | 'drift-price'

export interface ScenarioSpec {
  id: ScenarioId
  label: string
  n: number
  /** koefisien proses sejati — HANYA diketahui generator (kita) */
  beta: {
    intercept: number
    instagram: number
    google: number
    waContact: number
    hourPeak: number
    landingIsProduk: number
  }
  /** distribusi sampling utmSource (covariate shift) */
  sourceWeights: Record<LeadSource, number>
}

export interface SyntheticLeadData {
  seed: number
  scenario: ScenarioId
  features: LeadFeatures
  pTrue: number
  converted: boolean
}
