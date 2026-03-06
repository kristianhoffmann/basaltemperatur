export const dynamic = 'force-dynamic'

import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { SocialLogin } from '@/components/auth/SocialLogin';
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
        <SocialLogin label="Mit Google registrieren" />

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
