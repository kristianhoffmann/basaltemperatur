// Edge Function: send-welcome-email
// Sendet Willkommens-E-Mail nach Registrierung
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "send-welcome-email"
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
// HELPER: Willkommens-E-Mail HTML generieren
// ============================================================
function generateWelcomeEmail(ownerName: string, companyName?: string): string {
  const name = ownerName || 'Handwerker'
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Willkommen bei Handwerker-CRM! 🎉</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Vom Anruf zur Rechnung in 3 Klicks</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hallo <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                schön, dass du dabei bist! ${companyName ? `Wir freuen uns, <strong>${companyName}</strong> bei uns begrüßen zu dürfen.` : ''}
              </p>
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">Deine ersten Schritte:</p>
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">✅ <strong>1.</strong> Profil vervollständigen (Logo, Firmendaten)</p>
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">✅ <strong>2.</strong> Ersten Kunden anlegen</p>
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 14px;">✅ <strong>3.</strong> Erstes Angebot schreiben</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2; border-left: 4px solid #6db784; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                      <strong>💡 Tipp:</strong> Lege Leistungsvorlagen an, um Angebote noch schneller zu erstellen!
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="https://handwerker-crm.de/dashboard" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Zum Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px;">
                Viel Erfolg!<br><strong>Dein Handwerker-CRM Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase Client erstellen
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Profil laden
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, owner_name, company_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Profile not found:', error)
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Willkommens-E-Mail generieren
    const emailHtml = generateWelcomeEmail(profile.owner_name, profile.company_name)

    // E-Mail über send-email Function senden
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: profile.email,
        subject: 'Willkommen bei Handwerker-CRM! 🎉',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send welcome email:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send welcome email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
