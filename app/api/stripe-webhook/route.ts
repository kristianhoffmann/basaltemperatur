// app/api/stripe-webhook/route.ts
// Handles Stripe webhook events – grants lifetime access on successful payment

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
})

// Use service role to update profiles (webhook has no user session)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
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
            process.env.STRIPE_WEBHOOK_SECRET!,
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (userId && session.payment_status === 'paid') {
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
    }

    return NextResponse.json({ received: true })
}
