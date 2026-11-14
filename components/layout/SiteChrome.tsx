// components/layout/SiteChrome.tsx
// One header and one footer for every public page (start page, guide, tools,
// legal pages). Server components only: navigation works without JavaScript.

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ConsentSettingsLink } from '@/components/analytics/ConsentSettingsLink'
import { getLegalCompany } from '@/lib/legal/config'
import { withFrom } from '@/lib/seo-autopilot/source'

export type SiteSection = 'home' | 'guide' | 'tool' | 'curve' | 'about' | 'legal'

const NAV_LINKS: Array<{ href: string; label: string; section?: SiteSection }> = [
  { href: '/#features', label: 'Funktionen' },
  { href: '/#pricing', label: 'Preis' },
  { href: '/de/blog', label: 'Ratgeber', section: 'guide' },
  { href: '/werkzeuge/basaltemperaturkurve', label: 'Kurve erstellen', section: 'curve' },
  { href: '/werkzeuge/temperatur-hilfslinie', label: 'Hilfslinien-Rechner', section: 'tool' },
  { href: '/#faq', label: 'Fragen' },
]

function navClass(active: boolean) {
  return active
    ? 'text-[var(--text)] font-semibold'
    : 'text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors'
}

export function SiteHeader({ current, from }: { current?: SiteSection; from?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[rgba(255,248,241,0.88)] backdrop-blur-md">
      <a href="#inhalt" className="skip-link">Zum Inhalt springen</a>
      <div className="wrap px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Basaltemperatur – Startseite">
            <Logo size="sm" />
            <span className="hidden text-[15px] font-semibold tracking-tight text-[var(--text)] min-[360px]:inline">Basaltemperatur</span>
          </Link>

          <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.section && link.section === current ? 'page' : undefined}
                className={navClass(Boolean(link.section && link.section === current))}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link href={withFrom('/login', from)} className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
              Anmelden
            </Link>
            <Link href={withFrom('/registrieren', from)} className="btn btn-primary btn-sm">
              <span className="sm:hidden">Starten</span>
              <span className="hidden sm:inline">Kostenlos starten</span>
            </Link>
          </div>
        </div>

        <nav aria-label="Seitenbereiche" className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-3 text-sm md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.section && link.section === current ? 'page' : undefined}
              className={`shrink-0 ${navClass(Boolean(link.section && link.section === current))}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const company = getLegalCompany()
  const linkClass = 'text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]'

  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--bg-secondary)]">
      <div className="wrap px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
              <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Basaltemperatur</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              Ein privates Zyklustagebuch für Temperatur und Periode. Kein Medizinprodukt,
              kein Verhütungsmittel und kein Ersatz für ärztlichen Rat.
            </p>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Kontakt:{' '}
              <a href={`mailto:${company.email}`} className="link-quiet">{company.email}</a>
            </p>
          </div>

          <nav aria-label="Produkt">
            <p className="text-sm font-semibold text-[var(--text)]">Produkt</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/#features" className={linkClass}>Funktionen</Link></li>
              <li><Link href="/#pricing" className={linkClass}>Preis</Link></li>
              <li><Link href="/de/blog" className={linkClass}>Ratgeber</Link></li>
              <li><Link href="/werkzeuge/basaltemperaturkurve" className={linkClass}>Basaltemperaturkurve erstellen</Link></li>
              <li><Link href="/werkzeuge/temperatur-hilfslinie" className={linkClass}>Hilfslinien-Rechner</Link></li>
              <li><Link href="/ueber-uns" className={linkClass}>Über uns</Link></li>
              <li><Link href="/support" className={linkClass}>Support</Link></li>
            </ul>
          </nav>

          <nav aria-label="Rechtliches">
            <p className="text-sm font-semibold text-[var(--text)]">Rechtliches</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/impressum" className={linkClass}>Impressum</Link></li>
              <li><Link href="/datenschutz" className={linkClass}>Datenschutz</Link></li>
              <li><Link href="/agb" className={linkClass}>AGB</Link></li>
              <li><Link href="/widerruf" className={linkClass}>Widerrufsbelehrung</Link></li>
              {/* § 356a BGB: permanently available and visibly set apart. */}
              <li>
                <Link href="/widerruf-ausueben" className="font-semibold text-[var(--rose)] underline underline-offset-4 hover:text-[var(--rose-dark)]">
                  Vertrag widerrufen
                </Link>
              </li>
              <li><ConsentSettingsLink className={linkClass} /></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--card-border)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Basaltemperatur · Betrieben von {company.name}, Hannover</p>
          <p>Entwickelt und gehostet in Deutschland.</p>
        </div>
      </div>
    </footer>
  )
}
