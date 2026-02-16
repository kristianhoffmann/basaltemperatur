// Edge Function: delete-account
// Löscht einen User-Account vollständig (DSGVO Art. 17 – Recht auf Löschung)
// Gesundheitsdaten (Art. 9 DSGVO) werden per CASCADE hart gelöscht.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
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

    // 1. Gesundheitsdaten hart löschen (DSGVO Art. 9 – sensible Daten)
    // Falls CASCADE nicht konfiguriert ist, löschen wir explizit
    const tables = ['temperature_entries', 'period_entries']
    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error(`Error deleting from ${table}:`, error)
      }
    }

    // 2. Profil löschen
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // 3. Auth User löschen
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
      JSON.stringify({ success: true, message: 'Account und alle Daten wurden gelöscht' }),
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
