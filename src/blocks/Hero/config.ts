import type { Block } from 'payload'

// data-design.md §1.4 — hero landing
export const Hero: Block = {
  slug: 'hero',
  labels: {
    singular: 'Hero',
    plural: 'Hero',
  },
  fields: [
    {
      name: 'kicker',
      type: 'text',
      label: 'Kicker',
      admin: { description: 'Teks kecil di atas judul, contoh: Promo Akhir Tahun' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Judul',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subjudul',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Gambar',
    },
    {
      name: 'primaryCta',
      type: 'group',
      required: true,
      label: 'Tombol Utama',
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Teks Tombol' },
        { name: 'href', type: 'text', required: true, label: 'Tautan', admin: { description: 'Contoh: /produk' } },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Tombol Kedua (opsional)',
      fields: [
        { name: 'label', type: 'text', label: 'Teks Tombol' },
        { name: 'href', type: 'text', label: 'Tautan' },
      ],
    },
  ],
}
