'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { signUp } from '@/lib/actions/auth';

export function RegisterForm() {
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
      setError('Bitte akzeptiere die AGB und Datenschutzrichtlinien.');
      return;
    }

    if (!formData.acceptHealthData) {
      setError('Bitte willige in die Verarbeitung deiner Gesundheitsdaten ein.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Bitte wählen Sie ein sichereres Passwort.');
      return;
    }

    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.set('email', formData.email);
      fd.set('password', formData.password);
      fd.set('ownerName', formData.name);
      const result = await signUp(null, fd);

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : 'Ein Fehler ist aufgetreten.');
      } else if (result?.success) {
        router.push('/login?message=Bitte bestätige deine E-Mail-Adresse.');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Vollständiger Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="Max Mustermann"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
          className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="max@beispiel.de"
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            className="w-full px-4 py-3 pr-12 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          Ich akzeptiere die{' '}
          <a href="/agb" className="text-primary-600 hover:underline" target="_blank">
            AGB
          </a>,{' '}
          <a href="/datenschutz" className="text-primary-600 hover:underline" target="_blank">
            Datenschutzerklärung
          </a>{' '}
          und{' '}
          <a href="/widerruf" className="text-primary-600 hover:underline" target="_blank">
            Widerrufsbelehrung
          </a>.
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
          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="healthData" className="text-sm text-gray-600">
          Ich willige ausdrücklich in die Verarbeitung meiner{' '}
          <strong>Gesundheitsdaten</strong> (Basaltemperatur, Periodendaten) gemäß{' '}
          <a href="/datenschutz" className="text-primary-600 hover:underline" target="_blank">
            Art. 9 DSGVO
          </a>{' '}
          ein.
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Konto wird erstellt...
          </>
        ) : (
          'Registrieren'
        )}
      </button>
    </form>
  );
}
