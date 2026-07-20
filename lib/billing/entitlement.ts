// lib/billing/entitlement.ts
// Eine Stelle für die Frage "hat dieser Nutzer Lifetime-Zugang?".
//
// Quelle der Wahrheit ist die Spalte profiles.has_lifetime_access — genau
// die, die auch /statistiken, /zyklen, /export und /kalender abfragen.
// Gesetzt wird sie ausschließlich von den beiden Kaufwegen:
//   - Stripe-Webhook (einmaliger Kauf, entitlement_source: 'stripe')
//   - App-Store/StoreKit (entitlement_source: 'app_store')
// sowie manuell durch den Support (entitlement_source: 'manual').

export type EntitlementSource = 'none' | 'stripe' | 'app_store' | 'manual'

export type Entitlement = {
  plan: 'lifetime' | 'free'
  status: EntitlementSource
  entitled: boolean
}

type ProfileEntitlementRow = {
  has_lifetime_access?: boolean | null
  entitlement_source?: EntitlementSource | null
}

/** Übersetzt eine Profilzeile in das Entitlement, ohne das Gating nachzubauen. */
export function toEntitlement(profile: ProfileEntitlementRow | null | undefined): Entitlement {
  const entitled = Boolean(profile?.has_lifetime_access)

  return {
    plan: entitled ? 'lifetime' : 'free',
    status: profile?.entitlement_source ?? 'none',
    entitled,
  }
}
