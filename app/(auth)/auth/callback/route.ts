// app/(auth)/auth/callback/route.ts
// OAuth und Magic Link Callback Handler

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Bei Password Recovery → Passwort-Ändern-Seite
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/passwort-aendern`)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, sensitive_data_consent_at')
          .eq('id', user.id)
          .maybeSingle()

        if ((!profile?.onboarding_completed || !profile?.sensitive_data_consent_at) && next !== '/onboarding') {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      // Weiterleitung nach erfolgreichem Login
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fehler → Login mit Fehlermeldung
  return NextResponse.redirect(`${origin}/login?error=unknown`)
}
