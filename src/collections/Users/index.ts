import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'

export const Users: CollectionConfig<'users'> = {
  slug: 'users',
  access: {
    admin: authenticated,
    // registerFirstUser (first-run) melewati access create — user pertama tetap bisa dibuat
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nama',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['admin'],
      required: true,
      label: 'Peran',
      options: [
        { label: 'Admin — akses penuh', value: 'admin' },
        { label: 'Editor — konten & leads', value: 'editor' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
