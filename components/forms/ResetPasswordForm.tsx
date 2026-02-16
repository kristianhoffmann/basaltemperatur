'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check, Lock } from 'lucide-react'
import { updatePassword } from '@/lib/actions/auth'

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  // Password strength check
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordStrong) {
      setError('Bitte wählen Sie ein sichereres Passwort.')
      return
    }

    if (!passwordsMatch) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setIsLoading(true)

    try {
      const fd = new FormData()
      fd.set('password', formData.password)
      const result = await updatePassword(null, fd)

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : 'Ein Fehler ist aufgetreten.')
      } else {
        router.push('/login?message=Passwort erfolgreich geändert')
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* New Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Neues Passwort
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
            className="w-full pl-11 pr-12 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="••••••••"
          />
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

      {/* Confirm Password Field */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Passwort bestätigen
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className={`w-full pl-11 pr-4 py-3 text-gray-900 border rounded-lg focus:ring-2 transition-colors ${formData.confirmPassword && !passwordsMatch
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            placeholder="••••••••"
          />
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {formData.confirmPassword && !passwordsMatch && (
          <p className="mt-1.5 text-sm text-red-600">
            Die Passwörter stimmen nicht überein
          </p>
        )}
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
        disabled={isLoading || !isPasswordStrong || !passwordsMatch}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Passwort wird geändert...
          </>
        ) : (
          'Neues Passwort speichern'
        )}
      </button>
    </form>
  )
}
