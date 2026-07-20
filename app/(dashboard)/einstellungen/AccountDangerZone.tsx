'use client'

import { useState } from 'react'
import { Shield, LogOut, Trash2, AlertTriangle, RotateCcw } from 'lucide-react'
import { signOut, deleteAccount, withdrawSensitiveDataConsent } from '@/lib/actions/auth'

// Was bei der Löschung verschwindet – bewusst vor der Bestätigung sichtbar.
const GELOESCHTE_DATEN = [
    'Alle Temperatureinträge',
    'Alle Periodeneinträge',
    'Alle Zyklen und Auswertungen',
    'Dein Profil und deine Einstellungen',
    'Dein Zugang und ein etwaiger Premium-Kauf',
]

export function AccountDangerZone({ email }: { email: string }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmEmail, setConfirmEmail] = useState('')
    const [showConsentConfirm, setShowConsentConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Nur Komfort – der Server prüft die Übereinstimmung erneut.
    const emailMatches =
        email.length > 0 && confirmEmail.trim().toLowerCase() === email.trim().toLowerCase()
    const canSubmit = emailMatches && password.length > 0 && !isDeleting

    const resetForm = () => {
        setShowDeleteConfirm(false)
        setPassword('')
        setConfirmEmail('')
        setError(null)
    }

    const handleDelete = async () => {
        if (!canSubmit) return

        setIsDeleting(true)
        setError(null)

        const formData = new FormData()
        formData.set('password', password)
        formData.set('confirmEmail', confirmEmail)

        const result = await deleteAccount(formData)
        if (result?.error) {
            setError(result.error)
            setIsDeleting(false)
        }
        // Bei Erfolg leitet die Server Action weiter
    }

    return (
        <div className="card" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Shield className="h-5 w-5 text-rose-400" />
                Account
            </h2>

            {/* Abmelden */}
            <form action={signOut}>
                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                {!showConsentConfirm ? (
                    <button
                        onClick={() => setShowConsentConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors font-medium text-sm"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Einwilligung widerrufen
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Auswertungen werden pausiert
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Nach dem Widerruf kannst du keine neuen Temperatur- oder Periodendaten speichern,
                                    bis du im Onboarding erneut zustimmst. Deine vorhandenen Daten bleiben erhalten.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <form action={withdrawSensitiveDataConsent} className="flex-1">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Widerrufen
                                </button>
                            </form>
                            <button
                                onClick={() => setShowConsentConfirm(false)}
                                className="px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Konto löschen */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
                    >
                        <Trash2 className="h-4 w-4" />
                        Konto und alle Daten löschen
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-700">
                                    Das wird unwiderruflich gelöscht:
                                </p>
                                <ul className="text-xs text-red-600 mt-1.5 space-y-1 list-disc list-inside">
                                    {GELOESCHTE_DATEN.map((eintrag) => (
                                        <li key={eintrag}>{eintrag}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-red-600 mt-2">
                                    Diese Aktion kann nicht rückgängig gemacht werden. Ein einmal
                                    gekaufter Premium-Zugang wird dabei nicht erstattet.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="konto-loeschen-passwort" className="text-xs font-medium text-red-600 block mb-1.5">
                                Aktuelles Passwort:
                            </label>
                            <input
                                id="konto-loeschen-passwort"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError(null)
                                }}
                                placeholder="Dein Passwort"
                                className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                                style={{ color: 'var(--text)' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="konto-loeschen-email" className="text-xs font-medium text-red-600 block mb-1.5">
                                Tippe zur Bestätigung deine E-Mail-Adresse ({email}):
                            </label>
                            <input
                                id="konto-loeschen-email"
                                type="email"
                                autoComplete="off"
                                value={confirmEmail}
                                onChange={(e) => {
                                    setConfirmEmail(e.target.value)
                                    setError(null)
                                }}
                                placeholder={email}
                                className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                                style={{ color: 'var(--text)' }}
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={!canSubmit}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
