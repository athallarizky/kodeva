import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { isAdmin } from '../../access/isAdmin'
import { adminOrEditor } from '../../access/adminOrEditor'

// Skema: docs/sprint-0/resources/data-design.md §1.5 (FINAL)
// Form lead capture (Bagian A) + instrumen riset JEV (sprint-2).
// create = publik HANYA via /api/leads (route yang menulis field-field ini,
// bukan form admin); read = admin+editor (marketing); update/delete = admin.
export const Leads: CollectionConfig<'leads'> = {
  slug: 'leads',
  access: {
    create: anyone,
    delete: isAdmin,
    read: adminOrEditor,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'contact', 'jev.p', 'createdAt'],
    useAsTitle: 'name',
    description:
      'Prospect dari form landing page. Skor JEV diisi otomatis (riset) — urutkan kolom Skor untuk prioritas.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama',
    },
    {
      name: 'contact',
      type: 'text',
      required: true,
      label: 'Email / WhatsApp',
      admin: {
        description: 'Diisi pengunjung — divalidasi server (email aktif ATAU nomor WA Indonesia)',
      },
    },
    {
      name: 'utm',
      type: 'group',
      label: 'Atribusi UTM',
      admin: {
        description: 'Diisi server dari session pengunjung (last-touch)',
      },
      fields: [
        { name: 'source', type: 'text', label: 'Source' },
        { name: 'medium', type: 'text', label: 'Medium' },
        { name: 'campaign', type: 'text', label: 'Campaign' },
        { name: 'content', type: 'text', label: 'Content' },
        { name: 'term', type: 'text', label: 'Term' },
        { name: 'gclid', type: 'text', label: 'gclid' },
        { name: 'fbclid', type: 'text', label: 'fbclid' },
      ],
    },
    {
      name: 'landingPath',
      type: 'text',
      label: 'Halaman Asal',
    },
    {
      name: 'campaign',
      type: 'text',
      defaultValue: 'promo-akhir-tahun',
      label: 'Campaign',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'jev',
      type: 'group',
      label: 'Skor JEV (Riset)',
      admin: {
        description:
          'Terisi otomatis oleh sistem riset (sprint-2). Gagal diskor = tidak menggagalkan lead.',
      },
      fields: [
        { name: 'scored', type: 'checkbox', defaultValue: false, label: 'Sudah Diskor?' },
        { name: 'p', type: 'number', label: 'p (probabilitas konversi)' },
        { name: 'margin', type: 'number', label: 'Margin' },
        { name: 'model', type: 'text', label: 'Versi Model' },
        { name: 'raw', type: 'json', label: 'Respons Mentah' },
        {
          name: 'scoredAt',
          type: 'date',
          label: 'Waktu Skor',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },
    {
      name: 'outcome',
      type: 'group',
      label: 'Outcome (Riset)',
      admin: {
        description: 'HANYA untuk harness generator riset — bukan data nyata',
      },
      fields: [
        { name: 'converted', type: 'checkbox', label: 'Converted' },
        { name: 'generatorSeed', type: 'number', label: 'Generator Seed' },
      ],
    },
  ],
  timestamps: true,
}
