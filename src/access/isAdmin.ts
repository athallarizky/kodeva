import type { Access } from 'payload'

// Admin = punya role 'admin' ATAU roles kosong/null (hanya user bootstrap
// pertama yang dibuat sebelum field roles ada — agar tidak terkunci).
export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  const roles = (user as { roles?: string[] | null }).roles
  return !roles || roles.length === 0 || roles.includes('admin')
}
