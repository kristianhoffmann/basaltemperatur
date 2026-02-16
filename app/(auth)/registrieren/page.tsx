export const dynamic = 'force-dynamic'

import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Logo } from '@/components/shared/Logo';

export const metadata: Metadata = {
  title: 'Registrieren | Basaltemperatur',
  description: 'Erstellen Sie Ihr Basaltemperatur-Konto und starten Sie noch heute.',
};

interface PageProps {
  searchParams: { error?: string; message?: string };
}

export default function RegisterPage({ searchParams }: PageProps) {
  const { error, message } = searchParams;

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size="lg" />
          <span className="text-xl font-bold text-gray-900">{'Basaltemperatur'}</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Konto erstellen
        </h1>
        <p className="mt-2 text-gray-600">
          Starten Sie kostenlos – keine Kreditkarte erforderlich
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      {/* Register Form */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <RegisterForm />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">oder</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <form action="/api/auth/google" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Mit Google registrieren
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Bereits ein Konto?{' '}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Jetzt anmelden
          </Link>
        </p>
      </div>

      {/* Terms */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Mit der Registrierung stimmen Sie unseren{' '}
        <Link href="/agb" className="text-primary-600 hover:underline">
          AGB
        </Link>{' '}
        und{' '}
        <Link href="/datenschutz" className="text-primary-600 hover:underline">
          Datenschutzrichtlinien
        </Link>{' '}
        zu.
      </p>
    </div>
  );
}
