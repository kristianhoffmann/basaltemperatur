import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { planAccountDeletion } from '@/lib/account-deletion'
import { findActiveSubscriptionIds, cancelSubscription } from '@/lib/actions/auth'
import { ADMIN_EMAIL } from '@/lib/adminAccess'

/**
 * Ein Konto als Administrator löschen.
 *
 * Kein zweiter Löschweg: Plan und Reihenfolge kommen aus derselben reinen
 * Funktion wie die Selbstbedienung (`planAccountDeletion`) — erst kündigen,
 * dann Tabellen in FK-sicherer Reihenfolge, Auth-Konto zuletzt. Scheitert die
 * Kündigung, wird NICHTS gelöscht.
 *
 * Zwei Dinge unterscheiden sich, und beide müssen sich unterscheiden:
 * Der Administrator weist sich nicht mit dem Passwort des Kontos aus (er kennt
 * es nicht und soll es nicht kennen), und die Bestätigung ist die E-Mail des
 * ZIELS statt der eigenen.
 *
 * Die Abo-Suche läuft wie in der Selbstbedienung über die Kunden-E-Mail:
 * Basaltemperatur führt keine `stripe_customer_id` am Profil, weil der Kauf
 * einmalig ist. Im Regelfall gibt es hier nichts zu kündigen — der Fall wird
 * trotzdem sauber behandelt.
 */

export type AdminDeleteResult =
  | { ok: true; cancelledSubscriptions: number }
  | {
      ok: false
      reason:
        | 'user_not_found'
        | 'cannot_delete_self'
        | 'confirm_mismatch'
        | 'stripe_lookup_failed'
        | 'stripe_cancel_failed'
        | 'delete_failed'
      detail?: string
    }

export async function adminDeleteUser(input: {
  userId: string
  /** Die eingetippte Bestätigung — muss die E-Mail des Kontos sein. */
  confirmEmail: string
}): Promise<AdminDeleteResult> {
  const admin = createAdminClient()

  const { data: target, error: lookupError } = await admin.auth.admin.getUserById(input.userId)
  if (lookupError || !target?.user?.email) return { ok: false, reason: 'user_not_found' }
  const email = target.user.email

  // Der Administrator darf sich nicht selbst löschen: Danach käme niemand mehr
  // in diesen Bereich, und die Sperre kostet nichts.
  if (email.trim().toLowerCase() === ADMIN_EMAIL) {
    return { ok: false, reason: 'cannot_delete_self' }
  }
  if (input.confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return { ok: false, reason: 'confirm_mismatch' }
  }

  // Offene Abos suchen. Ein Fehler HIER bricht ab: Ein unbekannter
  // Abrechnungszustand ist kein Grund zu löschen.
  let activeSubscriptionIds: string[]
  try {
    activeSubscriptionIds = await findActiveSubscriptionIds(email)
  } catch (err) {
    console.error('[admin-delete] Stripe-Abfrage fehlgeschlagen:', err)
    return { ok: false, reason: 'stripe_lookup_failed', detail: (err as Error).message }
  }

  const plan = planAccountDeletion({
    sessionEmail: email,
    typedEmail: input.confirmEmail,
    // Der Passwortnachweis entfällt für den Administrator — er weist sich über
    // die Admin-Schranke der Seite aus, nicht über ein fremdes Passwort.
    passwordVerified: true,
    activeSubscriptionIds,
  })
  if (!plan.ok) return { ok: false, reason: 'confirm_mismatch', detail: plan.error }

  // ─── 1. Stripe zuerst — Abbruch lässt das Konto unangetastet ─────
  let cancelledSubscriptions = 0
  for (const step of plan.steps) {
    if (step.kind !== 'cancel-subscription') continue
    try {
      await cancelSubscription(step.subscriptionId)
      cancelledSubscriptions += 1
    } catch (err) {
      console.error('[admin-delete] Kündigung fehlgeschlagen, Abbruch:', err)
      return { ok: false, reason: 'stripe_cancel_failed', detail: (err as Error).message }
    }
  }

  // ─── 2. Daten, Auth-Konto zuletzt ────────────────────────────────
  for (const step of plan.steps) {
    if (step.kind === 'delete-table') {
      const { error } = await admin
        .from(step.table)
        .delete()
        .eq(step.idColumn, input.userId)
      if (error) {
        console.error(`[admin-delete] Löschen von ${step.table} fehlgeschlagen:`, error.message)
      }
      continue
    }

    if (step.kind === 'delete-auth-user') {
      const { error } = await admin.auth.admin.deleteUser(input.userId)
      if (error) {
        console.error('[admin-delete] Auth-Konto löschen fehlgeschlagen:', error.message)
        return { ok: false, reason: 'delete_failed', detail: error.message }
      }
    }
  }

  return { ok: true, cancelledSubscriptions }
}
