'use client'

import { useState } from 'react'
import { Shield, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { signOut, deleteAccount } from '@/lib/actions/auth'

interface AccountDangerZoneProps {
    userId: string
}

export function AccountDangerZone({ userId }: AccountDangerZoneProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        if (confirmation !== 'LÖSCHEN') {
            setError('Bitte gib "LÖSCHEN" ein.')
            return
        }

        setIsDeleting(true)
        setError(null)

        const formData = new FormData()
        formData.set('confirmation', confirmation)

        const result = await deleteAccount(formData)
        if (result?.error) {
            setError(result.error)
            setIsDeleting(false)
        }
        // If successful, the server action redirects
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
                                    Bist du sicher?
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Alle deine Temperatureinträge, Periodeneinträge und dein Konto werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-red-600 block mb-1.5">
                                Gib &quot;LÖSCHEN&quot; ein, um zu bestätigen:
                            </label>
                            <input
                                type="text"
                                value={confirmation}
                                onChange={(e) => {
                                    setConfirmation(e.target.value)
                                    setError(null)
                                }}
                                placeholder="LÖSCHEN"
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
                                disabled={isDeleting || confirmation !== 'LÖSCHEN'}
                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setConfirmation('')
                                    setError(null)
                                }}
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
