// GET  /api/jev/metrics — metrik per (scenario × model) + ringkasan per model (Platt per-engine)
//        + antrian lead + learning curve (RQ2) + analisis margin (RQ3)
// POST /api/jev/metrics — action apply-platt (fit + tulis pPlatt); kirim { model } untuk per-engine
// ADMIN ONLY. Gratis: membaca DB, tanpa panggilan API Jev.
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { brier, ece, eceVsTrue, learningCurve, marginAnalysis, reliability } from '@/lib/jev/calibration'
import { applyPlatt, plattSummary, type ScoredLeadRow } from '@/lib/jev/apply-platt'

async function requireAdmin(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return { payload, ok: false as const, status: 401, reason: 'unauthorized' }
  const roles = (user as { roles?: string[] | null }).roles
  const isAdmin = roles === null || roles === undefined || roles.length === 0 || roles.includes('admin')
  if (!isAdmin) return { payload, ok: false as const, status: 403, reason: 'forbidden' }
  return { payload, ok: true as const }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status })
  const { payload } = auth

  const scored = await payload.find({
    collection: 'leads',
    limit: 2000,
    pagination: false,
    where: { 'jev.scored': { equals: true } },
    sort: '-jev.p',
  })

  // kelompokkan per scenario × model
  const groups = new Map<string, typeof scored.docs>()
  for (const doc of scored.docs) {
    const key = `${doc.jev?.scenario ?? 'unknown'}|${doc.jev?.model ?? 'unknown'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(doc)
  }

  const scenarios = [...groups.entries()].map(([key, docs]) => {
    const rows: ScoredLeadRow[] = docs.map((d) => ({
      p: d.jev?.p ?? NaN,
      pTrue: typeof d.jev?.pTrue === 'number' ? d.jev.pTrue : null,
      converted: d.outcome?.converted ?? null,
      margin: typeof d.jev?.margin === 'number' ? d.jev.margin : null,
    }))
    // metrik vs outcome hanya dari lead dengan outcome diketahui (lead live belum punya —
    // memaksakan y=0 akan menggelembungkan "ke Confidence" secara palsu)
    const known = rows.filter((r) => Number.isFinite(r.p) && r.converted !== null)
    const ps = known.map((r) => r.p)
    const ys = known.map((r) => (r.converted ? 1 : 0))
    const truePairs = rows.filter((r) => Number.isFinite(r.p) && typeof r.pTrue === 'number')
    // RQ2: learning curve Platt — train n pertama, test di sisa (≥50 agar ECE test bermakna)
    const lcSizes = [25, 50, 100, 250, 500].filter((s) => known.length - s >= 50)
    const curve = lcSizes.length ? learningCurve(ps, ys, lcSizes) : []
    const latencies = docs
      .map((d) => d.jev?.latencyMs ?? 0)
      .filter((x): x is number => typeof x === 'number')
      .sort((a, b) => a - b)
    const pct = (q: number) => (latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor((q / 100) * latencies.length))] : 0)

    const [scenario, model] = key.split('|')
    return {
      scenario,
      model,
      n: docs.length,
      nOutcome: known.length,
      ece: ps.length ? ece(ps, ys) : null,
      eceTrue: truePairs.length ? eceVsTrue(truePairs.map((r) => r.p), truePairs.map((r) => r.pTrue as number)) : null,
      brier: ps.length ? brier(ps, ys) : null,
      reliability: reliability(ps, ys),
      latencyP50Ms: pct(50),
      latencyP95Ms: pct(95),
      platt: plattSummary(rows),
      learningCurve: curve,
      margin: marginAnalysis(rows),
    }
  })

  // ringkasan per ENGINE (model) — dasar tombol "Platt per engine".
  // Fix 3.10: engine mock & real punya bias berbeda — tidak boleh difit dalam satu kurva.
  const byModel = new Map<string, ScoredLeadRow[]>()
  for (const doc of scored.docs) {
    const model = doc.jev?.model
    if (!model) continue
    if (!byModel.has(model)) byModel.set(model, [])
    byModel.get(model)!.push({
      p: doc.jev?.p ?? NaN,
      pTrue: typeof doc.jev?.pTrue === 'number' ? doc.jev.pTrue : null,
      converted: doc.outcome?.converted ?? null,
    })
  }
  const models = [...byModel.entries()].map(([model, mRows]) => ({
    model,
    n: mRows.length,
    platt: plattSummary(mRows),
  }))

  // antrian prioritas: 20 teratas by p
  const queue = scored.docs.slice(0, 20).map((d) => ({
    id: d.id,
    name: d.name,
    contact: d.contact,
    p: d.jev?.p ?? null,
    pPlatt: d.jev?.pPlatt ?? null,
    pTrue: d.jev?.pTrue ?? null,
    scenario: d.jev?.scenario ?? null,
    model: d.jev?.model ?? null,
    converted: d.outcome?.converted ?? null,
    synthetic: typeof d.outcome?.generatorSeed === 'number',
    createdAt: d.createdAt,
  }))

  return NextResponse.json({ ok: true, scenarios, models, queue })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status })

  let body: { scenario?: string; model?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body kosong = tanpa filter
  }

  const summary = await applyPlatt(body)
  if (!summary) {
    return NextResponse.json({ ok: false, reason: 'not_enough_scored_leads' }, { status: 422 })
  }
  return NextResponse.json({ ok: true, summary })
}
