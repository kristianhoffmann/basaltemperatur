// app/api/qa/status/route.ts
// QA-Sonde: liefert den Vertrag (lib/qa-contract.ts), auf dem der flottenweite
// Standardtest läuft. Der Test kennt kein einziges Produkt-Detail — er liest
// auth.kind, um den Anmeldeweg zu wählen, navigiert zu gating.surface und
// prüft gegen gating.blockedCopy.
//
// Zugriff nur mit QA_PROBE_SECRET im Header `x-qa-probe-secret`. Ist die
// Variable nicht gesetzt (Regelfall in Produktion), verhält sich die Route
// wie nicht vorhanden und antwortet mit 404.
//
// Streng read-only. Es werden NIE Secrets oder Price-IDs ausgeliefert.

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toEntitlement } from '@/lib/billing/entitlement'
import { statisticsGateMessage } from '@/lib/billing/gating'
import {
    QA_CONTRACT_VERSION,
    chargesRealMoney,
    classifyStripeKey,
    type QaContract,
} from '@/lib/qa-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRODUCT = 'basaltemperatur'

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
    const expected = process.env.QA_PROBE_SECRET?.trim()

    // Nicht konfiguriert → Route existiert für die Außenwelt nicht.
    if (!expected) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const provided = request.headers.get('x-qa-probe-secret') ?? ''
    if (!secretMatches(provided, expected)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let session: QaContract['session'] = null
    let entitlement: QaContract['entitlement'] = null

    if (user) {
        session = { userId: user.id, email: user.email ?? null }
        // Read-only: kein Upsert, die Sonde legt kein Profil an.
        const { data: profile } = await supabase
            .from('profiles')
            .select('has_lifetime_access, entitlement_source')
            .eq('id', user.id)
            .maybeSingle()
        entitlement = toEntitlement(profile)
    }

    // Checkout (app/api/checkout) und Webhook (app/api/stripe-webhook) laufen
    // in dieser App. Die einzige Edge Function des Projekts (delete-account)
    // fasst Stripe nicht an — der Schlüssel hier ist also der, der abrechnet.
    const keyMode = classifyStripeKey(process.env.STRIPE_SECRET_KEY)

    const contract: QaContract = {
        contractVersion: QA_CONTRACT_VERSION,
        product: PRODUCT,
        billing: {
            runtime: 'vercel',
            keyMode,
            chargesRealMoney: chargesRealMoney(keyMode),
        },
        auth: {
            kind: 'password',
            // Deutsche Routen, wörtlich wie in app/(auth)/ angelegt.
            signupPath: '/registrieren',
            loginPath: '/login',
            // Kontolöschung lebt in /einstellungen (AccountDangerZone), es gibt
            // keine eigene Seite dafür.
            deletePath: '/einstellungen',
            passwordResetPath: '/passwort-vergessen',
            // supabase/config.toml: [auth.email] enable_confirmations = false.
            // Die Registrierung liefert sofort eine Session und leitet nach
            // /onboarding weiter; der Bestätigungszweig in lib/actions/auth.ts
            // ist nur eine Absicherung, falls die Einstellung gehostet abweicht.
            emailConfirmationRequired: false,
            // What the confirmation mail must look like. GoTrue falls back to its
            // own unbranded default whenever the configured template fails to load,
            // and the link keeps working — so the flow would pass while every user
            // gets a mail from nobody. brandedMarker appears only in ours.
            mail: {
              fromAddress: 'info@basaltemperatur.online',
              subject: 'E-Mail-Adresse bestätigen · Basaltemperatur',
              brandedMarker: '© 2026 Basaltemperatur · Zykluswissen, klar und privat.',
            },
        },
        gating: {
            surface: '/statistiken',
            // Aus lib/billing/gating.ts — dieselbe Quelle, aus der die Seite
            // rendert. Deutsch, weil das UI deutsch ist.
            blockedCopy: statisticsGateMessage(),
            // Es gibt genau ein kostenpflichtiges Produkt: den einmaligen
            // Vollzugang (mode: 'payment', 9,99 €). Eine Auswahl zwischen
            // Plänen existiert nicht, also ist das zwangsläufig der Kauf, der
            // den Unterschied auf /statistiken sichtbar macht.
            testPlan: 'lifetime',
        },
        flags: {
            // Es gibt keinen Demo-/Unlock-Env-Schalter; die echten Umgehungen
            // sind die zusätzlichen Wege, has_lifetime_access zu setzen:
            //   - appStoreEntitlementEnabled: eine StoreKit-Transaktion schaltet
            //     Premium frei, ganz ohne Stripe-Zahlung
            //   - manualEntitlementPossible: entitlement_source 'manual' erlaubt
            //     es, den Zugang direkt in der DB zu setzen
            appStoreEntitlementEnabled: Boolean(
                process.env.APP_STORE_BUNDLE_ID && process.env.APP_STORE_LIFETIME_PRODUCT_ID
            ),
            manualEntitlementPossible: true,
        },
        session,
        entitlement,
    }

    return NextResponse.json(contract, { headers: { 'cache-control': 'no-store' } })
}
