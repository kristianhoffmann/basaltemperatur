// app/api/checkout/route.ts
// Creates a Stripe Checkout Session for the €9.99 lifetime payment

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_PRICE_ID

const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2023-10-16',
})

export async function POST() {
    if (!stripeSecretKey || !stripePriceId) {
        return NextResponse.json(
            { error: 'Stripe ist nicht vollständig konfiguriert (STRIPE_SECRET_KEY / STRIPE_PRICE_ID).' },
            { status: 500 },
        )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has lifetime access
    const { data: profile } = await supabase
        .from('profiles')
        .select('has_lifetime_access')
        .eq('id', user.id)
        .single()

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
            { status: 500 },
        )
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price: stripePriceId,
                quantity: 1,
            },
        ],
        client_reference_id: user.id,
        metadata: {
            user_id: user.id,
            entitlement: 'lifetime_access',
        },
        customer_email: user.email,
        success_url: `${appUrl}/erfolg?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
}
