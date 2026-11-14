// app/layout.tsx
// Root Layout – Basaltemperatur App

import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Fraunces, Instrument_Sans } from 'next/font/google'
import { ThemeProvider, ThemeScript } from '@/components/shared/ThemeToggle'
import { ToastProvider } from '@/components/shared/Toaster'
import { TrafficTracker } from '@/components/analytics/TrafficTracker'
import { StatisticsConsent } from '@/components/analytics/StatisticsConsent'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { siteSchema, serializeJsonLd } from '@/lib/seo-autopilot/structured-data'
import './globals.css'

// Both families are downloaded at build time and served from our own host:
// no request to Google leaves the visitor's browser.
const bodyFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const siteUrl = getSeoSiteUrl()
const siteName = 'Basaltemperatur'
const siteDescription = 'Privates Zyklustagebuch: Basaltemperatur und Periode kostenlos eintragen, Temperaturkurve und Statistik einmalig für 9,99 € – ohne Abo.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF7F2',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} – Zyklustagebuch für Temperatur und Periode`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  category: 'lifestyle',
  authors: [{ name: 'Kristian Hoffmann', url: 'https://www.kristianhoffmann.de' }],
  creator: 'Kristian Hoffmann',
  publisher: siteName,
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName,
    // No url/title here: pages without their own Open Graph block would otherwise
    // announce themselves as the start page.
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${siteName} – Zyklustagebuch mit Temperaturkurve`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    description: siteDescription,
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteSchema()) }} />
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <TrafficTracker />
            </Suspense>
            {children}
            <StatisticsConsent />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
