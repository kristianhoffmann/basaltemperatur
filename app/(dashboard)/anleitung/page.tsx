import Link from 'next/link'
import type { ReactNode } from 'react'
import {
    BookOpenCheck,
    CalendarHeart,
    Thermometer,
    Sparkles,
    Crown,
    ArrowRight,
    CheckCircle2,
} from 'lucide-react'

export const metadata = {
    title: 'Anleitung',
    description: 'Schritt-für-Schritt Anleitung für Basaltemperatur auf Web und iOS.',
}

const steps = [
    {
        title: '1. Morgens messen',
        text: 'Miss direkt nach dem Aufwachen deine Basaltemperatur und trage sie täglich ein.',
    },
    {
        title: '2. Periode markieren',
        text: 'Markiere alle Blutungstage im Kalender, damit Zyklusphase und Vorhersagen genauer werden.',
    },
    {
        title: '3. Regelmäßig dranbleiben',
        text: 'Je mehr Daten du hast, desto präziser werden Eisprung-, Fruchtbarkeits- und Periodenprognosen.',
    },
]

const premiumItems = [
    'Komplette Analyse mit Trends und KPIs',
    'Eisprung-, Fruchtbarkeits- und Periodenprognosen',
    'Zyklusvergleich über mehrere Monate',
    'PDF-Export für Arztgespräche',
]

export default function GuidePage() {
    return (
        <div className="space-y-6 pb-20 pt-4">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Anleitung</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    So nutzt du die App sicher und effektiv.
                </p>
            </div>

            <div className="card">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-500">
                        <BookOpenCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--text)]">In 2 Minuten startklar</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Einträge und Kalender sind kostenlos. Die Analyse kannst du später optional freischalten.
                        </p>
                    </div>
                </div>
            </div>

            <section className="space-y-3">
                {steps.map((step) => (
                    <div key={step.title} className="card p-4">
                        <p className="font-semibold text-sm text-[var(--text)]">{step.title}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1.5">{step.text}</p>
                    </div>
                ))}
            </section>

            <section className="card space-y-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">Kalender-Legende</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <LegendItem label="Temperatur eingetragen" color="bg-slate-100 border-slate-200" icon={<Thermometer className="h-4 w-4 text-slate-500" />} />
                    <LegendItem label="Periode" color="bg-rose-50 border-rose-200" icon={<CalendarHeart className="h-4 w-4 text-rose-500" />} />
                    <LegendItem label="Fruchtbar" color="bg-emerald-50 border-emerald-200" icon={<Sparkles className="h-4 w-4 text-emerald-500" />} />
                    <LegendItem label="Peak / Eisprungnah" color="bg-amber-50 border-amber-200" icon={<Sparkles className="h-4 w-4 text-amber-500" />} />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                    Prognosen sind Schätzungen auf Basis deiner bisherigen Daten und können vom tatsächlichen Verlauf abweichen.
                </p>
            </section>

            <section className="card">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                        <Crown className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-[var(--text)]">Analyse (Lifetime)</h2>
                        <ul className="mt-3 space-y-2">
                            {premiumItems.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <div className="card p-4 sm:p-5">
                <p className="text-sm text-[var(--text-secondary)]">
                    Tipp: Nutze Web und iOS parallel mit demselben Konto, damit deine Daten immer synchron bleiben.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link href="/eintrag">
                        <button className="btn btn-sm">
                            Eintrag öffnen
                        </button>
                    </Link>
                    <Link href="/kalender">
                        <button className="btn btn-sm btn-secondary">
                            Kalender öffnen
                        </button>
                    </Link>
                    <Link href="/dashboard">
                        <button className="btn btn-sm btn-secondary">
                            Zur Übersicht
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

function LegendItem({
    label,
    color,
    icon,
}: {
    label: string
    color: string
    icon: ReactNode
}) {
    return (
        <div className={`rounded-xl border px-3 py-2.5 ${color}`}>
            <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="text-sm text-[var(--text)]">{label}</span>
            </div>
        </div>
    )
}
