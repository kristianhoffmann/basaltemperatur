import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

// ============================================================================
// LEGAL LAYOUT
// Einheitliches Layout für Impressum, Datenschutz, AGB
// ============================================================================

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {process.env.NEXT_PUBLIC_APP_NAME || 'SaaS App'}
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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 prose prose-gray dark:prose-invert max-w-none">
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
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || 'Firmenname GmbH'}. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  );
}
