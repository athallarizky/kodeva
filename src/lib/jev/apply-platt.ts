// Platt wrapper atas data tersimpan — RQ2 (schema.md §5).
// Fit dari (p, outcome) lead yang sudah diskor; tulis pPlatt per lead.
// Gratis: bekerja murni dari DB, tanpa panggilan API.
import configPromise from '@payload-config'
import { getPayload, PayloadRequest, type Where } from 'payload'

import { ece, eceVsTrue, plattApply, plattFit, type PlattParams } from './calibration'
import { priorityTier, roundScore } from './score-lead'

export interface PlattSummary {
  n: number
  params: PlattParams
  eceBefore: number
  eceAfter: number
  eceTrueAfter: number | null
}

export interface ScoredLeadRow {
  p: number
  pTrue: number | null
  converted: boolean | null
  margin?: number | null
}

/** fit + ringkasan perbaikan (tanpa menulis DB).
 *  Fit HANYA dari lead dengan outcome diketahui — lead live (converted null)
 *  tidak boleh dihitung sebagai "tidak konversi" karena akan menekan kurva ke bawah. */
export function plattSummary(rows: ScoredLeadRow[]): PlattSummary | null {
  const usable = rows.filter((r) => typeof r.p === 'number' && Number.isFinite(r.p) && r.converted !== null)
  if (usable.length < 10) return null // terlalu sedikit untuk fit bermakna

  const ps = usable.map((r) => r.p)
  const ys = usable.map((r) => (r.converted ? 1 : 0))
  const params = plattFit(ps, ys)
  const after = ps.map((p) => plattApply(p, params))

  const trueRows = usable.filter((r) => typeof r.pTrue === 'number')
  return {
    n: usable.length,
    params,
    eceBefore: ece(ps, ys),
    eceAfter: ece(after, ys),
    eceTrueAfter: trueRows.length
      ? eceVsTrue(after, trueRows.map((r) => r.pTrue as number))
      : null,
  }
}

/** fit lalu TULIS pPlatt ke setiap lead terkait — idempoten (refit menimpa) */
export async function applyPlatt(
  filter: { scenario?: string; model?: string } = {},
): Promise<PlattSummary | null> {
  const payload = await getPayload({ config: configPromise })

  const and: Where[] = [{ 'jev.scored': { equals: true } }]
  if (filter.scenario) and.push({ 'jev.scenario': { equals: filter.scenario } })
  if (filter.model) and.push({ 'jev.model': { equals: filter.model } })

  const found = await payload.find({
    collection: 'leads',
    limit: 2000,
    pagination: false,
    where: { and },
  })

  const rows: ScoredLeadRow[] = found.docs.map((d) => ({
    p: d.jev?.p ?? NaN,
    pTrue: typeof d.jev?.pTrue === 'number' ? d.jev.pTrue : null,
    converted: d.outcome?.converted ?? null,
  }))
  const summary = plattSummary(rows)
  if (!summary) return null

  for (const doc of found.docs) {
    if (typeof doc.jev?.p !== 'number') continue
    const pPlatt = plattApply(doc.jev.p, summary.params)
    await payload.update({
      collection: 'leads',
      id: doc.id,
      data: {
        // re-tier + kolom tampilan mengikuti skor terkoreksi Platt
        priority: priorityTier(pPlatt),
        potensiKonversi: roundScore(pPlatt),
        jev: {
          ...doc.jev,
          pPlatt,
        },
      },
      req: { context: {} } as PayloadRequest,
    })
  }

  return summary
}
