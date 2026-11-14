// app/(auth)/layout.tsx
// Auth Layout – Zentriertes Layout mit Premium-Design

import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ConsentSettingsLink } from '@/components/analytics/ConsentSettingsLink'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--card-border)]">
        <div className="wrap flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Basaltemperatur – Startseite">
            <Logo size="sm" />
            <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Basaltemperatur</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
            Zur Startseite
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-14">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--card-border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
        <nav aria-label="Rechtliches" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/impressum" className="transition-colors hover:text-[var(--text)]">Impressum</Link>
          <Link href="/datenschutz" className="transition-colors hover:text-[var(--text)]">Datenschutz</Link>
          <Link href="/agb" className="transition-colors hover:text-[var(--text)]">AGB</Link>
          <Link href="/widerruf" className="transition-colors hover:text-[var(--text)]">Widerrufsbelehrung</Link>
          <Link href="/widerruf-ausueben" className="font-semibold text-[var(--rose)] underline underline-offset-4">Vertrag widerrufen</Link>
          <ConsentSettingsLink className="transition-colors hover:text-[var(--text)]" />
        </nav>
        <p className="mt-3 text-xs">© {new Date().getFullYear()} Basaltemperatur</p>
      </footer>
    </div>
  )
}
