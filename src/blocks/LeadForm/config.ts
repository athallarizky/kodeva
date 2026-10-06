import type { Block } from 'payload'

// Form lead di landing (ux-flow §2 / api-contract §2):
// honeypot + timer elapsedMs diimplementasikan di Component client, bukan field CMS.
export const LeadForm: Block = {
  slug: 'lead-form',
  labels: {
    singular: 'Form Lead',
    plural: 'Form Lead',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Judul Form',
      defaultValue: 'Konsultasi Gratis',
    },
    {
      name: 'submitLabel',
      type: 'text',
      label: 'Label Tombol',
      defaultValue: 'Kirim',
    },
    {
      name: 'note',
      type: 'text',
      label: 'Catatan Bawah Form',
      defaultValue: 'Kami balas maksimal 1×24 jam. Tanpa spam.',
    },
  ],
}
