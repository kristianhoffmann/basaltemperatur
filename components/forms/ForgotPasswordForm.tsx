'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail } from 'lucide-react'
import { resetPassword } from '@/lib/actions/auth'

export function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.set('email', email)
      const result = await resetPassword(null, formData)

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Ein Fehler ist aufgetreten.')
      } else {
        router.push('/passwort-vergessen?success=true')
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          E-Mail-Adresse
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="max@beispiel.de"
          />
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
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
            E-Mail wird gesendet...
          </>
        ) : (
          'Link zum Zurücksetzen senden'
        )}
      </button>
    </form>
  )
}
