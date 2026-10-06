// GET  /api/jev/metrics — metrik per (scenario × model) + antrian lead + preview Platt
// POST /api/jev/metrics — action apply-platt (fit + tulis pPlatt)
// ADMIN ONLY. Gratis: membaca DB, tanpa panggilan API Jev.
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { brier, ece, eceVsTrue, reliability } from '@/lib/jev/calibration'
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
    }))
    const ps = rows.map((r) => r.p).filter((p) => Number.isFinite(p))
    const ys = rows.map((r) => (r.converted ? 1 : 0))
    const pTrues = rows.filter((r) => r.pTrue !== null).map((r) => r.pTrue as number)
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
      ece: ece(ps, ys),
      eceTrue: pTrues.length === ps.length && pTrues.length ? eceVsTrue(ps, pTrues) : null,
      brier: brier(ps, ys),
      reliability: reliability(ps, ys),
      latencyP50Ms: pct(50),
      latencyP95Ms: pct(95),
      platt: plattSummary(rows),
    }
  })

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

  return NextResponse.json({ ok: true, scenarios, queue })
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
