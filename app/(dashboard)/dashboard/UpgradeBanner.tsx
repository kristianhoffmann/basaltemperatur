// app/(dashboard)/dashboard/UpgradeBanner.tsx
'use client'

import { useState } from 'react'
import { Crown, ArrowRight, X } from 'lucide-react'

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
            const res = await fetch('/api/checkout', { method: 'POST' })
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
        <div className="relative rounded-2xl p-4 overflow-hidden" style={{
            background: 'linear-gradient(135deg, #f9726820, #f5970b15)',
            border: '1px solid #f9726830',
        }}>
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Schließen"
            >
                <X className="h-4 w-4 text-[var(--text-muted)]" />
            </button>

            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-500 shrink-0">
                    <Crown className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)]">
                        Analyse freischalten
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Einmalig 9,99 € – Prognosen, Statistiken, Vergleich & Export.
                    </p>
                </div>
                <button
                    onClick={handleUpgrade}
                    disabled={loading || !earlyStartRequested}
                    className="shrink-0 inline-flex items-center gap-1.5 font-medium text-xs text-white rounded-xl px-4 py-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
                    style={{
                        background: 'linear-gradient(135deg, #f97268, #e85d52)',
                        boxShadow: '0 2px 8px rgba(249, 114, 104, 0.3)',
                    }}
                >
                    {loading ? '...' : 'Jetzt kaufen'}
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                <input
                    type="checkbox"
                    checked={earlyStartRequested}
                    onChange={(event) => setEarlyStartRequested(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                />
                <span>
                    Ich verlange ausdrücklich, dass die Freischaltung sofort und vor Ablauf der
                    Widerrufsfrist erfolgt. Mir ist bekannt, dass ich bei einem Widerruf anteiligen
                    Wertersatz für den bereits genutzten Zeitraum schulde. Mein{' '}
                    <a href="/widerruf" target="_blank" rel="noreferrer" className="underline">
                        Widerrufsrecht
                    </a>{' '}
                    bleibt für vierzehn Tage bestehen.
                </span>
            </label>
            {error && (
                <p className="mt-3 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}
