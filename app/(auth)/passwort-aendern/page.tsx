export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'
import { Logo } from '@/components/shared/Logo'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Neues Passwort | Basaltemperatur',
  description: 'Legen Sie Ihr neues Passwort fest.',
}

interface PageProps {
  searchParams: { code?: string; error?: string }
}

export default function ResetPasswordPage({ searchParams }: PageProps) {
  const { code, error } = searchParams

  // If there's no code and no error, redirect to forgot password
  if (!code && !error) {
    redirect('/passwort-vergessen')
  }

  // If there's an error from the callback
  if (error) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Link ungültig oder abgelaufen
          </h2>
          <p className="text-gray-600 mb-6">
            Der Link zum Zurücksetzen Ihres Passworts ist leider ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.
          </p>
          <Link
            href="/passwort-vergessen"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size="lg" />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Neues Passwort festlegen
        </h1>
        <p className="mt-2 text-gray-600">
          Wählen Sie ein sicheres Passwort für Ihr Konto
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <ResetPasswordForm />
      </div>

      {/* Help Text */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Erinnern Sie sich an Ihr Passwort?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Jetzt anmelden
        </Link>
      </p>
    </div>
  )
}
