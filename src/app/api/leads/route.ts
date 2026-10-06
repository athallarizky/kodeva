// POST /api/leads — api-contract.md §2. Urutan wajib:
// 1) parse zod → 400 detail per-field; 2) anti-spam → 422 BERBENTUK sukses
// (jangan kasih tahu bot); 3) simpan; 4) (sprint-2) skor JEV advisory;
// 5) 201 {ok, leadId}
import configPromise from '@payload-config'
import { getPayload, PayloadRequest } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { leadInputSchema } from '@/lib/schemas'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, errors: [{ path: 'body', message: 'JSON tidak valid' }] }, { status: 400 })
  }

  // 1) Validasi
  const parsed = leadInputSchema.safeParse(body)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }
  const input = parsed.data

  // 2) Anti-spam: honeypot terisi ATAU submit terlalu cepat (<3 detik)
  if (input.honeypot !== '' || input.elapsedMs < 3000) {
    // Respons berbentuk sukses agar bot tidak belajar — cukup dilog
    console.warn('[leads] spam tersaring:', { honeypot: input.honeypot !== '', elapsedMs: input.elapsedMs })
    return NextResponse.json({ ok: true, leadId: null }, { status: 422 })
  }

  // 3) Simpan ke collection leads (field utm dari payload client — sessionStorage)
  const payload = await getPayload({ config: configPromise })
  const lead = await payload.create({
    collection: 'leads',
    data: {
      name: input.name,
      contact: input.contact,
      landingPath: input.landingPath,
      campaign: input.utm?.campaign ?? 'promo-akhir-tahun',
      utm: input.utm ?? {},
    },
    req: { context: {} } as PayloadRequest, // server-side: tanpa user session
  })

  // 4) Skor JEV — advisory (gagal TIDAK menggagalkan lead; sprint-2 live pipeline)
  try {
    const { RealJevClient } = await import('@/lib/jev/client')
    const { buildLeadFeatures, jevUpdatePayload, scoreLead } = await import('@/lib/jev/score-lead')
    const features = buildLeadFeatures({
      utm: input.utm ?? {},
      landingPath: input.landingPath,
      contact: input.contact,
      createdAt: new Date().toISOString(),
      name: input.name,
      formElapsedMs: input.elapsedMs,
    })
    const result = await scoreLead(features, new RealJevClient())
    const update = jevUpdatePayload(result, 'live')
    ;(update.jev as Record<string, unknown>).input = features
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: update,
      req: { context: {} } as PayloadRequest,
    })
  } catch {
    // advisory-only: biarkan jev.scored=false — lead tetap valid
  }

  // 5) Sukses
  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 })
}
