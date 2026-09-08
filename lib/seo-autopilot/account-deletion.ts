// lib/seo-autopilot/account-deletion.ts
//
// Ein einzelnes Konto entfernen, angestossen aus dem zentralen Fleet-Dashboard.
//
// KORREKTUR ZUM URSPRUENGLICHEN COMMIT: Dort stand, an `auth.users` haenge
// keine Tabelle mit `on delete cascade`. Das war falsch — die Behauptung kam
// aus einer Abfrage, deren Fehlermeldung nach /dev/null lief. Tatsaechlich
// haengen ALLE vier Tabellen (cycles, period_entries, temperature_entries,
// profiles) per CASCADE am Konto; die Datenbank raeumt selbst auf.
//
// Das explizite Loeschen bleibt trotzdem stehen, aus zwei Gruenden: Es macht
// im Plan sichtbar, WAS verschwindet — sonst zeigt der Bestaetigungsdialog
// eine leere Liste und der Umfang bleibt unsichtbar. Und es haelt die
// Loeschung unabhaengig davon, ob eine spaetere Migration einen dieser
// Fremdschluessel wieder entfernt. Doppelt geloeschte Zeilen kosten nichts.
//
// WAS BLEIBT: `withdrawal_declarations`. Eingegangene Widerrufserklaerungen
// sind kaufmaennische Belege, keine Profildaten, und sie haengen an der
// E-Mail-Adresse statt an der Konto-ID. Wer sie beim Aufraeumen "nach E-Mail"
// mitnimmt, vernichtet den Nachweis, den der Betrieb aufbewahren muss.
//
// Zyklusdaten sind besonders geschuetzte Gesundheitsdaten (Art. 9 DSGVO) —
// hier wird nichts anonymisiert aufgehoben, sondern geloescht.

import type { SupabaseClient } from '@supabase/supabase-js'

/** Reihenfolge zaehlt: Kinder zuerst, Profil und Konto zuletzt. */
const OWNED_ROWS = [
  { table: 'temperature_entries', column: 'user_id', label: 'Temperatureinträge' },
  { table: 'period_entries', column: 'user_id', label: 'Periodeneinträge' },
  { table: 'cycles', column: 'user_id', label: 'Zyklen' },
  { table: 'profiles', column: 'id', label: 'Profil' },
] as const

const RETAINED = [
  {
    table: 'withdrawal_declarations',
    label: 'Widerrufserklärungen',
    reason: 'Kaufmännischer Beleg, hängt an der E-Mail statt am Konto',
  },
] as const

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DeletionEntry = { table: string; label: string; rows: number | null }

export type DeletionFailure = { ok: false; status: number; error: string; detail?: string }

export type DeletionPlan = {
  ok: true
  user: { id: string; email: string | null; createdAt: string | null; role: string | null }
  owned: DeletionEntry[]
  anonymize: DeletionEntry
  retained: Array<{ table: string; label: string; reason: string }>
  deleted?: Array<{ table: string; label: string }>
}

export type DeletionInput = { userId?: unknown; email?: unknown }

async function countRows(sb: SupabaseClient, table: string, column: string, userId: string) {
  const { count, error } = await sb.from(table).select(column, { count: 'exact', head: true }).eq(column, userId)
  return error ? null : (count ?? null)
}

export async function planAccountDeletion(sb: SupabaseClient, input: DeletionInput): Promise<DeletionPlan | DeletionFailure> {
  const userId = String(input.userId ?? '')
  if (!UUID.test(userId)) return { ok: false, status: 400, error: 'invalid_user_id' }

  const { data, error } = await sb.auth.admin.getUserById(userId)
  if (error || !data?.user) return { ok: false, status: 404, error: 'user_not_found' }
  const user = data.user

  // Die Liste im Dashboard kann Minuten alt sein. Stimmt die mitgeschickte
  // Adresse nicht mehr mit dem Konto ueberein, wurde auf eine veraltete Zeile
  // geklickt — dann abbrechen, statt das falsche Konto zu treffen.
  const expected = String(input.email ?? '').trim().toLowerCase()
  const actual = String(user.email ?? '').trim().toLowerCase()
  if (!expected || expected !== actual) return { ok: false, status: 409, error: 'email_mismatch' }

  const owned: DeletionEntry[] = []
  for (const entry of OWNED_ROWS) {
    owned.push({ table: entry.table, label: entry.label, rows: await countRows(sb, entry.table, entry.column, userId) })
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null, createdAt: user.created_at ?? null, role: null },
    owned,
    // Diese App fuehrt keine personenbezogene Telemetrie, die sich
    // anonymisieren liesse — die Null ist gemessen, nicht geschaetzt.
    anonymize: { table: '—', label: 'Nichts zu anonymisieren', rows: 0 },
    retained: [...RETAINED],
  }
}

export async function deleteAccount(sb: SupabaseClient, input: DeletionInput): Promise<DeletionPlan | DeletionFailure> {
  const plan = await planAccountDeletion(sb, input)
  if (!plan.ok) return plan

  const deleted: Array<{ table: string; label: string }> = []
  for (const entry of OWNED_ROWS) {
    const { error } = await sb.from(entry.table).delete().eq(entry.column, plan.user.id)
    if (error) return { ok: false, status: 500, error: 'delete_failed', detail: `${entry.table}: ${error.message}` }
    deleted.push({ table: entry.table, label: entry.label })
  }

  // Zuletzt das Konto selbst: Bricht es hier ab, sind die Daten weg und die
  // Anmeldung besteht noch — dieser Zustand laesst sich wiederholen.
  const { error } = await sb.auth.admin.deleteUser(plan.user.id)
  if (error) return { ok: false, status: 500, error: 'auth_delete_failed', detail: error.message }

  return { ...plan, deleted }
}
