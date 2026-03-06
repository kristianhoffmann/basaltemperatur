// app/layout.tsx
// Root Layout – Basaltemperatur App

import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider, ThemeScript } from '@/components/shared/ThemeToggle'
import { ToastProvider } from '@/components/shared/Toaster'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.basaltemperatur.online').replace(/\/$/, '')
const siteName = 'Basaltemperatur'
const siteDescription = 'Tracke deine Basaltemperatur, erkenne deinen Eisprung und behalte deinen Zyklus im Blick. Einfach, sicher und privat.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F1029',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} – Dein Zyklustracker`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  category: 'health',
  keywords: ['Basaltemperatur', 'Zyklustracking', 'Eisprung', 'NFP', 'Temperaturkurve', 'Periodenkalender', 'Kinderwunsch'],
  authors: [{ name: 'Basaltemperatur App' }],
  creator: 'Basaltemperatur App',
  alternates: {
    canonical: '/',
  },
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
    url: '/',
    title: `${siteName} – Dein Zyklustracker`,
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${siteName} – Zyklustracking App`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} – Dein Zyklustracker`,
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
    <html lang="de" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
