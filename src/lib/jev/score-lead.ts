// Pipeline scoring — schema.md §3. Advisory-only: throw di sini TIDAK boleh
// menggagalkan lead; caller (hook/route/runner) WAJIB catch.
import type { JevClient, JevDecision, LeadFeatures } from './types'

/** bangun fitur dari dokumen lead (live) — PURE */
export function buildLeadFeatures(lead: {
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null } | null
  landingPath?: string | null
  contact?: string | null
  createdAt?: string | null
  name?: string | null
  formElapsedMs?: number
}): LeadFeatures {
  const contact = lead.contact ?? ''
  const isWa = /^(\+62|62|0)8/.test(contact.replace(/[\s-]/g, ''))
  const hour = lead.createdAt ? new Date(lead.createdAt).getHours() : 12
  return {
    utmSource: (lead.utm?.source as LeadFeatures['utmSource']) ?? 'direct',
    utmMedium: lead.utm?.medium ?? 'none',
    utmCampaign: lead.utm?.campaign ?? 'unknown',
    contactType: isWa ? 'wa' : 'email',
    landingPath: lead.landingPath ?? '/',
    hourLocal: hour,
    formElapsedMs: lead.formElapsedMs ?? 30_000,
    nameLength: (lead.name ?? '').length,
  }
}

export type PriorityTier = 'panas' | 'hangat' | 'dingin'

/** pembulatan tampilan marketing: 0.2689672942 -> 0.27 (presisi penuh tetap di jev.*) */
export function roundScore(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Tier prioritas utk marketing — dari skor efektif (pPlatt bila sudah dipasang,
 * else p mentah). Pita dikalibrasi ke dunia kodeva (mean pTrue ~0.15, skor
 * terkoreksi max ~0.27): panas = ~top 10%, hangat = di atas rata-rata.
 */
export function priorityTier(effectiveScore: number): PriorityTier {
  if (effectiveScore >= 0.25) return 'panas'
  if (effectiveScore >= 0.15) return 'hangat'
  return 'dingin'
}

export interface ScoreResult {
  ok: boolean
  decision?: JevDecision
  error?: string
}

/** skor satu lead → bentuk field jev siap simpan (tanpa menyendiri; caller menyimpan) */
export async function scoreLead(
  features: LeadFeatures,
  client: JevClient,
): Promise<ScoreResult> {
  try {
    const decision = await client.decide(features)
    return { ok: true, decision }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** bentuk payload update utk field jev (dipakai hook live & runner sintetis) */
export function jevUpdatePayload(
  result: ScoreResult,
  scenario: string,
  extra?: { pTrue?: number },
): Record<string, unknown> {
  if (!result.ok || !result.decision) {
    return {
      jev: {
        scored: false,
        scenario,
        ...(extra?.pTrue !== undefined ? { pTrue: extra.pTrue } : {}),
      },
    }
  }
  const d = result.decision
  return {
    jev: {
      scored: true,
      p: d.p,
      margin: d.margin ?? null,
      model: d.model,
      raw: d.raw,
      latencyMs: d.latencyMs,
      scoredAt: new Date().toISOString(),
      scenario,
      input: undefined, // diisi caller dengan snapshot fitur (lihat runner/hook)
      ...(extra?.pTrue !== undefined ? { pTrue: extra.pTrue } : {}),
    },
  }
}
