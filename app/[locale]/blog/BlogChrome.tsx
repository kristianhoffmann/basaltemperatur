import Link from 'next/link'
import { ExternalLink, Smartphone } from 'lucide-react'

const appStoreInfoUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://www.apple.com/de/app-store/'

export function BlogHeader({ locale }: { locale: string }) {
  return (
    <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)' }}>
      <nav className="relative z-20 mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 shadow-lg shadow-rose-500/20">
              <span className="text-sm text-white">🌡️</span>
            </span>
            <span className="text-sm font-bold tracking-tight text-white">Basaltemperatur</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm text-white/50 transition-colors hover:text-white">Features</Link>
            <Link href="/#faq" className="text-sm text-white/50 transition-colors hover:text-white">FAQ</Link>
            <Link href="/#testimonials" className="text-sm text-white/50 transition-colors hover:text-white">Erfahrungen</Link>
            <Link href="/#pricing" className="text-sm text-white/50 transition-colors hover:text-white">Preis</Link>
            <Link href={`/${locale}/blog`} className="text-sm text-white transition-colors">Blog</Link>
            <a href={appStoreInfoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 transition-colors hover:text-white">App Store (bald)</a>
            <Link href="/login" className="text-sm text-white/50 transition-colors hover:text-white">Anmelden</Link>
            <Link href="/registrieren">
              <button className="btn btn-sm border border-white/15 bg-white/5 text-white backdrop-blur-sm transition-all hover:bg-white/10">Kostenlos starten</button>
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2 md:hidden">
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-white/60">Anmelden</Link>
              <Link href="/registrieren">
                <button className="btn btn-sm border border-white/15 bg-white/5 text-white">Kostenlos starten</button>
              </Link>
            </div>
            <a
              href={appStoreInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70"
            >
              <Smartphone className="h-3.5 w-3.5" />
              App Store bald verfügbar
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

export function BlogFooter() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 shadow-md">
                <span className="text-[11px] text-white">🌡️</span>
              </div>
              <span className="text-sm font-bold text-[var(--text)]">Basaltemperatur</span>
            </div>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Dein Zyklustracker - einfach, sicher und privat.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-[var(--text)]">Produkt</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li><Link href="/#features" className="transition-colors hover:text-[var(--rose)]">Features</Link></li>
              <li><Link href="/#faq" className="transition-colors hover:text-[var(--rose)]">FAQ</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-[var(--rose)]">Preis</Link></li>
              <li><Link href="/#testimonials" className="transition-colors hover:text-[var(--rose)]">Erfahrungen</Link></li>
              <li><Link href="/blog" className="transition-colors hover:text-[var(--rose)]">Blog</Link></li>
              <li>
                <a href={appStoreInfoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-[var(--rose)]">
                  App Store (bald)
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-[var(--text)]">Rechtliches</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li><Link href="/impressum" className="transition-colors hover:text-[var(--rose)]">Impressum</Link></li>
              <li><Link href="/datenschutz" className="transition-colors hover:text-[var(--rose)]">Datenschutz</Link></li>
              <li><Link href="/agb" className="transition-colors hover:text-[var(--rose)]">AGB</Link></li>
              <li><Link href="/widerruf" className="transition-colors hover:text-[var(--rose)]">Widerruf</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-[var(--text)]">Kontakt</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li>
                <a href="mailto:info@kristianhoffmann.de" className="transition-colors hover:text-[var(--rose)]">
                  info@kristianhoffmann.de
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--card-border)] pt-6 text-center text-xs text-[var(--text-muted)]">
          © 2026 Basaltemperatur. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
