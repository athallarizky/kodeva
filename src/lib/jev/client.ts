// JevClient — schema.md §2 (K2: mock-first).
// MockJevClient = black box palsu yang BISA DITANAM BIAS-nya (positive control):
// harness harus membuktikan mampu mendeteksi bias yang sengaja ditanam
// SEBELUM dipercaya mengaudit Jev asli.
import { mulberry32, sigmoid, hourPeakValue } from './generator'
import type { JevClient, JevDecision, LeadFeatures } from './types'

export interface MockJevConfig {
  seedBase: number
  /**
   * "pelatihan" mock: β milik mock sendiri — sengaja TIDAK sama dengan β generator
   * (meniru model dunia yang berbeda). Default = asumsi baseline.
   */
  modelBeta?: {
    intercept: number
    instagram: number
    google: number
    waContact: number
    hourPeak: number
    landingIsProduk: number
  }
  /** bias per bin decile (10 elemen) — miskalibrasi yang DITANAM; default netral */
  binBias?: number[]
  /** noise gaussian σ pada logit — 0 default */
  noiseSigma?: number
  /** simulasi latency ms */
  latencyMs?: number
}

const DEFAULT_MODEL_BETA = {
  intercept: -2.6,
  instagram: 0.25,
  google: 0.7,
  waContact: 0.65,
  hourPeak: 0.35,
  landingIsProduk: 0.8,
}

function gaussian(rng: () => number, sigma: number): number {
  if (sigma <= 0) return 0
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sigma
}

export class MockJevClient implements JevClient {
  readonly model = 'mock-jev-v1'
  private cfg: MockJevConfig

  constructor(cfg: MockJevConfig) {
    this.cfg = cfg
  }

  /** deterministik per (seedBase, fitur) — dua lead identik ⇒ p identik */
  async decide(features: LeadFeatures): Promise<JevDecision> {
    const b = this.cfg.modelBeta ?? DEFAULT_MODEL_BETA
    // seed dari fitur (hash sederhana) — bukan dari index/urutan
    const key = this.featureKey(features)
    const rng = mulberry32(this.cfg.seedBase + key)

    let z =
      b.intercept +
      (features.utmSource === 'instagram' ? b.instagram : 0) +
      (features.utmSource === 'google' ? b.google : 0) +
      (features.contactType === 'wa' ? b.waContact : 0) +
      b.hourPeak * hourPeakValue(features.hourLocal) +
      (features.landingPath.startsWith('/produk') ? b.landingIsProduk : 0)
    z += gaussian(rng, this.cfg.noiseSigma ?? 0)

    let p = sigmoid(z)

    // tanam bias per bin decile (positive control)
    const binBias = this.cfg.binBias
    if (binBias && binBias.length === 10) {
      const bin = Math.min(9, Math.floor(p * 10))
      p = Math.min(0.99, Math.max(0.01, p + binBias[bin]))
    }

    const margin = Math.min(1, p + 0.05) // "confidence kedua" — uji RQ3

    return {
      p,
      margin,
      model: this.model,
      raw: { mock: true, key, z: Number(z.toFixed(4)) },
      latencyMs: this.cfg.latencyMs ?? 25,
    }
  }

  private featureKey(f: LeadFeatures): number {
    const s = `${f.utmSource}|${f.contactType}|${f.landingPath}|${f.hourLocal}|${f.formElapsedMs}|${f.nameLength}`
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }
}

// RealJevClient menyusul Phase 0 (JEV_API_KEY + docs) — kontrak sudah siap:
// export class RealJevClient implements JevClient { ... }
