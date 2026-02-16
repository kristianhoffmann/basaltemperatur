// Edge Function: process-email-queue
// Verarbeitet die E-Mail-Warteschlange (Cron Job - jede Minute)
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "process-email-queue"
// 
// CRON SETUP:
// 1. Supabase Dashboard → Database → Extensions → pg_cron aktivieren
// 2. SQL Editor → Folgenden SQL ausführen:
//    SELECT cron.schedule(
//      'process-email-queue',
//      '* * * * *',
//      $$SELECT net.http_post(
//        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue',
//        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//      )$$
//    );
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
    console.log('Processing email queue...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Pending E-Mails holen (max 10 pro Durchlauf)
    // Nutzt die SQL Function get_pending_emails aus Migration 013_019
    const { data: pendingEmails, error: fetchError } = await supabase
      .rpc('get_pending_emails', { p_limit: 10 })

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError)
      throw fetchError
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails')
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingEmails.length} emails...`)

    let successCount = 0
    let failCount = 0

    for (const email of pendingEmails) {
      try {
        // E-Mail senden über send-email Function
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: email.to_email,
            subject: email.subject,
            html: email.html_body,
            text: email.text_body,
            replyTo: email.reply_to
          }),
        })

        if (response.ok) {
          const result = await response.json()
          
          // Als gesendet markieren (SQL Function)
          await supabase.rpc('mark_email_sent', {
            p_email_id: email.id,
            p_smtp_message_id: result.messageId || null
          })
          
          successCount++
          console.log(`Email sent: ${email.id} to ${email.to_email}`)
          
        } else {
          const errorText = await response.text()
          
          // Als fehlgeschlagen markieren (SQL Function)
          await supabase.rpc('mark_email_failed', {
            p_email_id: email.id,
            p_error_message: errorText
          })
          
          failCount++
          console.error(`Email failed: ${email.id} - ${errorText}`)
        }

      } catch (emailError) {
        // Als fehlgeschlagen markieren
        await supabase.rpc('mark_email_failed', {
          p_email_id: email.id,
          p_error_message: emailError.message
        })
        
        failCount++
        console.error(`Email error: ${email.id} - ${emailError.message}`)
      }
    }

    const result = {
      success: true,
      processed: pendingEmails.length,
      sent: successCount,
      failed: failCount,
      timestamp: new Date().toISOString()
    }

    console.log('Queue processing completed:', result)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email queue error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
