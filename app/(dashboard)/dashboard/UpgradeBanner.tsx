// app/(dashboard)/dashboard/UpgradeBanner.tsx
'use client'

import { useState } from 'react'
import { Crown, ArrowRight, X } from 'lucide-react'

export function UpgradeBanner() {
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    const handleUpgrade = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/checkout', { method: 'POST' })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch {
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
                        Lifetime-Zugang freischalten
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Einmalig 9,99 € – alle Features, für immer, kein Abo.
                    </p>
                </div>
                <button
                    onClick={handleUpgrade}
                    disabled={loading}
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
        </div>
    )
}
