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
    defaultColumns: ['name', 'contact', 'priority', 'jev.p', 'createdAt'],
    useAsTitle: 'name',
    description:
      'Prospect dari form landing page. Skor = perkiraan minat, BUKAN jaminan — hubungi urutan atas lebih dulu; skor rendah tetap layak dihubungi, cuma belakangan.',
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
      // dihitung otomatis dari skor (pPlatt bila ada, else p) — untuk urutan follow-up marketing
      name: 'priority',
      type: 'select',
      label: 'Prioritas Dihubungi',
      options: [
        { label: '🔴 Tinggi', value: 'panas' },
        { label: '🟡 Sedang', value: 'hangat' },
        { label: '🟢 Rendah', value: 'dingin' },
      ],
      admin: {
        readOnly: true,
        description: 'Diisi otomatis dari skor. Hubungi urutan atas lebih dulu.',
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
        { name: 'p', type: 'number', label: 'Potensi Konversi' },
        { name: 'margin', type: 'number', label: 'Margin (confidence choice)' },
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
        // --- sprint-2 audit fields (schema.md §1.2) ---
        { name: 'input', type: 'json', label: 'Fitur Terkirim (snapshot)' },
        { name: 'latencyMs', type: 'number', label: 'Latency (ms)' },
        {
          name: 'scenario',
          type: 'text',
          label: 'Skenario',
          admin: { description: 'baseline | drift-source | drift-price | live' },
        },
        {
          name: 'pTrue',
          type: 'number',
          label: 'pTrue (ground truth generator)',
          admin: { description: 'Hanya lead sintetis — Jev tidak pernah melihat ini', readOnly: true },
        },
        {
          name: 'pPlatt',
          type: 'number',
          label: 'pPlatt (post-hoc wrapper)',
          admin: { readOnly: true },
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
