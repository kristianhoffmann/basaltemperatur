// app/(auth)/auth/callback/route.ts
// OAuth und Magic Link Callback Handler

import { createClient } from '@/lib/supabase/server'
import { internalRedirect, normalizeFrom } from '@/lib/seo-autopilot/source'
import { trackConversion, shouldTrackAccount } from '@/lib/seo-autopilot/attribution'
import { after, NextResponse } from 'next/server'

async function handleCallback(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const nextParam = searchParams.get('next')
  const next = internalRedirect(nextParam)

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
        const from = normalizeFrom(user.user_metadata?.seo_from) ?? normalizeFrom(searchParams.get('from'))
        if (from && !normalizeFrom(user.user_metadata?.seo_from)) {
          try {
            const { error: sourceError } = await supabase.auth.updateUser({ data: { seo_from: from } })
            if (sourceError) console.error('[seo-autopilot] Could not persist OAuth source')
          } catch { console.error('[seo-autopilot] Could not persist OAuth source') }
        }
        // New OAuth users are created at their first sign-in. Existing users must not count as signups.
        const created = Date.parse(user.created_at)
        const signedIn = Date.parse(user.last_sign_in_at ?? '')
        if (user.identities?.some((identity) => identity.provider === 'google') &&
            Number.isFinite(created) && Number.isFinite(signedIn) && Math.abs(signedIn - created) < 60_000 &&
            shouldTrackAccount(user)) {
          after(() => trackConversion({ eventName: 'signup', idempotencyKey: `signup:${user.id}` }, { slug: from }))
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, sensitive_data_consent_at')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError
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

export async function GET(request: Request) {
  try {
    return await handleCallback(request)
  } catch {
    return NextResponse.json({ error: 'Dienst vorübergehend nicht verfügbar.' }, {
      status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    })
  }
}
