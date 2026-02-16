// app/(auth)/auth/callback/route.ts
// OAuth und Magic Link Callback Handler

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Bei Password Recovery → Passwort-Ändern-Seite
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/passwort-aendern`)
      }

      // Direkt zum Dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fehler → Login mit Fehlermeldung
  return NextResponse.redirect(`${origin}/login?error=unknown`)
}
