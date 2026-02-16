// app/layout.tsx
// Root Layout – Basaltemperatur App

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: {
    default: 'Basaltemperatur – Dein Zyklustracker',
    template: '%s | Basaltemperatur',
  },
  description: 'Tracke deine Basaltemperatur, erkenne deinen Eisprung und behalte deinen Zyklus im Blick. Einfach, sicher und privat.',
  keywords: ['Basaltemperatur', 'Zyklustracking', 'Eisprung', 'NFP', 'Temperaturkurve', 'Periodenkalender', 'Kinderwunsch'],
  authors: [{ name: 'Basaltemperatur App' }],
  creator: 'Basaltemperatur App',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Basaltemperatur',
    title: 'Basaltemperatur – Dein Zyklustracker',
    description: 'Tracke deine Basaltemperatur, erkenne deinen Eisprung und behalte deinen Zyklus im Blick.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Basaltemperatur',
    description: 'Dein Zyklustracker – Temperatur, Periode & Eisprung',
  },
  robots: {
    index: true,
    follow: true,
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
