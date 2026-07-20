// app/api/qa/status/route.ts
// QA-Sonde: liefert den Zustand, den End-to-End-Tests sonst raten müssten
// (Stripe-Modus, aktive Session, Entitlement). Streng read-only — die Route
// legt nichts an und ändert nichts.
//
// Zugriff nur mit QA_PROBE_SECRET im Header `x-qa-probe-secret`. Ist die
// Variable nicht gesetzt (Regelfall in Produktion), verhält sich die Route
// wie nicht vorhanden und antwortet mit 404.
//
// Es werden NIE Secrets oder Price-IDs ausgeliefert — nur abgeleitete Fakten.

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toEntitlement } from '@/lib/billing/entitlement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StripeMode = 'test' | 'live' | 'unconfigured'

function resolveStripeMode(secretKey: string | undefined): StripeMode {
    const key = (secretKey || '').trim()
    if (!key) return 'unconfigured'
    if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test'
    return 'live'
}

/**
 * Konstantzeit-Vergleich. timingSafeEqual wirft bei ungleicher Länge, daher
 * wird die Länge zuerst geprüft — die Länge des Secrets ist selbst nicht
 * schützenswert, das ist der übliche sichere Kompromiss.
 */
function secretMatches(provided: string, expected: string): boolean {
    const a = Buffer.from(provided, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

export async function GET(request: Request) {
    const probeSecret = process.env.QA_PROBE_SECRET

    // Nicht konfiguriert → Route existiert für die Außenwelt nicht.
    if (!probeSecret) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const provided = request.headers.get('x-qa-probe-secret')
    if (!provided || !secretMatches(provided, probeSecret)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Schalter, die einen Paywall-Test aus den falschen Gründen bestehen
    // lassen können. Es gibt keinen Demo-/Unlock-Env-Schalter; die echten
    // Umgehungen sind die zusätzlichen Wege, has_lifetime_access zu setzen:
    //   - appStoreEntitlementEnabled: eine StoreKit-Transaktion schaltet
    //     Premium frei, ganz ohne Stripe-Zahlung
    //   - manualEntitlementPossible: entitlement_source 'manual' erlaubt es,
    //     den Zugang direkt in der DB zu setzen
    const flags = {
        appStoreEntitlementEnabled: Boolean(
            process.env.APP_STORE_BUNDLE_ID && process.env.APP_STORE_LIFETIME_PRODUCT_ID
        ),
        manualEntitlementPossible: true,
    }

    const stripeMode = resolveStripeMode(process.env.STRIPE_SECRET_KEY)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({
            product: 'basaltemperatur',
            stripeMode,
            flags,
            session: null,
            entitlement: null,
        })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('has_lifetime_access, entitlement_source')
        .eq('id', user.id)
        .maybeSingle()

    return NextResponse.json({
        product: 'basaltemperatur',
        stripeMode,
        flags,
        session: {
            userId: user.id,
            email: user.email || '',
        },
        entitlement: toEntitlement(profile),
    })
}
