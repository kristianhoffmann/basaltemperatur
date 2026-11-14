// app/(dashboard)/dashboard/UpgradeBanner.tsx
'use client'

import { useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'

export function UpgradeBanner() {
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Ausdrückliches Verlangen des vorzeitigen Beginns (§ 357a BGB). Ohne diese
    // Erklärung UND die Belehrung darüber gibt es bei einem Widerruf keinen
    // Wertersatz — dann ist der volle Preis zurückzuzahlen, egal wie lange die
    // App schon genutzt wurde. Bewusst NICHT vorausgewählt: Eine
    // vorangekreuzte Zustimmung ist keine.
    const [earlyStartRequested, setEarlyStartRequested] = useState(false)

    if (dismissed) return null

    const handleUpgrade = async () => {
        if (!earlyStartRequested) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ earlyStartRequested: true }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
                return
            }
            setError(data.error || 'Checkout konnte nicht gestartet werden.')
        } catch {
            setError('Checkout konnte nicht gestartet werden.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section
            aria-labelledby="analyse-kaufen"
            className="relative rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-card sm:p-6"
        >
            <button
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)]"
                aria-label="Hinweis ausblenden"
            >
                <X className="h-4 w-4" />
            </button>

            {/* § 312j Abs. 2 BGB: Leistung, Gesamtpreis und Laufzeit stehen unmittelbar
                vor der Schaltfläche; § 312j Abs. 1 BGB: akzeptierte Zahlungsmittel. */}
            <div className="grid gap-5 pr-8 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-8">
                <div>
                    <h2 id="analyse-kaufen" className="text-base font-semibold text-[var(--text)]">
                        Analyse freischalten
                    </h2>
                    <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
                        {[
                            'Temperaturkurve mit Hilfslinie und rückblickend markierten Anstiegen',
                            'Zyklusstatistik und Vergleich mehrerer Zyklen',
                            'Statistische Schätzung des nächsten Periodenbeginns',
                            'PDF-Export',
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="sm:text-right">
                    <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text)]">9,99&nbsp;€</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                        einmalig · zeitlich unbegrenzter Zugang<br />
                        Endpreis, keine USt. (§ 19 UStG)<br />
                        kein Abo, keine Folgekosten
                    </p>
                </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                <input
                    type="checkbox"
                    checked={earlyStartRequested}
                    onChange={(event) => setEarlyStartRequested(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--rose)]"
                />
                <span>
                    Ich verlange ausdrücklich, dass die Freischaltung sofort und vor Ablauf der
                    Widerrufsfrist erfolgt. Mir ist bekannt, dass ich bei einem Widerruf einen
                    anteiligen Betrag für den bis dahin bereitgestellten Zeitraum schulde. Mein{' '}
                    <a href="/widerruf" target="_blank" rel="noreferrer" className="underline">
                        Widerrufsrecht
                    </a>{' '}
                    bleibt für vierzehn Tage bestehen.
                </span>
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    Zahlungsarten: Kredit- oder Debitkarte, Apple Pay, Google Pay, Klarna, Link
                    (Abwicklung über Stripe). Es gelten die{' '}
                    <a href="/agb" target="_blank" rel="noreferrer" className="underline">AGB</a>.
                </p>
                <button
                    onClick={handleUpgrade}
                    disabled={loading || !earlyStartRequested}
                    className="btn btn-primary btn-lg shrink-0"
                >
                    {loading ? 'Weiter zur Zahlung …' : 'Jetzt kaufen'}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
            </div>
            {!earlyStartRequested && (
                <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-right">
                    Bitte bestätige zuerst das Kästchen oben.
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 text-xs text-red-700">
                    {error}
                </p>
            )}
        </section>
    )
}
