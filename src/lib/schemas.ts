// Skema zod SHARED client & server — api-contract.md §1 (kontrak terkunci).
import { z } from 'zod'

export const contactSchema = z.string().trim().min(5).refine(
  (v) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(v.replace(/[\s-]/g, '')),
  { message: 'Masukkan email aktif atau nomor WhatsApp yang valid' },
)

export const utmSchema = z.object({
  source: z.string().trim().max(120).optional(),
  medium: z.string().trim().max(120).optional(),
  campaign: z.string().trim().max(120).optional(),
  content: z.string().trim().max(120).optional(),
  term: z.string().trim().max(120).optional(),
  gclid: z.string().trim().max(500).optional(),
  fbclid: z.string().trim().max(500).optional(),
})

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  contact: contactSchema,
  landingPath: z.string().max(200).default('/'),
  honeypot: z.string().max(500).optional().default(''), // kekosongannya dicek di anti-spam route, BUKAN di sini (jangan beri tahu bot)
  elapsedMs: z.number().int().min(0), // diisi client sejak mount
  utm: utmSchema.optional(),
})

export const buyerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email('Email tidak valid'),
})

export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(160),
  package: z.enum(['basic', 'pro', 'business']),
  duration: z.enum(['monthly', 'yearly']),
  qty: z.number().int().min(1).max(999),
  unitPriceSnapshot: z.number().int().min(0),
  originalUnitPriceSnapshot: z.number().int().min(0).optional(),
})

export const orderInputSchema = z.object({
  buyer: buyerSchema,
  items: z.array(orderItemSchema).min(1, 'Keranjang kosong'),
  voucher: z.string().trim().max(40).optional(),
  utm: utmSchema.optional(),
  campaign: z.string().trim().max(120).optional(),
  simulate: z.enum(['success', 'failure']),
})

export type LeadInput = z.infer<typeof leadInputSchema>
export type OrderInput = z.infer<typeof orderInputSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type UtmObject = z.infer<typeof utmSchema>
