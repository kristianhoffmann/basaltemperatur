// Edge Function: stripe-webhook
// Verarbeitet Stripe Webhook Events (Subscriptions, Payments, etc.)
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "stripe-webhook"
// 
// STRIPE SETUP:
// 1. Stripe Dashboard → Developers → Webhooks → Add Endpoint
// 2. URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
// 3. Events auswählen:
//    - checkout.session.completed
//    - customer.subscription.created
//    - customer.subscription.updated
//    - customer.subscription.deleted
//    - invoice.paid
//    - invoice.payment_failed
// 4. Webhook Signing Secret kopieren → als STRIPE_WEBHOOK_SECRET Secret speichern
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

// ============================================================
// CORS HEADERS (inline - keine externen Imports)
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// HELPER: Plan ID aus Stripe Price ID ermitteln
// ============================================================
function getPlanFromPriceId(priceId: string): { planId: string; billingCycle: string } {
  // Diese IDs müssen mit deinen Stripe Price IDs übereinstimmen
  const priceMap: Record<string, { planId: string; billingCycle: string }> = {
    // Handwerker Plan
    [Deno.env.get('STRIPE_PRICE_HANDWERKER_MONTHLY') || 'price_handwerker_monthly']: { planId: 'handwerker', billingCycle: 'monthly' },
    [Deno.env.get('STRIPE_PRICE_HANDWERKER_YEARLY') || 'price_handwerker_yearly']: { planId: 'handwerker', billingCycle: 'yearly' },
    // Meister Plan
    [Deno.env.get('STRIPE_PRICE_MEISTER_MONTHLY') || 'price_meister_monthly']: { planId: 'meister', billingCycle: 'monthly' },
    [Deno.env.get('STRIPE_PRICE_MEISTER_YEARLY') || 'price_meister_yearly']: { planId: 'meister', billingCycle: 'yearly' },
  }

  return priceMap[priceId] || { planId: 'starter', billingCycle: 'monthly' }
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Webhook Signature verifizieren
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No stripe-signature header')
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing event: ${event.type}`)

    // ========================================
    // EVENT HANDLERS
    // ========================================

    switch (event.type) {
      // ----------------------------------------
      // CHECKOUT COMPLETED (Neues Abo)
      // ----------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const userId = session.metadata?.user_id || session.client_reference_id
          
          if (!userId) {
            console.error('No user_id in session metadata')
            break
          }

          const priceId = subscription.items.data[0]?.price.id
          const { planId, billingCycle } = getPlanFromPriceId(priceId)

          // Subscription in DB speichern/aktualisieren
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              plan_id: planId,
              billing_cycle: billingCycle,
              status: subscription.status,
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            console.error('Error saving subscription:', error)
          } else {
            console.log(`Subscription created for user ${userId}: ${planId} (${billingCycle})`)
          }
        }
        break
      }

      // ----------------------------------------
      // SUBSCRIPTION UPDATED
      // ----------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        const priceId = subscription.items.data[0]?.price.id
        const { planId, billingCycle } = getPlanFromPriceId(priceId)

        const { error } = await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan_id: planId,
            billing_cycle: billingCycle,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log(`Subscription updated: ${subscription.id} → ${subscription.status}`)
        }
        break
      }

      // ----------------------------------------
      // SUBSCRIPTION DELETED (Gekündigt)
      // ----------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            plan_id: 'starter', // Zurück zum Free Plan
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error deleting subscription:', error)
        } else {
          console.log(`Subscription cancelled: ${subscription.id}`)
        }
        break
      }

      // ----------------------------------------
      // INVOICE PAID (Zahlung erfolgreich)
      // ----------------------------------------
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Payment History speichern
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (sub) {
            await supabase
              .from('payment_history')
              .insert({
                user_id: sub.user_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount_cents: invoice.amount_paid,
                currency: invoice.currency.toUpperCase(),
                status: 'succeeded',
                invoice_pdf_url: invoice.invoice_pdf,
                receipt_url: invoice.hosted_invoice_url,
                paid_at: new Date().toISOString(),
              })

            console.log(`Payment recorded for user ${sub.user_id}: ${invoice.amount_paid / 100} ${invoice.currency}`)
          }
        }
        break
      }

      // ----------------------------------------
      // INVOICE PAYMENT FAILED
      // ----------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Status auf past_due setzen
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription)

          if (!error) {
            console.log(`Payment failed for subscription: ${invoice.subscription}`)
          }

          // Optional: Benachrichtigungs-E-Mail senden
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id, profiles(email)')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (sub?.profiles?.email) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                to: sub.profiles.email,
                subject: 'Zahlung fehlgeschlagen - Handwerker-CRM',
                html: `<p>Leider konnte deine Zahlung nicht verarbeitet werden. Bitte aktualisiere deine Zahlungsmethode in den Einstellungen.</p>`,
              }),
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
