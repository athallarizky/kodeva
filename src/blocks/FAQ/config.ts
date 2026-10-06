import type { Block } from 'payload'

// data-design.md §1.4 — FAQ accordion + JSON-LD FAQPage
export const FAQ: Block = {
  slug: 'faq',
  labels: {
    singular: 'FAQ',
    plural: 'FAQ',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Judul Section',
      defaultValue: 'Pertanyaan Umum',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 8,
      label: 'Daftar Pertanyaan',
      fields: [
        { name: 'question', type: 'text', required: true, label: 'Pertanyaan' },
        { name: 'answer', type: 'textarea', required: true, label: 'Jawaban' },
      ],
    },
  ],
}
