import { describe, expect, it } from 'vitest'
import { resolveCheckoutResult } from './checkout-result'

describe('resolveCheckoutResult', () => {
  it('confirms only a paid session belonging to the signed-in user with an active entitlement', () => {
    expect(resolveCheckoutResult({
      authenticated: true,
      sessionBelongsToUser: true,
      sessionPaid: true,
      entitlementActive: true,
    })).toBe('confirmed')
  })

  it('reports syncing while the verified payment waits for the webhook', () => {
    expect(resolveCheckoutResult({
      authenticated: true,
      sessionBelongsToUser: true,
      sessionPaid: true,
      entitlementActive: false,
    })).toBe('syncing')
  })

  it.each([
    { authenticated: false, sessionBelongsToUser: true, sessionPaid: true, entitlementActive: true },
    { authenticated: true, sessionBelongsToUser: false, sessionPaid: true, entitlementActive: true },
    { authenticated: true, sessionBelongsToUser: true, sessionPaid: false, entitlementActive: true },
  ])('rejects an unverified return instead of trusting the URL', (input) => {
    expect(resolveCheckoutResult(input)).toBe('invalid')
  })
})
