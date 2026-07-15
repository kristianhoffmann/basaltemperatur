export type CheckoutResult = 'confirmed' | 'syncing' | 'invalid'

export function resolveCheckoutResult(input: {
  authenticated: boolean
  sessionBelongsToUser: boolean
  sessionPaid: boolean
  entitlementActive: boolean
}): CheckoutResult {
  if (!input.authenticated || !input.sessionBelongsToUser || !input.sessionPaid) {
    return 'invalid'
  }

  return input.entitlementActive ? 'confirmed' : 'syncing'
}
