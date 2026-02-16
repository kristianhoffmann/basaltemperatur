// Edge Function: send-email
// Generischer E-Mail-Versand über eigenen SMTP-Server
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "send-email"
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ============================================================
// CORS HEADERS (inline - keine externen Imports)
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// TYPES
// ============================================================
interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

// ============================================================
// HELPER: HTML Tags entfernen für Plain-Text Version
// ============================================================
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
    const { to, subject, html, text, replyTo }: EmailRequest = await req.json()

    // Validierung
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SMTP Konfiguration aus Secrets
    const SMTP_HOST = Deno.env.get('SMTP_HOST')!
    const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
    const SMTP_USER = Deno.env.get('SMTP_USER')!
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')!
    const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM_EMAIL')!
    const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') || 'Handwerker-CRM'

    // E-Mail senden via SMTP API (z.B. Resend, Postmark, oder eigener Server)
    // Passe die URL an deinen SMTP-Provider an
    const response = await fetch(`https://${SMTP_HOST}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMTP_PASSWORD}`,
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || stripHtml(html),
        reply_to: replyTo,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SMTP Error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
