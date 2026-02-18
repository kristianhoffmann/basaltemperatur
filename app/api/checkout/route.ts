// app/api/checkout/route.ts
// Creates a Stripe Checkout Session for the €9.99 lifetime payment

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
})

export async function POST() {
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.basaltemperatur.online'

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Basaltemperatur – Lifetime Zugang',
                        description: 'Einmalige Zahlung. Lebenslanger Zugang zu allen Features.',
                    },
                    unit_amount: 999, // €9.99 in cents
                },
                quantity: 1,
            },
        ],
        metadata: {
            user_id: user.id,
        },
        customer_email: user.email,
        success_url: `${appUrl}/erfolg?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
}
