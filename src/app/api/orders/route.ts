// POST /api/orders — MOCK (api-contract.md §3). Server TIDAK menyimpan order
// permanen & TIDAK men-decrement kuota (data-design §0.2).
// Validasi buyer + shape item + KUOTA ULANG terhadap DB → delay deterministik.
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { orderInputSchema } from '@/lib/schemas'
import { buildQuotaIndex, validateCartAgainstQuota } from '@/lib/quota'
import type { CartLine } from '@/lib/cart/types'

/** orderId dummy: KDV- + 4 char base36 dari timestamp+seed */
function makeOrderId(): string {
  const n = Date.now() + Math.floor(Math.random() * 1e6)
  return `KDV-${n.toString(36).slice(-4).toUpperCase().padStart(4, '0')}`
}

/** delay deterministik per orderId (bukan random murni): 1500–3000ms */
function simulatedLatencyMs(orderId: string): number {
  let h = 0
  for (const ch of orderId) h = (h * 31 + ch.charCodeAt(0)) % 1000
  return 1500 + Math.round((h / 999) * 1500)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const parsed = orderInputSchema.safeParse(body)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }
  const input = parsed.data

  // Re-validasi kuota terhadap DB (produk promo aktif)
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    limit: 100,
    pagination: false,
    select: {
      id: true,
      promoQuota: true,
    },
  })
  const cart: CartLine[] = input.items.map((i) => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    package: i.package,
    duration: i.duration,
    qty: i.qty,
    unitPriceSnapshot: i.unitPriceSnapshot,
    originalUnitPriceSnapshot: i.originalUnitPriceSnapshot,
  }))
  const quota = validateCartAgainstQuota(cart, buildQuotaIndex(products.docs))
  if (!quota.ok) {
    return NextResponse.json(
      { ok: false, reason: 'quota_exceeded', violations: quota.violations },
      { status: 409 },
    )
  }

  const orderId = makeOrderId()
  await new Promise((r) => setTimeout(r, simulatedLatencyMs(orderId)))

  if (input.simulate === 'failure') {
    return NextResponse.json({ ok: false, orderId, reason: 'payment_failed' }, { status: 402 })
  }

  // Mock: tidak persist, tidak decrement kuota — tercatat di README integration-plan
  return NextResponse.json({ ok: true, orderId, status: 'paid' }, { status: 201 })
}
