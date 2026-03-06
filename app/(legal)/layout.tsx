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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Basaltemperatur'}
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            rounded-2xl border border-gray-200/90 dark:border-gray-700/90
            bg-white dark:bg-gray-800 shadow-sm p-6 sm:p-8 lg:p-10
            text-gray-800 dark:text-gray-100 leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-gray-900 dark:[&_h1]:text-white [&_h1]:mb-6
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-gray-100 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:my-3 [&_p]:text-gray-700 dark:[&_p]:text-gray-200
            [&_ul]:my-3 [&_ul]:pl-5 [&_li]:my-1.5 [&_li]:text-gray-700 dark:[&_li]:text-gray-200
            [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-rose-300 dark:[&_a]:decoration-rose-400
            [&_a]:text-rose-700 dark:[&_a]:text-rose-300 hover:[&_a]:text-rose-800 dark:hover:[&_a]:text-rose-200
            [&_hr]:my-8 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700
            [&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-white
          "
        >
          {children}
        </article>
      </main>

      {/* Footer mit Links zu anderen Legal-Seiten */}
      <footer className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/impressum" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Impressum
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/datenschutz" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Datenschutz
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/agb" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            AGB
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/widerruf" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Widerruf
          </Link>
        </nav>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || 'Basaltemperatur'}. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  );
}
