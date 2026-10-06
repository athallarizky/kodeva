import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Funnel_Sans, Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import React from 'react'

import { BottomNav } from '@/components/kit/BottomNav'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { TrackingDrawer } from '@/components/TrackingDrawer'
import { UtmCapture } from '@/components/UtmCapture'

// AdminBar hanya untuk sesi draft-preview — lazy supaya JS admin-bar
// tidak ikut dibebankan pengunjung publik (Lighthouse sprint-3).
const AdminBar = dynamic(
  () => import('@/components/AdminBar').then((m) => ({ default: m.AdminBar })),
  { ssr: false },
)
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

// Font desain kodeva-ui: Inter (body/UI) + Funnel Sans (display/heading)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const funnel = Funnel_Sans({
  subsets: ['latin'],
  variable: '--font-funnel',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  // JSON-LD Organization — SEO (task 2.2)
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kodeva',
    description: 'Software UMKM Indonesia — aplikasi kasir, HR & payroll, dan add-on.',
    url: getServerSideURL(),
  }

  return (
    <html className={cn(inter.variable, funnel.variable)} lang="id" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className="bg-page font-sans text-forest antialiased">
        <Providers>
          {isEnabled ? (
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />
          ) : null}

          <UtmCapture />
          <Header />
          {children}
          <Footer />
          <BottomNav />
          <React.Suspense fallback={null}>
            <TrackingDrawer />
          </React.Suspense>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
