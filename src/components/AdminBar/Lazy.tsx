'use client'

import dynamic from 'next/dynamic'

// Pembungkus client — `ssr:false` hanya legal di Client Component,
// layout publik adalah Server Component.
export const LazyAdminBar = dynamic(
  () => import('./index').then((m) => ({ default: m.AdminBar })),
  { ssr: false },
)
