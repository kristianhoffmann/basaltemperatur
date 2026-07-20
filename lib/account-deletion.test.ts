import { describe, expect, it } from 'vitest'
import {
  planAccountDeletion,
  idColumnFor,
  USER_DATA_TABLES,
  type DeletionStep,
} from './account-deletion'

const validInput = {
  sessionEmail: 'nutzerin@example.de',
  typedEmail: 'nutzerin@example.de',
  passwordVerified: true,
  activeSubscriptionIds: [] as string[],
}

function kinds(steps: DeletionStep[]): string[] {
  return steps.map((s) => s.kind)
}

describe('planAccountDeletion', () => {
  it('refuses without an authenticated session', () => {
    const plan = planAccountDeletion({ ...validInput, sessionEmail: null })
    expect(plan.ok).toBe(false)
    expect(plan.ok === false && plan.reason).toBe('not_authenticated')
  })

  it('refuses when the password re-authentication failed', () => {
    const plan = planAccountDeletion({ ...validInput, passwordVerified: false })
    expect(plan.ok).toBe(false)
    expect(plan.ok === false && plan.reason).toBe('reauth_failed')
  })

  it('refuses when the typed email belongs to somebody else', () => {
    const plan = planAccountDeletion({ ...validInput, typedEmail: 'andere@example.de' })
    expect(plan.ok).toBe(false)
    expect(plan.ok === false && plan.reason).toBe('email_mismatch')
  })

  it('accepts the typed email regardless of case and padding', () => {
    const plan = planAccountDeletion({ ...validInput, typedEmail: '  Nutzerin@Example.DE  ' })
    expect(plan.ok).toBe(true)
  })

  it('never lets an empty confirmation pass as a match', () => {
    const plan = planAccountDeletion({ ...validInput, typedEmail: '' })
    expect(plan.ok).toBe(false)
    expect(plan.ok === false && plan.reason).toBe('email_mismatch')
  })

  // Der Regelfall: einmaliger Lifetime-Kauf, es gibt gar kein Abo.
  it('plans a clean deletion when there is no subscription to cancel', () => {
    const plan = planAccountDeletion(validInput)
    expect(plan.ok).toBe(true)
    if (!plan.ok) return

    expect(kinds(plan.steps)).not.toContain('cancel-subscription')
    expect(plan.steps[0]).toEqual({
      kind: 'delete-table',
      table: 'temperature_entries',
      idColumn: 'user_id',
    })
  })

  it('treats an undefined subscription list the same as none', () => {
    const plan = planAccountDeletion({
      sessionEmail: validInput.sessionEmail,
      typedEmail: validInput.typedEmail,
      passwordVerified: true,
    })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(kinds(plan.steps)).not.toContain('cancel-subscription')
  })

  it('cancels every legacy subscription before touching any data', () => {
    const plan = planAccountDeletion({
      ...validInput,
      activeSubscriptionIds: ['sub_a', 'sub_b'],
    })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return

    expect(plan.steps[0]).toEqual({ kind: 'cancel-subscription', subscriptionId: 'sub_a' })
    expect(plan.steps[1]).toEqual({ kind: 'cancel-subscription', subscriptionId: 'sub_b' })

    const firstDelete = plan.steps.findIndex((s) => s.kind === 'delete-table')
    expect(firstDelete).toBe(2)
  })

  it('deletes the auth user last, after the profile row', () => {
    const plan = planAccountDeletion(validInput)
    expect(plan.ok).toBe(true)
    if (!plan.ok) return

    const order = kinds(plan.steps)
    expect(order[order.length - 1]).toBe('delete-auth-user')
    expect(order.filter((k) => k === 'delete-auth-user')).toHaveLength(1)

    const profileIndex = plan.steps.findIndex(
      (s) => s.kind === 'delete-table' && s.table === 'profiles'
    )
    const authIndex = plan.steps.findIndex((s) => s.kind === 'delete-auth-user')
    expect(profileIndex).toBeLessThan(authIndex)
  })

  it('covers every known table exactly once, in FK-safe order', () => {
    const plan = planAccountDeletion(validInput)
    expect(plan.ok).toBe(true)
    if (!plan.ok) return

    const tables = plan.steps
      .filter((s): s is Extract<DeletionStep, { kind: 'delete-table' }> => s.kind === 'delete-table')
      .map((s) => s.table)

    expect(tables).toEqual([...USER_DATA_TABLES])
    expect(new Set(tables).size).toBe(tables.length)
  })
})

describe('idColumnFor', () => {
  it('hangs profiles off id and everything else off user_id', () => {
    expect(idColumnFor('profiles')).toBe('id')
    expect(idColumnFor('temperature_entries')).toBe('user_id')
    expect(idColumnFor('cycles')).toBe('user_id')
  })
})
