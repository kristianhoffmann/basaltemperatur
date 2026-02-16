'use client'

import { useState, useActionState } from 'react'
import { User, Pencil, Check, X } from 'lucide-react'
import { updateProfile } from '@/lib/actions/auth'

interface ProfileSectionProps {
    email: string
    initialName: string
    userId: string
}

export function ProfileSection({ email, initialName, userId }: ProfileSectionProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(initialName)
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await updateProfile(prevState, formData)
        if (result?.success) {
            setIsEditing(false)
        }
        return result
    }, null)

    return (
        <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <User className="h-5 w-5 text-rose-400" />
                Mein Profil
            </h2>

            <div className="flex items-center gap-4 py-2">
                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xl shrink-0">
                    {(name || email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                        {email}
                    </p>
                    <p className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-block mt-1">
                        Bestätigt
                    </p>
                </div>
            </div>

            {/* Name Editing */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Name
                </label>

                {isEditing ? (
                    <form action={formAction} className="mt-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                                style={{ color: 'var(--text)' }}
                                placeholder="Dein Name"
                                autoFocus
                                maxLength={100}
                            />
                            <button
                                type="submit"
                                disabled={isPending}
                                className="p-2 rounded-xl bg-rose-400 text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    setName(initialName)
                                }}
                                className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {state?.error && (
                            <p className="text-xs text-red-500 mt-2">{state.error}</p>
                        )}
                    </form>
                ) : (
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-sm" style={{ color: 'var(--text)' }}>
                            {name || <span className="italic" style={{ color: 'var(--text-muted)' }}>Kein Name gesetzt</span>}
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-500 transition-colors"
                        >
                            <Pencil className="h-3 w-3" />
                            Bearbeiten
                        </button>
                    </div>
                )}

                {state?.success && !isEditing && (
                    <p className="text-xs text-emerald-600 mt-2">✓ {state.message}</p>
                )}
            </div>

            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                User ID: {userId.slice(0, 8)}...
            </p>
        </div>
    )
}
