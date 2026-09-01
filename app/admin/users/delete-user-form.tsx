'use client'

import { useActionState, useState } from 'react'
import { deleteUserAction } from './actions'
import type { AdminDeleteResult } from '@/lib/admin-delete-user'

const MESSAGES: Record<string, string> = {
  user_not_found: 'Konto nicht gefunden.',
  cannot_delete_self: 'Das eigene Administratorkonto lässt sich nicht löschen.',
  confirm_mismatch: 'Die eingegebene E-Mail stimmt nicht mit dem Konto überein.',
  stripe_lookup_failed: 'Der Abrechnungszustand ließ sich nicht abfragen — es wurde nichts gelöscht.',
  stripe_cancel_failed:
    'Das Abo konnte nicht gekündigt werden — es wurde deshalb NICHTS gelöscht.',
  delete_failed: 'Löschen fehlgeschlagen.',
}

/**
 * Löschknopf mit Tipp-Bestätigung.
 *
 * Die E-Mail muss abgetippt werden, nicht bloß ein „Wirklich?" bestätigt: Der
 * teuerste Fehler hier ist die falsche Zeile in einer langen Tabelle.
 */
export function DeleteUserForm({ userId, email }: { userId: string; email: string | null }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<AdminDeleteResult | null, FormData>(
    deleteUserAction,
    null,
  )

  if (state?.ok) return <span className="text-xs text-slate-500">gelöscht</span>

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
      >
        Löschen
      </button>
    )
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="confirmEmail"
        required
        autoFocus
        placeholder={email ?? 'E-Mail eintippen'}
        aria-label="E-Mail zur Bestätigung eintippen"
        className="w-52 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Löscht …' : 'Endgültig löschen'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400"
      >
        Abbrechen
      </button>
      {state && !state.ok ? (
        <p className="w-full text-xs text-rose-300">
          {MESSAGES[state.reason] ?? 'Löschen fehlgeschlagen.'}
        </p>
      ) : null}
    </form>
  )
}
