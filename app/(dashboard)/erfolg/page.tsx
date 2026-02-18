// app/(dashboard)/erfolg/page.tsx
// Erfolgsseite nach Stripe-Zahlung

import Link from 'next/link'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = {
    title: 'Zahlung erfolgreich',
    description: 'Vielen Dank für deinen Kauf! Du hast jetzt vollen Zugang.',
}

export default function ErfolgPage() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <div className="max-w-md mx-auto text-center animate-fade-in">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-400/10 mb-6">
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="h-7 w-7 text-amber-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
                    Vielen Dank! 🎉
                </h1>
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                    Dein Lifetime-Zugang ist jetzt aktiv.
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-8">
                    Du hast jetzt unbegrenzten Zugang zu allen Features –
                    für immer, ohne Abo.
                </p>

                <div className="card p-6 mb-8 text-left">
                    <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                        Was du jetzt tun kannst:
                    </h2>
                    <ul className="space-y-3">
                        {[
                            'Trage täglich deine Basaltemperatur ein',
                            'Markiere deine Periodentage im Kalender',
                            'Exportiere deine Kurve als PDF für den Arzt',
                            'Vergleiche mehrere Zyklen miteinander',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <Link href="/dashboard">
                    <button
                        className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-3 transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                            boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                        }}
                    >
                        Zum Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </Link>
            </div>
        </div>
    )
}
