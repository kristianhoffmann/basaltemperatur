// lib/account-deletion.ts
// Gemeinsame Grundlage für die Konto-Löschung (DSGVO Art. 17)
//
// Bewusst frei von Supabase-/Stripe-Imports: die Reihenfolge der Löschung
// ist die eigentliche fachliche Logik und wird hier als reine Funktion
// geplant, damit sie testbar ist. Ausgeführt wird der Plan von der
// Server Action `deleteAccount` (Web) — die Tabellenliste teilt sich diese
// Datei mit /api/delete-account (iOS), damit beide Pfade nicht
// auseinanderlaufen.

/**
 * Reihenfolge wichtig für FK-Constraints: Einträge zuerst, Profil zuletzt.
 */
export const USER_DATA_TABLES = [
  'temperature_entries',
  'period_entries',
  'cycles',
  'profiles',
] as const

/** Das Profil hängt an `id`, alle anderen Tabellen an `user_id`. */
export function idColumnFor(table: string): 'id' | 'user_id' {
  return table === 'profiles' ? 'id' : 'user_id'
}

export type DeletionStep =
  | { kind: 'cancel-subscription'; subscriptionId: string }
  | { kind: 'delete-table'; table: string; idColumn: 'id' | 'user_id' }
  | { kind: 'delete-auth-user' }

export type DeletionRefusal =
  | 'not_authenticated'
  | 'reauth_failed'
  | 'email_mismatch'

export type DeletionPlan =
  | { ok: false; reason: DeletionRefusal; error: string }
  | { ok: true; steps: DeletionStep[] }

export type DeletionPlanInput = {
  /** E-Mail der aktiven Session (serverseitig gelesen, nie vom Client). */
  sessionEmail: string | null | undefined
  /** E-Mail, die der Nutzer zur Bestätigung eingetippt hat. */
  typedEmail: string | null | undefined
  /** Ergebnis der Passwort-Reauthentifizierung gegen einen Wegwerf-Client. */
  passwordVerified: boolean
  /**
   * Aktive Stripe-Abos. Basaltemperatur verkauft einen einmaligen
   * Lifetime-Kauf (mode: 'payment'), es gibt hier im Regelfall also NICHTS
   * zu kündigen. Der Fall wird trotzdem sauber abgebildet, falls je ein
   * Abo-Produkt dazukommt oder ein Altbestand existiert.
   */
  activeSubscriptionIds?: readonly string[]
}

function normalizeEmail(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

/**
 * Plant die Löschung. Gibt entweder eine Ablehnung mit Grund zurück oder
 * die vollständige Schrittfolge:
 *
 *   1. Etwaige Stripe-Abos kündigen (VOR jeder Datenlöschung — schlägt das
 *      fehl, bleibt das Konto unangetastet)
 *   2. Tabellendaten in FK-sicherer Reihenfolge
 *   3. Auth-User ZULETZT
 */
export function planAccountDeletion(input: DeletionPlanInput): DeletionPlan {
  const sessionEmail = normalizeEmail(input.sessionEmail)

  if (!sessionEmail) {
    return {
      ok: false,
      reason: 'not_authenticated',
      error: 'Nicht angemeldet.',
    }
  }

  if (!input.passwordVerified) {
    return {
      ok: false,
      reason: 'reauth_failed',
      error: 'Das Passwort ist nicht korrekt.',
    }
  }

  if (normalizeEmail(input.typedEmail) !== sessionEmail) {
    return {
      ok: false,
      reason: 'email_mismatch',
      error: 'Die eingegebene E-Mail-Adresse stimmt nicht mit deinem Konto überein.',
    }
  }

  const steps: DeletionStep[] = []

  for (const subscriptionId of input.activeSubscriptionIds ?? []) {
    steps.push({ kind: 'cancel-subscription', subscriptionId })
  }

  for (const table of USER_DATA_TABLES) {
    steps.push({ kind: 'delete-table', table, idColumn: idColumnFor(table) })
  }

  steps.push({ kind: 'delete-auth-user' })

  return { ok: true, steps }
}
