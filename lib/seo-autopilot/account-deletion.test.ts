import { describe, expect, it, vi } from 'vitest'

import { deleteAccount, planAccountDeletion } from './account-deletion'

const USER_ID = '11111111-2222-3333-4444-555555555555'

type Call = { table: string; op: 'count' | 'delete' }

/** Minimaler Supabase-Doppelgänger: merkt sich, was in welcher Reihenfolge lief. */
function stubClient({ user, calls }: { user: { id: string; email: string } | null; calls: Call[] }) {
  return {
    auth: {
      admin: {
        getUserById: vi.fn(async () => (user ? { data: { user }, error: null } : { data: null, error: { message: 'not found' } })),
        deleteUser: vi.fn(async () => {
          calls.push({ table: 'auth.users', op: 'delete' })
          return { error: null }
        }),
      },
    },
    from(table: string) {
      return {
        select: () => ({
          eq: async () => {
            calls.push({ table, op: 'count' })
            return { count: 2, error: null }
          },
        }),
        delete: () => ({
          eq: async () => {
            calls.push({ table, op: 'delete' })
            return { error: null }
          },
        }),
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('Kontolöschung', () => {
  it('nennt die Widerrufserklärungen als das, was bleibt', async () => {
    const calls: Call[] = []
    const plan = await planAccountDeletion(stubClient({ user: { id: USER_ID, email: 'a@example.test' }, calls }), {
      userId: USER_ID,
      email: 'a@example.test',
    })

    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.retained[0].table).toBe('withdrawal_declarations')
    expect(plan.owned.map((e) => e.table)).toEqual(['temperature_entries', 'period_entries', 'cycles', 'profiles'])
  })

  it('lehnt eine veraltete Zeile ab, statt das falsche Konto zu treffen', async () => {
    const calls: Call[] = []
    const result = await deleteAccount(stubClient({ user: { id: USER_ID, email: 'a@example.test' }, calls }), {
      userId: USER_ID,
      email: 'jemand.anderes@example.test',
    })

    expect(result).toMatchObject({ ok: false, status: 409, error: 'email_mismatch' })
    expect(calls.some((c) => c.op === 'delete')).toBe(false)
  })

  it('löscht die Daten vor dem Konto', async () => {
    const calls: Call[] = []
    const result = await deleteAccount(stubClient({ user: { id: USER_ID, email: 'a@example.test' }, calls }), {
      userId: USER_ID,
      email: 'a@example.test',
    })

    expect(result.ok).toBe(true)
    expect(calls.filter((c) => c.op === 'delete').map((c) => c.table)).toEqual([
      'temperature_entries',
      'period_entries',
      'cycles',
      'profiles',
      'auth.users',
    ])
  })

  it('meldet eine unbekannte oder ungültige ID als Fehler', async () => {
    const calls: Call[] = []
    await expect(planAccountDeletion(stubClient({ user: null, calls }), { userId: USER_ID, email: 'a@example.test' })).resolves.toMatchObject({ ok: false, status: 404 })
    await expect(planAccountDeletion(stubClient({ user: null, calls }), { userId: 'kein-uuid', email: 'a@example.test' })).resolves.toMatchObject({ ok: false, status: 400 })
  })
})
