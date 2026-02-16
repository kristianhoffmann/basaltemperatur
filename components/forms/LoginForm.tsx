// components/forms/LoginForm.tsx
// Login Formular mit E-Mail und Passwort

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      if (error.message === 'Invalid login credentials') {
        setError('Ungültige E-Mail oder Passwort.')
      } else if (error.message === 'Email not confirmed') {
        setError('Bitte bestätige zuerst deine E-Mail-Adresse.')
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
      }
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="E-Mail"
        placeholder="name@beispiel.de"
        autoComplete="email"
        required
        disabled={isLoading}
      />

      <div className="relative">
        <Input
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Passwort"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-gray-300 text-rose-400 focus:ring-rose-400"
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Angemeldet bleiben</span>
        </label>
        <Link
          href="/passwort-vergessen"
          className="text-sm font-medium text-rose-400 hover:text-rose-500 transition-colors"
        >
          Passwort vergessen?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
      >
        Anmelden
      </Button>
    </form>
  )
}
