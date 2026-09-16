import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const POINTS = [
  'Temperatur und Periode kostenlos eintragen',
  'Analyse einmalig 9,99 € – kein Abo',
  'Daten auf Servern in Deutschland',
]

const HERO_GRADIENT = 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)'

export function BlogCtaCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-violet-950/20" style={{ background: HERO_GRADIENT }}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-400/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative">
        <Logo size="lg" />
        <p className="mt-5 font-heading text-xl font-extrabold leading-snug tracking-tight">
          Deine Temperaturkurve, übersichtlich und privat.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              {point}
            </li>
          ))}
        </ul>
        <Link href="/registrieren" className="btn btn-glow mt-6 w-full">
          Kostenlos starten
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export function BlogCtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:py-14" style={{ background: HERO_GRADIENT }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <Logo size="lg" className="hidden sm:block" />
          <div>
            <p className="font-heading text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              Deinen Zyklus selbst im Blick behalten
            </p>
            <p className="mt-3 max-w-xl text-white/70">
              Trage deine Basaltemperatur kostenlos ein und schalte die Auswertung bei Bedarf einmalig frei.
            </p>
          </div>
        </div>
        <Link href="/registrieren" className="btn btn-glow btn-lg relative mt-8 shrink-0 lg:mt-0">
          Kostenlos starten
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
