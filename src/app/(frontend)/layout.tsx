import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Funnel_Sans, Inter } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { BottomNav } from '@/components/kit/BottomNav'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { TrackingDrawer } from '@/components/TrackingDrawer'
import { UtmCapture } from '@/components/UtmCapture'
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
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

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
