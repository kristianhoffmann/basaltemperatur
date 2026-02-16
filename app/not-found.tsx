// app/not-found.tsx
'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

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
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>
      </div>
    </div>
  )
}
