import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

// ============================================================================
// LEGAL LAYOUT
// Einheitliches Layout für Impressum, Datenschutz, AGB, Widerruf
// ============================================================================

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-slate-900">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Basaltemperatur'}
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
        <article
          className="
            rounded-2xl border border-slate-200
            bg-white shadow-sm p-6 sm:p-8 lg:p-10
            text-slate-800 leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h1]:mb-6
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:my-3 [&_p]:text-slate-700
            [&_ul]:my-3 [&_ul]:pl-5 [&_li]:my-1.5 [&_li]:text-slate-700
            [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-rose-300
            [&_a]:text-rose-700 hover:[&_a]:text-rose-800
            [&_hr]:my-8 [&_hr]:border-slate-200
            [&_strong]:font-semibold [&_strong]:text-slate-900
          "
        >
          {children}
        </article>
      </main>

      {/* Footer mit Links zu anderen Legal-Seiten */}
      <footer className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
          <Link href="/impressum" className="hover:text-slate-900 transition-colors">
            Impressum
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/datenschutz" className="hover:text-slate-900 transition-colors">
            Datenschutz
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/agb" className="hover:text-slate-900 transition-colors">
            AGB
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/widerruf" className="hover:text-slate-900 transition-colors">
            Widerruf
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/support" className="hover:text-slate-900 transition-colors">
            Support
          </Link>
        </nav>
        <p className="text-center text-xs text-slate-500 mt-4">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || 'Basaltemperatur'}. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  );
}
