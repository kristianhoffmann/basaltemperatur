// app/not-found.tsx
//
// Server Component, damit `metadata` exportiert werden kann: Das Root-Layout setzt
// robots auf "index, follow", und nur ein Metadata-Export ueberschreibt das sauber
// (statt einen zweiten, widerspruechlichen robots-Tag danebenzustellen).
//
// Hintergrund: Next.js streamt die Antwort, deshalb steht der HTTP-Status beim ersten
// Flush fest — ein notFound() aus einer Server Component kann ihn nicht mehr auf 404
// drehen, die Seite kommt mit 200 zurueck. Ungueltige Blog-Locales faengt darum der
// Proxy per 308 ab; alles Uebrige (z. B. erfundene Artikel-Slugs) landet hier und wird
// wenigstens zuverlaessig auf noindex gesetzt.

import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Newspaper, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: { absolute: 'Seite nicht gefunden | Basaltemperatur' },
  description: 'Die gesuchte Seite existiert nicht oder wurde verschoben.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-400/10 mb-4">
            <Search className="w-12 h-12 text-rose-400" />
          </div>
          <h1 className="text-7xl font-bold text-[var(--border)]">404</h1>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">Seite nicht gefunden</h2>
        <p className="mb-8 text-[var(--text-secondary)]">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
          <Link href="/de/blog" className="btn-secondary">
            <Newspaper className="w-4 h-4" />
            Zum Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
