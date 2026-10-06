// Runner eksperimen — schema.md §2/§8. Orkestrasi: generate → create lead
// (dengan ground truth) → skor (Jev TIDAK melihat pTrue) → update jev → metrics.
// Pagar biaya PAYG: ceiling hard-coded; runner idempoten per runId via seedBase.
import configPromise from '@payload-config'
import { getPayload, Payload } from 'payload'

import { MockJevClient, RealJevClient } from './client'
import type { PayloadRequest } from 'payload'
import { brier, ece, eceVsTrue, reliability } from './calibration'
import { generateBatch } from './generator'
import { getScenario } from './scenarios'
import { jevUpdatePayload, priorityTier, scoreLead } from './score-lead'
import type { JevClient, ScenarioId } from './types'

export interface RunSpec {
  scenario: ScenarioId
  n: number
  engine: 'mock' | 'real'
  seedBase?: number
}

export interface RunResult {
  runId: string
  scenario: ScenarioId
  engine: 'mock' | 'real'
  n: number
  scoredOk: number
  scoredFail: number
  metrics: {
    ece: number
    eceTrue: number
    brier: number
    reliability: ReturnType<typeof reliability>
    latencyP50Ms: number
    latencyP95Ms: number
    model: string | null
  }
}

const MAX_N_PER_RUN = 1000 // pagar PAYG — schema.md §0 (matriks penuh = 3 run)

function percentile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((q / 100) * sorted.length))
  return sorted[idx]
}

export function makeClient(engine: 'mock' | 'real'): JevClient {
  if (engine === 'real') return new RealJevClient()
  return new MockJevClient({ seedBase: 2026 }) // mock netral (tanpa binBias)
}

export async function runExperiment(spec: RunSpec): Promise<RunResult> {
  const scenario = getScenario(spec.scenario)
  const n = Math.min(spec.n, scenario.n, MAX_N_PER_RUN)
  const seedBase = spec.seedBase ?? hashSeed(spec.scenario, n)
  const client = makeClient(spec.engine)
  const payload = await getPayload({ config: configPromise })

  const batch = generateBatch(scenario, n, seedBase)
  const latencies: number[] = []
  let scoredOk = 0
  let scoredFail = 0
  let model: string | null = null

  for (const lead of batch) {
    // 1) simpan lead sintetis (ground truth ikut; Jev belum melihat apa pun)
    const doc = await createSyntheticLeadDoc(payload, lead)

    // 2) skor (advisory; gagal tidak menggagalkan)
    const result = await scoreLead(lead.features, client)
    if (result.ok && result.decision) {
      scoredOk++
      latencies.push(result.decision.latencyMs)
      model = result.decision.model
    } else {
      scoredFail++
    }

    // 3) simpan hasil skor + pTrue + tier prioritas
    const update = jevUpdatePayload(result, lead.scenario, { pTrue: lead.pTrue })
    ;(update.jev as Record<string, unknown>).input = lead.features
    if (result.ok && result.decision) {
      ;(update as Record<string, unknown>).priority = priorityTier(result.decision.p)
    }
    await payload.update({
      collection: 'leads',
      id: doc.id,
      data: update,
      req: { context: {} } as PayloadRequest,
    })
  }

  // 4) metrics dari data tersimpan (analisis ulang gratis — tanpa panggil API)
  const scored = await payload.find({
    collection: 'leads',
    limit: n,
    pagination: false,
    where: {
      and: [
        { 'outcome.generatorSeed': { greater_than: seedBase - 1 } },
        { 'outcome.generatorSeed': { less_than: seedBase + n * 7919 } },
      ],
    },
  })

  const ps: number[] = []
  const ys: number[] = []
  const pTrues: number[] = []
  for (const doc2 of scored.docs) {
    if (doc2.jev?.scored && typeof doc2.jev.p === 'number') {
      ps.push(doc2.jev.p)
      ys.push(doc2.outcome?.converted ? 1 : 0)
      if (typeof doc2.jev.pTrue === 'number') pTrues.push(doc2.jev.pTrue)
    }
  }

  const sortedLat = [...latencies].sort((a, b) => a - b)
  return {
    runId: `${spec.engine}:${spec.scenario}:${seedBase}`,
    scenario: spec.scenario,
    engine: spec.engine,
    n,
    scoredOk,
    scoredFail,
    metrics: {
      ece: ece(ps, ys),
      eceTrue: eceVsTrue(ps, pTrues),
      brier: brier(ps, ys),
      reliability: reliability(ps, ys),
      latencyP50Ms: percentile(sortedLat, 50),
      latencyP95Ms: percentile(sortedLat, 95),
      model,
    },
  }
}

async function createSyntheticLeadDoc(
  payload: Payload,
  lead: ReturnType<typeof generateBatch>[number],
) {
  return payload.create({
    collection: 'leads',
    data: {
      name: syntheticName(lead.seed),
      contact:
        lead.features.contactType === 'wa'
          ? `08${String(1200000000 + (lead.seed % 800000000)).slice(0, 11)}`
          : `lead${lead.seed}@umkm.test`,
      landingPath: lead.features.landingPath,
      campaign: lead.features.utmCampaign,
      utm: {
        source: lead.features.utmSource,
        medium: lead.features.utmMedium,
        campaign: lead.features.utmCampaign,
      },
      outcome: {
        converted: lead.converted,
        generatorSeed: lead.seed,
      },
      // jev diisi setelah scoring (langkah 3)
    },
    req: { context: {} } as PayloadRequest,
  })
}

function syntheticName(seed: number): string {
  const names = ['Aisyah', 'Bambang', 'Citra', 'Dedi', 'Eka', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko']
  return `${names[seed % names.length]} ${['Wijaya', 'Saputra', 'Lestari', 'Nugrooh', 'Pratama'][(seed >> 3) % 5]}`
}

function syntheticContact(seed: number): string {
  // WA-style untuk mendapatkan variasi contactType sesuai fitur — dibuat konsisten
  // dengan contactType fitur oleh caller? Sederhana: deterministik dari seed.
  return `08${String(1200000000 + (seed % 800000000)).slice(0, 11)}`
}

function hashSeed(scenario: string, n: number): number {
  let h = 2166136261
  const s = `${scenario}:${n}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1_000_000
}
