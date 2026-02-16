export const dynamic = 'force-dynamic'

// app/(auth)/login/page.tsx
// Login Seite – Premium Design

import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/LoginForm'
import { SocialLogin } from '@/components/auth/SocialLogin'

export const metadata: Metadata = {
  title: 'Anmelden',
  description: 'Melde dich bei deinem Basaltemperatur Konto an.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string; message?: string }
}) {
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
        </div>
      )}

      {/* Login Form */}
      <LoginForm redirectTo={searchParams.redirect} />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}>oder</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <SocialLogin />
      </div>

      {/* Register Link */}
      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Noch kein Konto?{' '}
        <Link href="/registrieren" className="font-medium text-rose-400 hover:text-rose-500 transition-colors">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  )
}
