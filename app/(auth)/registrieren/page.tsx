export const dynamic = 'force-dynamic'

import { normalizeFrom, withFrom } from '@/lib/seo-autopilot/source';
import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { googleAuthEnabled } from '@/lib/auth-providers';

export const metadata: Metadata = {
  title: 'Registrieren',
  description: 'Kostenloses Konto für das Basaltemperatur-Zyklustagebuch anlegen.',
};

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string; from?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { error, message, from: rawFrom } = await searchParams;
  const from = normalizeFrom(rawFrom);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text)]">Konto anlegen</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Kostenlos, ohne Zahlungsdaten. Das Eintragen bleibt dauerhaft frei.
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
      <div className="rounded-2xl border border-[var(--card-border)] bg-white p-6 shadow-card sm:p-8">
        <RegisterForm from={from} />

        {googleAuthEnabled && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">oder</span>
              </div>
            </div>

            <SocialLogin from={from} label="Mit Google registrieren" />
          </>
        )}

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Bereits ein Konto?{' '}
          <Link
            href={withFrom("/login", from)}
            className="font-semibold text-[var(--text)] underline underline-offset-2"
          >
            Jetzt anmelden
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-[var(--text-muted)]">
        Basaltemperatur ist ein Zyklustagebuch – kein Medizinprodukt und kein Verhütungsmittel.
      </p>
    </div>
  );
}
