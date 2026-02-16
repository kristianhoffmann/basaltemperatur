// Edge Function: create-checkout-session
// Erstellt eine Stripe Checkout Session für Abo-Upgrades
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "create-checkout-session"
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

// ============================================================
// CORS HEADERS (inline - keine externen Imports)
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Auth prüfen
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Request Body
    const { priceId, successUrl, cancelUrl } = await req.json()

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'priceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Profil laden für E-Mail
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, company_name, owner_name')
      .eq('id', user.id)
      .single()

    // Prüfen ob bereits Stripe Customer existiert
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSub?.stripe_customer_id

    // Stripe Customer erstellen falls nicht vorhanden
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.company_name || profile?.owner_name || undefined,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Customer ID speichern
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan_id: 'starter',
          status: 'inactive',
        }, {
          onConflict: 'user_id'
        })
    }

    // App URL
    const appUrl = Deno.env.get('APP_URL') || 'https://handwerker-crm.de'

    // Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 14 Tage kostenlose Testphase
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
        },
      },
      metadata: {
        user_id: user.id,
      },
      client_reference_id: user.id,
      success_url: successUrl || `${appUrl}/einstellungen/abo?success=true`,
      cancel_url: cancelUrl || `${appUrl}/einstellungen/abo?cancelled=true`,
      locale: 'de',
      // Keine Steuern (Kleinunternehmer §19 UStG)
      automatic_tax: { enabled: false },
      // Rechnungsadresse erfragen
      billing_address_collection: 'required',
      // Kundenportal aktivieren
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    console.log(`Checkout session created for user ${user.id}: ${session.id}`)

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Checkout session error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
