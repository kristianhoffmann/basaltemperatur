// app/(dashboard)/onboarding/page.tsx
// Onboarding – 3-Schritte Wizard für neue Nutzerinnen
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Heart,
    Thermometer,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    CalendarHeart,
    CheckCircle,
} from 'lucide-react'

const steps = [
    {
        icon: Heart,
        title: 'Willkommen bei Basaltemperatur!',
        subtitle: 'Dein persönlicher Zyklustracker',
        content: (
            <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                <p>
                    Schön, dass du da bist! Mit Basaltemperatur kannst du deinen Zyklus
                    ganz natürlich verstehen – durch tägliches Messen deiner Aufwachtemperatur.
                </p>
                <div className="space-y-3 mt-6">
                    {[
                        { icon: Thermometer, text: 'Temperatur erfassen – täglich, schnell, einfach' },
                        { icon: CalendarHeart, text: 'Periode markieren – für genaue Zykluserkennung' },
                        { icon: Sparkles, text: 'Temperaturanstieg rückblickend auswerten' },
                    ].map((item) => (
                        <div key={item.text} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                            <item.icon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        icon: CalendarHeart,
        title: 'Dein Zyklus',
        subtitle: 'Ein paar Infos zu dir',
        content: null, // Rendered dynamically with cycle length input
    },
    {
        icon: Sparkles,
        title: 'Alles bereit!',
        subtitle: 'Du kannst jetzt loslegen',
        content: (
            <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed text-center">
                <div className="py-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-400/10 text-emerald-400 mb-4">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                </div>
                <p className="text-lg font-semibold text-[var(--text)]">
                    Perfekt eingerichtet!
                </p>
                <p>
                    Dein erster Schritt: Trage morgens nach dem Aufwachen
                    deine Basaltemperatur ein. Nach ein paar Tagen siehst
                    du deine persönliche Temperaturkurve.
                </p>
                <div className="p-4 rounded-xl bg-rose-400/5 border border-rose-400/20 mt-4">
                    <p className="text-xs text-rose-400">
                        <strong>Tipp:</strong> Miss immer zur gleichen Uhrzeit,
                        direkt nach dem Aufwachen, bevor du aufstehst.
                    </p>
                </div>
            </div>
        ),
    },
]

export default function OnboardingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentStep, setCurrentStep] = useState(0)
    const [cycleLength, setCycleLength] = useState(28)
    const [displayName, setDisplayName] = useState('')
    const [sensitiveDataConsent, setSensitiveDataConsent] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function loadExistingProfile() {
            const res = await fetch('/api/onboarding').catch(() => null)
            if (!res?.ok) return

            const body = await res.json().catch(() => null)
            const profile = body?.profile
            if (cancelled || !profile) return

            if (typeof profile.display_name === 'string') {
                setDisplayName(profile.display_name)
            }
            if (typeof profile.cycle_length_default === 'number') {
                setCycleLength(Math.min(Math.max(profile.cycle_length_default, 21), 40))
            }
            if (profile.sensitive_data_consent_at) {
                setSensitiveDataConsent(true)
            }
        }

        loadExistingProfile()

        return () => {
            cancelled = true
        }
    }, [])

    const handleComplete = async () => {
        if (!sensitiveDataConsent) {
            setError('Bitte willige ausdrücklich in die Verarbeitung deiner Zyklusdaten ein.')
            return
        }

        setSaving(true)
        setError(null)
        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: displayName.trim() || null,
                    cycle_length_default: cycleLength,
                    sensitive_data_consent: sensitiveDataConsent,
                }),
            })
            if (res.ok) {
                router.push('/dashboard')
                router.refresh()
            } else {
                const body = await res.json().catch(() => null)
                setError(body?.error || 'Onboarding konnte nicht gespeichert werden.')
            }
        } catch {
            setError('Onboarding konnte nicht gespeichert werden.')
        } finally {
            setSaving(false)
        }
    }

    const step = steps[currentStep]
    const isLast = currentStep === steps.length - 1
    const consentWasRevoked = searchParams.get('consent') === 'revoked'

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8">
            <div className="w-full max-w-md mx-auto">
                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                                width: i === currentStep ? '2rem' : '0.75rem',
                                backgroundColor: i <= currentStep ? 'var(--rose)' : 'var(--border)',
                            }}
                        />
                    ))}
                </div>

                {/* Card */}
                <div className="card animate-fade-in">
                    {consentWasRevoked && (
                        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                            Du hast die Einwilligung widerrufen. Neue Einträge und Auswertungen werden erst wieder aktiv,
                            wenn du der Verarbeitung deiner Zyklusdaten erneut zustimmst.
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-400/10 text-rose-400 mb-4">
                            <step.icon className="h-7 w-7" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text)]">{step.title}</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{step.subtitle}</p>
                    </div>

                    {/* Step Content */}
                    {currentStep === 1 ? (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                    Wie heißt du? (optional)
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Dein Vorname"
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                    Wie lang ist dein Zyklus normalerweise?
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={21}
                                        max={40}
                                        value={cycleLength}
                                        onChange={(e) => setCycleLength(Number(e.target.value))}
                                        className="flex-1 accent-rose-400"
                                    />
                                    <span className="text-2xl font-bold text-[var(--text)] min-w-[3ch] text-right">
                                        {cycleLength}
                                    </span>
                                    <span className="text-sm text-[var(--text-muted)]">Tage</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    Standard: 28 Tage. Du kannst das jederzeit in den Einstellungen ändern.
                                </p>
                            </div>
                        </div>
                    ) : (
                        step.content
                    )}

                    {isLast && (
                        <div className="mt-5 space-y-3">
                            <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={sensitiveDataConsent}
                                    onChange={(event) => setSensitiveDataConsent(event.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-rose-400"
                                />
                                <span className="text-xs leading-relaxed text-[var(--text-secondary)]">
                                    Ich willige ausdrücklich ein, dass Basaltemperatur meine Gesundheitsdaten
                                    wie Temperaturwerte, Periodendaten, Zervixschleim und Störfaktoren für
                                    Zyklusauswertungen verarbeitet. Mir ist bewusst, dass die App kein
                                    Medizinprodukt ist und nicht zur Verhütung, Diagnose oder Behandlung
                                    verwendet werden darf.
                                </span>
                            </label>
                            {error && (
                                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Zurück
                            </button>
                        ) : (
                            <div />
                        )}

                        {isLast ? (
                            <button
                                onClick={handleComplete}
                                disabled={saving || !sensitiveDataConsent}
                                className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                                    boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                                }}
                            >
                                {saving ? 'Wird gespeichert...' : 'Los geht\u2019s!'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-2.5 transition-all duration-200 active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                                    boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                                }}
                            >
                                Weiter
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
