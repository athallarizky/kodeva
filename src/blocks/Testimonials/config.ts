import type { Block } from 'payload'

// data-design.md §1.4 — testimoni landing
export const Testimonials: Block = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimoni',
    plural: 'Testimoni',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Judul Section',
      defaultValue: 'Kata Mereka',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 6,
      label: 'Daftar Testimoni',
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          required: true,
          label: 'Kutipan',
        },
        { name: 'name', type: 'text', required: true, label: 'Nama' },
        {
          name: 'role',
          type: 'text',
          label: 'Peran / Bisnis',
          admin: { description: 'Contoh: Pemilik Warung Bu Sari, Bandung' },
        },
        { name: 'avatar', type: 'upload', relationTo: 'media', label: 'Foto (opsional)' },
      ],
    },
  ],
}
