export const dynamic = 'force-dynamic'

import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { Logo } from '@/components/shared/Logo';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Passwort vergessen | Basaltemperatur',
  description: 'Setzen Sie Ihr Passwort zurück.',
};

interface PageProps {
  searchParams: { success?: string };
}

export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const isSuccess = searchParams.success === 'true';

  return (
    <div className="w-full max-w-md">
      {/* Back Link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Anmeldung
      </Link>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size="lg" />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Passwort vergessen?
        </h1>
        <p className="mt-2 text-gray-600">
          Kein Problem! Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            E-Mail gesendet!
          </h2>
          <p className="text-gray-600 mb-6">
            Wenn ein Konto mit dieser E-Mail-Adresse existiert, erhalten Sie in Kürze eine E-Mail mit weiteren Anweisungen.
          </p>
          <p className="text-sm text-gray-500">
            Keine E-Mail erhalten?{' '}
            <Link
              href="/passwort-vergessen"
              className="text-primary-600 hover:underline"
            >
              Erneut senden
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <ForgotPasswordForm />
        </div>
      )}

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
  );
}
