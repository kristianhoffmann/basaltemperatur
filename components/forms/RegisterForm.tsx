'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { signUp } from '@/lib/actions/auth';
import { SENSITIVE_DATA_CONSENT_TEXT } from '@/lib/legal/consent';

export function RegisterForm({ from }: { from?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    acceptTerms: false,
    acceptHealthData: false,
  });

  // Password strength check
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.acceptTerms) {
      setError('Bitte akzeptiere die AGB, um ein Konto anzulegen.');
      return;
    }

    if (!formData.acceptHealthData) {
      setError('Bitte willige in die Verarbeitung deiner Gesundheitsdaten ein.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Bitte wähle ein sichereres Passwort (siehe Hinweise unter dem Feld).');
      return;
    }

    setIsLoading(true);

    try {
      const fd = new FormData();
      if (from) fd.set('from', from);
      fd.set('email', formData.email);
      fd.set('password', formData.password);
      fd.set('ownerName', formData.name);
      fd.set('termsAccepted', 'true');
      fd.set('sensitiveDataConsent', 'true');
      const result = await signUp(null, fd);

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : 'Ein Fehler ist aufgetreten.');
      } else if (result?.success) {
        router.push('/login?message=check_email');
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {from && <input type="hidden" name="from" value={from} />}
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="label"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          placeholder="Dein Name"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="label"
        >
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input"
          placeholder="du@beispiel.de"
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="label"
        >
          Passwort
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="input pr-11"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password Strength Indicators */}
        {formData.password && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {Object.values(passwordChecks).map((check, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${check ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
            <ul className="text-xs space-y-1">
              {[
                { check: passwordChecks.length, label: 'Mindestens 8 Zeichen' },
                { check: passwordChecks.uppercase, label: 'Ein Großbuchstabe' },
                { check: passwordChecks.lowercase, label: 'Ein Kleinbuchstabe' },
                { check: passwordChecks.number, label: 'Eine Zahl' },
              ].map((item, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-1.5 ${item.check ? 'text-green-600' : 'text-gray-500'
                    }`}
                >
                  <Check
                    className={`w-3 h-3 ${item.check ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) =>
            setFormData({ ...formData, acceptTerms: e.target.checked })
          }
          className="mt-1 h-4 w-4 shrink-0 rounded border-[#B9AFA3] accent-[var(--rose)]"
        />
        <label htmlFor="terms" className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Ich akzeptiere die{' '}
          <a href="/agb" className="font-medium text-[var(--text)] underline underline-offset-2" target="_blank">
            AGB
          </a>{' '}
          und habe die{' '}
          <a href="/datenschutz" className="font-medium text-[var(--text)] underline underline-offset-2" target="_blank">
            Datenschutzerklärung
          </a>{' '}
          sowie die{' '}
          <a href="/widerruf" className="font-medium text-[var(--text)] underline underline-offset-2" target="_blank">
            Widerrufsbelehrung
          </a>{' '}
          zur Kenntnis genommen.
        </label>
      </div>

      {/* Health Data Consent Checkbox (Art. 9 DSGVO) */}
      <div className="flex items-start gap-3">
        <input
          id="healthData"
          name="healthData"
          type="checkbox"
          checked={formData.acceptHealthData}
          onChange={(e) =>
            setFormData({ ...formData, acceptHealthData: e.target.checked })
          }
          className="mt-1 h-4 w-4 shrink-0 rounded border-[#B9AFA3] accent-[var(--rose)]"
        />
        <label htmlFor="healthData" className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {SENSITIVE_DATA_CONSENT_TEXT}{' '}
          <a href="/datenschutz" className="font-medium text-[var(--text)] underline underline-offset-2" target="_blank">
            Datenschutzerklärung
          </a>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary btn-lg w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Konto wird erstellt...
          </>
        ) : (
          'Kostenlos registrieren'
        )}
      </button>
    </form>
  );
}
