// POST /api/jev/run — trigger eksperimen (ADMIN ONLY).
// Pagar: n ≤ 200/request (biaya PAYG + waktu); runner internal ≤ 1000.
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { runExperiment } from '@/lib/jev/run'
import type { ScenarioId } from '@/lib/jev/types'

const VALID_SCENARIOS: ScenarioId[] = ['baseline', 'drift-source', 'drift-price']

export async function POST(req: NextRequest): Promise<NextResponse> {
  // auth: hanya admin (roles kosong = bootstrap admin)
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  const roles = (user as { roles?: string[] | null }).roles
  if (!(roles === null || roles === undefined || roles.length === 0 || roles.includes('admin'))) {
    return NextResponse.json({ ok: false, reason: 'forbidden' }, { status: 403 })
  }

  let body: { scenario?: string; n?: number; engine?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const scenario = body.scenario as ScenarioId
  if (!VALID_SCENARIOS.includes(scenario)) {
    return NextResponse.json({ ok: false, reason: 'unknown_scenario' }, { status: 400 })
  }
  const engine = body.engine === 'real' ? 'real' : 'mock'
  const n = Math.max(1, Math.min(200, Math.floor(body.n ?? 100)))

  const result = await runExperiment({ scenario, n, engine })
  return NextResponse.json({ ok: true, result })
}
