import type { Access } from 'payload'

// Editor boleh menulis konten (produk/artikel/halaman/media) dan membaca leads.
// Operasi khusus admin (users, vouchers, ubah/hapus leads) memakai isAdmin.
export const adminOrEditor: Access = ({ req: { user } }) => {
  if (!user) return false
  const roles = (user as { roles?: string[] | null }).roles
  return !roles || roles.length === 0 || roles.includes('admin') || roles.includes('editor')
}
