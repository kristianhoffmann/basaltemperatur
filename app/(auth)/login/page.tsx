export const dynamic = 'force-dynamic'

// app/(auth)/login/page.tsx
// Login Seite – Premium Design

import { normalizeFrom, withFrom } from '@/lib/seo-autopilot/source'
import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/LoginForm'
import { SocialLogin } from '@/components/auth/SocialLogin'
import { googleAuthEnabled } from '@/lib/auth-providers'

export const metadata: Metadata = {
  title: 'Anmelden',
  description: 'Melde dich bei deinem Basaltemperatur Konto an.',
}

export default async function LoginPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; message?: string; from?: string | string[] }>
}) {
  const searchParams = await searchParamsPromise
  const from = normalizeFrom(searchParams.from)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Willkommen zurück
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Melde dich an, um fortzufahren
        </p>
      </div>

      {/* Error/Success Messages */}
      {searchParams.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {searchParams.error === 'invalid_credentials' && 'Ungültige E-Mail oder Passwort.'}
          {searchParams.error === 'email_not_confirmed' && 'Bitte bestätige zuerst deine E-Mail-Adresse.'}
          {searchParams.error === 'unknown' && 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'}
        </div>
      )}

      {searchParams.message && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-600">
          {searchParams.message === 'password_reset' && 'Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.'}
          {searchParams.message === 'email_confirmed' && 'E-Mail bestätigt! Du kannst dich jetzt anmelden.'}
          {searchParams.message === 'check_email' && 'Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link geschickt.'}
        </div>
      )}

      {/* Login Form */}
      <LoginForm from={from} redirectTo={searchParams.redirect} />

      {googleAuthEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}>oder</span>
            </div>
          </div>

          <div className="space-y-3">
            <SocialLogin from={from} />
          </div>
        </>
      )}

      {/* Register Link */}
      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Noch kein Konto?{' '}
        <Link href={withFrom("/registrieren", from)} className="font-medium text-rose-400 hover:text-rose-500 transition-colors">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  )
}
