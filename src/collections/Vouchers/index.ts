import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

import { revalidateVoucher } from './hooks/revalidateVoucher'

// Skema: docs/sprint-0/resources/data-design.md §1.6 (BONUS)
// Dipakai checkout (simulasi). Kuota pemakaian TIDAK di-decrement server (mock).
export const Vouchers: CollectionConfig<'vouchers'> = {
  slug: 'vouchers',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone, // checkout perlu membaca kode voucher valid/tidak (validasi nilai tetap di server)
    update: authenticated,
  },
  admin: {
    defaultColumns: ['code', 'discountType', 'discountValue', 'active', 'expiresAt'],
    useAsTitle: 'code',
    description:
      'Kode diskon untuk checkout. Simulasi: kuota pemakaian tidak berkurang otomatis.',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Kode Voucher',
      admin: {
        description: 'Contoh: HEMAT10',
      },
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      label: 'Jenis Diskon',
      options: [
        { label: 'Nominal (Rupiah)', value: 'nominal' },
        { label: 'Persen (%)', value: 'percent' },
      ],
    },
    {
      name: 'discountValue',
      type: 'number',
      required: true,
      label: 'Nilai Diskon',
      admin: {
        description: 'Nominal: rupiah bulat (50000). Persen: 0–100.',
      },
    },
    {
      name: 'minSpend',
      type: 'number',
      label: 'Minimal Belanja',
      admin: {
        description: 'Prasyarat subtotal (rupiah). Kosong = tanpa syarat.',
      },
    },
    {
      name: 'usageQuota',
      type: 'number',
      label: 'Kuota Pemakaian',
      admin: {
        description: 'Simulasi — tidak dihitung otomatis',
      },
    },
    {
      name: 'usedCount',
      type: 'number',
      label: 'Sudah Dipakai',
      admin: {
        description: 'Simulasi — diisi manual bila ingin ditampilkan',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif?',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Kedaluwarsa',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateVoucher],
  },
}
