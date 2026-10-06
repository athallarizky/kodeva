import type { Block } from 'payload'

// data-design.md §1.4 — grid produk unggulan
export const FeaturedProducts: Block = {
  slug: 'featured-products',
  labels: {
    singular: 'Produk Unggulan',
    plural: 'Produk Unggulan',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Judul Section',
      defaultValue: 'Produk Unggulan',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      maxRows: 6,
      required: true,
      label: 'Produk',
    },
    {
      name: 'showPrices',
      type: 'checkbox',
      defaultValue: true,
      label: 'Tampilkan Harga',
    },
  ],
}
