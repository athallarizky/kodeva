// POST /api/jev/run — trigger eksperimen (ADMIN ONLY).
// Pagar: n ≤ 200/request (biaya PAYG + waktu); runner internal ≤ 1000.
// maxDuration 60s: batch real n=100 ≈ 30–40s (PAYG ~300ms/lead + 2× DB write).
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { runExperiment } from '@/lib/jev/run'
import type { ScenarioId } from '@/lib/jev/types'

export const maxDuration = 60

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

  let body: { scenario?: string; n?: number; engine?: string; salt?: number }
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
  const salt = Number.isFinite(body.salt) ? Math.max(0, Math.min(9_999, Math.floor(body.salt as number))) : 0

  const result = await runExperiment({ scenario, n, engine, salt })
  return NextResponse.json({ ok: true, result })
}
