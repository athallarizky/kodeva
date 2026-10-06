// Test skema shared — api-contract.md §1.
import { describe, expect, it } from 'vitest'

import { buyerSchema, contactSchema, leadInputSchema, orderInputSchema } from '@/lib/schemas'

describe('contactSchema — email ATAU WhatsApp Indonesia', () => {
  it.each(['budi@warungnya.id', 'nama.lengkap+tag@domain.co.id'])('email valid: %s', (v) => {
    expect(contactSchema.safeParse(v).success).toBe(true)
  })

  it.each(['081234567890', '+6281234567890', '62812345678901', '0812-3456-7890'])('WA valid: %s', (v) => {
    expect(contactSchema.safeParse(v).success).toBe(true)
  })

  it.each(['salah', 'budi@', '@domain.id', '0812345', '02123456789', 'budi @x.id'])('invalid: %s', (v) => {
    expect(contactSchema.safeParse(v).success).toBe(false)
  })
})

describe('leadInputSchema', () => {
  const base = {
    name: 'Budi Santoso',
    contact: 'budi@warungnya.id',
    honeypot: '',
    elapsedMs: 8450,
  }

  it('payload valid lolos; landingPath default "/"', () => {
    const r = leadInputSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.landingPath).toBe('/')
  })

  it('honeypot NON-KOSONG tetap lolos zod (pengecekan isi = urusan anti-spam route, jangan bocor ke 400)', () => {
    const r = leadInputSchema.safeParse({ ...base, honeypot: 'http://spam link' })
    expect(r.success).toBe(true)
  })

  it('nama terlalu pendek → gagal dengan pesan', () => {
    const r = leadInputSchema.safeParse({ ...base, name: 'B' })
    expect(r.success).toBe(false)
  })
})

describe('buyerSchema', () => {
  it('nama + email valid', () => {
    expect(buyerSchema.safeParse({ name: 'Budi Santoso', email: 'budi@x.id' }).success).toBe(true)
  })
  it('email rusak → gagal', () => {
    expect(buyerSchema.safeParse({ name: 'Budi', email: 'budi@' }).success).toBe(false)
  })
})

describe('orderInputSchema', () => {
  const item = {
    productId: 9,
    slug: 'kodeva-kasir',
    name: 'Kodeva Kasir',
    package: 'pro',
    duration: 'monthly',
    qty: 3,
    unitPriceSnapshot: 299000,
  }
  const base = {
    buyer: { name: 'Budi Santoso', email: 'budi@x.id' },
    items: [item],
    simulate: 'success' as const,
  }

  it('order valid lolos', () => {
    expect(orderInputSchema.safeParse(base).success).toBe(true)
  })

  it('items kosong → gagal (keranjang kosong)', () => {
    expect(orderInputSchema.safeParse({ ...base, items: [] }).success).toBe(false)
  })

  it('paket di luar enum → gagal', () => {
    expect(orderInputSchema.safeParse({ ...base, items: [{ ...item, package: 'premium' }] }).success).toBe(false)
  })

  it('simulate hanya success|failure', () => {
    expect(orderInputSchema.safeParse({ ...base, simulate: 'maybe' }).success).toBe(false)
  })

  it('harga harus integer rupiah (float ditolak)', () => {
    expect(orderInputSchema.safeParse({ ...base, items: [{ ...item, unitPriceSnapshot: 149000.5 }] }).success).toBe(false)
  })
})
