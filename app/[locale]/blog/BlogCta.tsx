import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const POINTS = [
  'Temperatur und Periode kostenlos eintragen',
  'Analyse einmalig 9,99 € – kein Abo',
  'Server in Deutschland, keine Werbung',
]

export function BlogCtaCard() {
  return (
    <div className="rounded-2xl border-2 border-[var(--text)] bg-white p-6">
      <p className="eyebrow">Basaltemperatur-App</p>
      <p className="font-display mt-3 text-2xl text-[var(--text)]">
        Deine Temperaturkurve, übersichtlich und privat.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
      <Link href="/registrieren" className="btn btn-primary mt-6 w-full">
        Kostenlos starten
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
        Ein Tagebuch – kein Medizinprodukt und kein Verhütungsmittel.
      </p>
    </div>
  )
}

export function BlogCtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
        <div>
          <p className="font-display text-3xl text-[var(--text)] sm:text-4xl">
            Werte eintragen statt Zettel suchen
          </p>
          <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
            Trage deine Basaltemperatur kostenlos ein und schalte die Auswertung bei Bedarf einmalig frei.
          </p>
        </div>
        <Link href="/registrieren" className="btn btn-primary btn-lg mt-8 shrink-0 lg:mt-0">
          Kostenlos starten
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
