// app/api/stripe-webhook/route.ts
// Handles Stripe webhook events – grants lifetime access on successful payment

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const expectedPriceId = process.env.STRIPE_PRICE_ID

const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2023-10-16',
})

// Use service role to update profiles (webhook has no user session)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
    if (!stripeSecretKey || !stripeWebhookSecret) {
        return NextResponse.json(
            { error: 'Stripe Webhook nicht vollständig konfiguriert (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).' },
            { status: 500 },
        )
    }

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            stripeWebhookSecret,
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id || session.client_reference_id

        if (session.mode !== 'payment' || session.payment_status !== 'paid') {
            return NextResponse.json({ received: true })
        }

        if (!userId) {
            console.error('Webhook checkout.session.completed without user_id/client_reference_id')
            return NextResponse.json({ error: 'Missing user reference' }, { status: 400 })
        }

        if (expectedPriceId) {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
            const hasExpectedPrice = lineItems.data.some((item) => item.price?.id === expectedPriceId)

            if (!hasExpectedPrice) {
                console.warn(`Ignoring checkout session ${session.id}: expected price ${expectedPriceId} not found.`)
                return NextResponse.json({ received: true })
            }
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ has_lifetime_access: true })
            .eq('id', userId)

        if (error) {
            console.error('Failed to grant lifetime access:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        console.log(`✅ Lifetime access granted to user: ${userId}`)
    }

    return NextResponse.json({ received: true })
}
