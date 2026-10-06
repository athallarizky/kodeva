import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { adminOrEditor } from '../../access/adminOrEditor'
import { slugField } from 'payload'

import { revalidateDelete, revalidateProduct } from './hooks/revalidateProduct'

// Skema: docs/sprint-0/resources/data-design.md §1.1 (FINAL)
// Semua harga = integer rupiah. Kuota = satu pool per produk, lintas paket.
const packageFields = (label: string) => [
  {
    name: 'priceMonthly',
    type: 'number' as const,
    required: true,
    label: `Harga per Lisensi — Bulanan (${label})`,
    admin: {
      description: 'Rupiah bulat tanpa desimal, contoh: 149000',
    },
  },
  {
    name: 'originalPriceMonthly',
    type: 'number' as const,
    label: `Harga Sebelum Promo — Dicoret (${label})`,
    admin: {
      description: 'Kosongkan bila tidak ada harga coret untuk paket ini',
    },
  },
  {
    name: 'priceYearly',
    type: 'number' as const,
    label: `Harga per Lisensi — Tahunan (${label})`,
    admin: {
      description: 'Kosongkan bila paket tahunan tidak tersedia',
    },
  },
]

export const Products: CollectionConfig<'products'> = {
  slug: 'products',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: anyone,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['name', 'category', 'featured', 'promoQuota.remaining'],
    useAsTitle: 'name',
    description:
      'Katalog produk. Harga promo, harga coret, dan sisa kuota dapat diubah kapan saja tanpa redeploy.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Produk',
    },
    slugField(),
    {
      name: 'tagline',
      type: 'text',
      label: 'Tagline',
      admin: {
        description: 'Satu baris untuk kartu katalog',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Kategori',
      options: [
        { label: 'Kasir', value: 'kasir' },
        { label: 'HR & Payroll', value: 'hr' },
        { label: 'Add-on', value: 'addon' },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      label: 'Deskripsi',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Fitur & Screenshot',
      labels: {
        singular: 'Fitur',
        plural: 'Fitur',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Judul Fitur',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Keterangan',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Screenshot',
        },
      ],
    },
    {
      name: 'packages',
      type: 'group',
      required: true,
      label: 'Harga Paket',
      admin: {
        description: 'Harga per lisensi. Paket menentukan harga satuan, bukan jumlah lisensi.',
      },
      fields: [
        {
          name: 'basic',
          type: 'group',
          label: 'Basic',
          fields: packageFields('Basic'),
        },
        {
          name: 'pro',
          type: 'group',
          label: 'Pro',
          fields: packageFields('Pro'),
        },
        {
          name: 'business',
          type: 'group',
          label: 'Business',
          fields: packageFields('Business'),
        },
      ],
    },
    {
      name: 'promoQuota',
      type: 'group',
      required: true,
      label: 'Kuota Promo',
      admin: {
        description:
          'Satu pool per produk, dibagi lintas paket. 1 lisensi = 1 unit kuota, berapa pun durasinya.',
      },
      fields: [
        {
          name: 'total',
          type: 'number',
          required: true,
          label: 'Total Kuota',
        },
        {
          name: 'remaining',
          type: 'number',
          required: true,
          label: 'Sisa Kuota',
          admin: {
            description: 'Angka statis (simulasi) — tidak berkurang otomatis saat checkout',
          },
        },
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
          label: 'Promo Aktif?',
          admin: {
            description: 'Nonaktif = harga coret dan batas kuota tidak ditampilkan',
          },
        },
        {
          name: 'endsAt',
          type: 'date',
          label: 'Berakhir Pada',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Hanya untuk ditampilkan',
          },
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Tampilkan di Unggulan',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateDelete],
  },
}
