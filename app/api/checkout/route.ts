// app/api/checkout/route.ts
// Creates a Stripe Checkout Session for the €9.99 lifetime payment

import { createClient } from '@/lib/supabase/server'
import { after, NextResponse } from 'next/server'
import { normalizeFrom } from '@/lib/seo-autopilot/source'
import Stripe from 'stripe'
import { trackConversion, shouldTrackAccount } from '@/lib/seo-autopilot/attribution'

// Bump when the wording of the early-start request in UpgradeBanner changes.
const EARLY_START_TEXT_VERSION = '2026-09-16'

async function handleCheckout(request: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()
    const stripePriceId = process.env.STRIPE_PRICE_ID?.trim()
    const body = await request.json().catch(() => null) as { earlyStartRequested?: unknown } | null
    // § 357a Abs. 2 BGB: without a recorded express request there is no claim to
    // proportional payment after a withdrawal, so the request is part of the order.
    if (body?.earlyStartRequested !== true) {
        return NextResponse.json(
            { error: 'Bitte bestätige zuerst den sofortigen Beginn der Freischaltung.' },
            { status: 400 },
        )
    }

    if (!stripeSecretKey || !stripePriceId) {
        return NextResponse.json(
            { error: 'Stripe ist nicht vollständig konfiguriert (STRIPE_SECRET_KEY / STRIPE_PRICE_ID).' },
            { status: 503, headers: { 'Retry-After': '60' } },
        )
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has lifetime access
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_lifetime_access')
        .eq('id', user.id)
        .single()

    if (profileError) return NextResponse.json({ error: 'Daten vorübergehend nicht verfügbar.' }, { status: 503, headers: { 'Retry-After': '60' } })

    if (profile?.has_lifetime_access) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.basaltemperatur.online').replace(/\/$/, '')
    const isLiveMode = stripeSecretKey.startsWith('sk_live_')
    const isLocalAppUrl = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')

    if (isLiveMode && isLocalAppUrl) {
        return NextResponse.json(
            {
                error:
                    'Live-Stripe ist mit localhost-URLs blockiert. Setze NEXT_PUBLIC_APP_URL auf deine öffentliche Domain.',
            },
            { status: 503, headers: { 'Retry-After': '60' } },
        )
    }

    const attribution = { slug: normalizeFrom(user.user_metadata?.seo_from) }
    const reportable = isLiveMode && shouldTrackAccount(user)

    const metadata: Record<string, string> = {
        user_id: user.id,
        entitlement: 'lifetime_access',
        seo_excluded: reportable ? 'false' : 'true',
        early_start_requested_at: new Date().toISOString(),
        early_start_text_version: EARLY_START_TEXT_VERSION,
    }
    if (attribution.slug) metadata.seo_slug = attribution.slug.slice(0, 500)

    let session: Stripe.Checkout.Session
    try {
        session = await stripe.checkout.sessions.create({
            mode: 'payment',
            locale: 'de',
            submit_type: 'pay',
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            client_reference_id: user.id,
            metadata,
            customer_email: user.email,
            success_url: `${appUrl}/erfolg?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/dashboard`,
        })

    } catch {
        return NextResponse.json({ error: 'Checkout vorübergehend nicht verfügbar.' }, { status: 503, headers: { 'Retry-After': '60' } })
    }

    if (reportable) after(() => trackConversion({
        eventName: 'checkout_started',
        idempotencyKey: `checkout:${session.id}`,
    }, attribution))

    return NextResponse.json({ url: session.url })
}

export async function POST(request: Request) {
  try {
    return await handleCheckout(request)
  } catch {
    return NextResponse.json({ error: 'Dienst vorübergehend nicht verfügbar.' }, {
      status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    })
  }
}
