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

// RealJevClient — adapter docs.typesafe.ai (POST /v1/systemone, Bearer auth).
// Satu request = 2 pertanyaan: noul (p convert) + choice (produk mana).
// throw = caller WAJIB catch (advisory-only).
const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const JEV_MODEL = 'jev-latest'
const JEV_TIMEOUT_MS = 15_000

export interface RealJevConfig {
  apiKey?: string // default process.env.JEV_API_KEY
  model?: string
  /** kriteria produk untuk pertanyaan choice (margin) */
  productCriteria?: Record<string, string>
}

const DEFAULT_PRODUCT_CRITERIA: Record<string, string> = {
  kasir: 'Aplikasi kasir / POS untuk toko, warung, kafe, retail',
  hr: 'Software HR & penggajian untuk kelola karyawan',
  addon: 'Add-on: invoice, backup cloud, notifikasi WhatsApp, e-faktur',
  none: 'Belum jelas produk apa yang diminati',
}

interface SystemOneResponse {
  model?: string
  answers?: {
    will_buy?: { noul?: number }
    product_of_interest?: { confidence?: number; choice?: string }
  }
  usage?: { input_tokens?: number; output_tokens?: number }
}

export class RealJevClient implements JevClient {
  private apiKey: string | undefined
  private model: string
  private productCriteria: Record<string, string>

  constructor(cfg: RealJevConfig = {}) {
    this.apiKey = cfg.apiKey ?? process.env.JEV_API_KEY
    this.model = cfg.model ?? JEV_MODEL
    this.productCriteria = cfg.productCriteria ?? DEFAULT_PRODUCT_CRITERIA
  }

  async decide(features: LeadFeatures): Promise<JevDecision> {
    if (!this.apiKey) throw new Error('JEV_API_KEY tidak diset')

    const state = {
      lead_form_submission: {
        utm_source: features.utmSource,
        utm_medium: features.utmMedium,
        utm_campaign: features.utmCampaign,
        contact_channel: features.contactType === 'wa' ? 'whatsapp' : 'email',
        landing_page: features.landingPath,
        submitted_hour_local: features.hourLocal,
        seconds_to_fill_form: Math.round(features.formElapsedMs / 1000),
        name_length: features.nameLength,
        business: 'UMKM Indonesia menjual barang/jasa, mempertimbangkan software berlangganan (aplikasi kasir, HR & payroll, add-on) mulai Rp149 ribu/lisensi/bulan, promo kuota terbatas berakhir akhir tahun.',
      },
    }

    const body = {
      model: this.model,
      state,
      questions: {
        will_buy: {
          type: 'noul',
          instructions: 'This lead will eventually purchase a license (convert) within 30 days',
          criteria: {
            true: 'Signals of real buying intent: relevant landing page, deliberate form filling, business-relevant traffic source',
            false: 'Browsing casually, bot-like speed, or no fit with the product',
          },
        },
        product_of_interest: {
          type: 'choice',
          instructions: 'Which product is this lead most interested in?',
          criteria: this.productCriteria,
        },
      },
    }

    const started = Date.now()
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), JEV_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(TYPESAFE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      throw new Error(`Jev API ${res.status}: ${(await res.text()).slice(0, 200)}`)
    }

    const json = (await res.json()) as SystemOneResponse
    const noul = json.answers?.will_buy?.noul
    if (typeof noul !== 'number') throw new Error('Jev API: jawaban will_buy.noul tidak ditemukan')

    return {
      p: noul,
      margin: json.answers?.product_of_interest?.confidence,
      model: json.model ?? this.model,
      raw: json,
      latencyMs: Date.now() - started,
    }
  }
}
