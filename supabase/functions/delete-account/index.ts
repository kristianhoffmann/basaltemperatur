// Edge Function: delete-account
// Löscht einen User-Account vollständig (DSGVO Art. 17)
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "delete-account"
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // User aus JWT Token holen
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { confirmation } = await req.json()
    
    // Sicherheitscheck: User muss "LÖSCHEN" bestätigen
    if (confirmation !== 'LÖSCHEN') {
      return new Response(
        JSON.stringify({ error: 'Bitte bestätige die Löschung mit "LÖSCHEN"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Deleting account for user: ${user.id}`)

    // 1. Stripe Subscription kündigen falls vorhanden
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()
    
    if (subscription?.stripe_subscription_id) {
      try {
        const stripeResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            },
          }
        )
        
        if (!stripeResponse.ok) {
          console.error('Stripe cancellation failed:', await stripeResponse.text())
        } else {
          console.log('Stripe subscription cancelled')
        }
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        // Weiter machen, auch wenn Stripe fehlschlägt
      }
    }

    // 2. Daten anonymisieren (für GoBD - Rechnungen müssen 10 Jahre aufbewahrt werden)
    // Dies sollte über eine SQL Function erfolgen
    const { error: anonymizeError } = await supabaseAdmin.rpc('anonymize_user_data', {
      p_user_id: user.id
    })
    
    if (anonymizeError) {
      console.error('Anonymize error:', anonymizeError)
      // Versuche trotzdem fortzufahren
    }

    // 3. Bestätigungs-E-Mail senden
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: user.email,
          subject: 'Dein Account wurde gelöscht - Handwerker-CRM',
          html: `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; background-color: #e8f5f2; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
    <h2 style="color: #1b4d89; margin: 0 0 24px 0;">Dein Account wurde gelöscht</h2>
    <p style="color: #374151; line-height: 1.6;">Wie von dir angefordert, haben wir deinen Handwerker-CRM Account gelöscht.</p>
    <p style="color: #374151; line-height: 1.6;">Falls du Fragen hast, kontaktiere uns unter support@handwerker-crm.de</p>
    <p style="color: #374151; line-height: 1.6;">Wir hoffen, dich in Zukunft wieder begrüßen zu dürfen!</p>
  </div>
</body>
</html>`
        })
      })
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
    }

    // 4. Auth User löschen
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Account konnte nicht gelöscht werden' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Account deleted successfully: ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account wurde gelöscht' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete account error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
