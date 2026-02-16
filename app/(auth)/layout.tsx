// app/(auth)/layout.tsx
// Auth Layout – Zentriertes Layout mit Premium-Design

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-heading font-bold text-lg" style={{ color: 'var(--text)' }}>
            Basaltemperatur
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <p>
          © {new Date().getFullYear()} Basaltemperatur. Alle Rechte vorbehalten.
        </p>
        <div className="mt-2 space-x-4">
          <Link href="/impressum" className="hover:text-rose-400 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-rose-400 transition-colors">Datenschutz</Link>
          <Link href="/agb" className="hover:text-rose-400 transition-colors">AGB</Link>
          <Link href="/widerruf" className="hover:text-rose-400 transition-colors">Widerruf</Link>
        </div>
      </footer>
    </div>
  )
}
