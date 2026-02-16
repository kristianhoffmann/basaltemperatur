// Edge Function: cleanup-demo
// Löscht abgelaufene Demo-Sessions (Cron Job - täglich)
// 
// ============================================================
// ANLEITUNG: Kopiere ALLES in Supabase Dashboard → Edge Functions → New Function → "cleanup-demo"
// 
// CRON SETUP:
// 1. Supabase Dashboard → Database → Extensions → pg_cron aktivieren
// 2. SQL Editor → Folgenden SQL ausführen:
//    SELECT cron.schedule(
//      'cleanup-demo-daily',
//      '0 3 * * *',
//      $$SELECT net.http_post(
//        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-demo',
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
    console.log('Starting demo cleanup...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Abgelaufene Demo-Sessions finden (älter als 30 Tage, nicht konvertiert)
    const { data: expiredSessions, error } = await supabase
      .from('demo_sessions')
      .select('id, session_token, demo_customer_ids, demo_project_ids')
      .lt('expires_at', new Date().toISOString())
      .is('converted_to_user_id', null)

    if (error) {
      console.error('Error fetching expired sessions:', error)
      throw error
    }

    console.log(`Found ${expiredSessions?.length || 0} expired sessions`)

    let cleanedCount = 0
    let errorCount = 0

    for (const session of expiredSessions || []) {
      try {
        // Demo-Kunden löschen (CASCADE löscht auch Projekte, Angebote, Rechnungen, etc.)
        if (session.demo_customer_ids && session.demo_customer_ids.length > 0) {
          const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .in('id', session.demo_customer_ids)

          if (deleteError) {
            console.error(`Error deleting customers for session ${session.id}:`, deleteError)
          }
        }

        // Session löschen
        const { error: sessionError } = await supabase
          .from('demo_sessions')
          .delete()
          .eq('id', session.id)

        if (sessionError) {
          console.error(`Error deleting session ${session.id}:`, sessionError)
          errorCount++
        } else {
          cleanedCount++
          console.log(`Cleaned session: ${session.id}`)
        }

      } catch (sessionError) {
        console.error(`Error processing session ${session.id}:`, sessionError)
        errorCount++
      }
    }

    const result = {
      success: true,
      cleaned: cleanedCount,
      errors: errorCount,
      total: expiredSessions?.length || 0,
      timestamp: new Date().toISOString()
    }

    console.log('Cleanup completed:', result)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Demo cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
