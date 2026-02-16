# Authentifizierung – Handwerker-CRM

## Übersicht

Die Authentifizierung nutzt **Supabase Auth** mit folgenden Login-Methoden:
- E-Mail/Passwort (mit E-Mail-Verifizierung)
- Magic Link (passwortlos)
- Google OAuth 2.0
- GitHub OAuth
- Apple Sign-In

---

## 1. Supabase Auth Konfiguration

### 1.1 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (für API Routes)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 1.2 Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect zu Login wenn nicht authentifiziert
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

---

## 2. OAuth Provider Setup

### 2.1 Google OAuth

**Supabase Dashboard:**
1. Authentication → Providers → Google
2. Client ID und Client Secret von Google Cloud Console

**Google Cloud Console:**
1. APIs & Services → Credentials → OAuth 2.0 Client ID
2. Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

```typescript
// Google Sign-In
const signInWithGoogle = async () => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) {
    console.error('Google Sign-In Error:', error.message)
  }
}
```

### 2.2 GitHub OAuth

**Supabase Dashboard:**
1. Authentication → Providers → GitHub
2. Client ID und Client Secret von GitHub

**GitHub Settings:**
1. Settings → Developer Settings → OAuth Apps → New
2. Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

```typescript
// GitHub Sign-In
const signInWithGitHub = async () => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    console.error('GitHub Sign-In Error:', error.message)
  }
}
```

### 2.3 Apple Sign-In

**Supabase Dashboard:**
1. Authentication → Providers → Apple
2. Service ID, Team ID, Key ID, Private Key

**Apple Developer Console:**
1. Certificates, Identifiers & Profiles
2. Service ID mit Sign In with Apple konfigurieren
3. Return URL: `https://your-project.supabase.co/auth/v1/callback`

```typescript
// Apple Sign-In
const signInWithApple = async () => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    console.error('Apple Sign-In Error:', error.message)
  }
}
```

---

## 3. E-Mail Authentifizierung

### 3.1 E-Mail/Passwort Registration

```typescript
// Registrierung
const signUp = async (email: string, password: string, metadata: object) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        owner_name: metadata.ownerName,
        company_name: metadata.companyName,
      },
    },
  })
  
  if (error) throw error
  
  return data
}
```

### 3.2 E-Mail/Passwort Login

```typescript
// Login
const signIn = async (email: string, password: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  return data
}
```

### 3.3 Magic Link (Passwortlos)

```typescript
// Magic Link senden
const sendMagicLink = async (email: string) => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) throw error
}
```

---

## 4. Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Prüfe ob Profil existiert, sonst erstellen
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (!profile) {
          // Neues Profil erstellen
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            owner_name: user.user_metadata?.owner_name || user.user_metadata?.full_name || '',
            company_name: user.user_metadata?.company_name || '',
          })
          
          // Redirect zu Onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth Error - zurück zum Login
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
```

---

## 5. Session Management

### 5.1 Session prüfen

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return <div>Willkommen, {user.email}</div>
}
```

### 5.2 Logout

```typescript
const signOut = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/auth/login'
}
```

---

## 6. Middleware (Route Protection)

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Schütze alle Routes außer:
    '/((?!_next/static|_next/image|favicon.ico|auth|api/webhook|$).*)',
  ],
}
```

---

## 7. Auth UI Komponenten

### 7.1 Login Page

```tsx
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    setLoading(true)
    
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f5f2]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#1b4d89] mb-6 text-center">
          Handwerker-CRM
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1b4d89] focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1b4d89] focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1b4d89] text-white py-3 rounded-xl font-medium hover:bg-[#143a66] transition disabled:opacity-50"
          >
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500">oder</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            <GoogleIcon />
            Mit Google anmelden
          </button>
          
          <button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            <GitHubIcon />
            Mit GitHub anmelden
          </button>
          
          <button
            onClick={() => handleOAuthLogin('apple')}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            <AppleIcon />
            Mit Apple anmelden
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Noch kein Konto?{' '}
          <a href="/auth/register" className="text-[#1b4d89] font-medium hover:underline">
            Jetzt registrieren
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## 8. SMTP-Server Konfiguration

### 8.1 Eigener SMTP-Server in Supabase

**Supabase Dashboard → Project Settings → Auth → SMTP Settings**

```
SMTP Host:        mail.dein-server.de
SMTP Port:        587 (TLS) oder 465 (SSL)
SMTP User:        noreply@handwerker-crm.de
SMTP Password:    ********
Sender Email:     noreply@handwerker-crm.de
Sender Name:      Handwerker-CRM
```

### 8.2 Environment Variables für Edge Functions

```env
# SMTP Konfiguration für Edge Functions
SMTP_HOST=mail.dein-server.de
SMTP_PORT=587
SMTP_USER=noreply@handwerker-crm.de
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@handwerker-crm.de
SMTP_FROM_NAME=Handwerker-CRM
```

### 8.3 E-Mail-Typen

| E-Mail-Typ | Trigger | Template |
|------------|---------|----------|
| Registrierung | `signUp()` | `confirm_signup` |
| Magic Link | `signInWithOtp()` | `magic_link` |
| Passwort vergessen | `resetPasswordForEmail()` | `reset_password` |
| E-Mail ändern | `updateUser({ email })` | `change_email` |
| Zahlungserinnerung | Edge Function | `payment_reminder` |
| Rechnung überfällig | Edge Function | `invoice_overdue` |
| Willkommen | Edge Function | `welcome` |

---

## 9. E-Mail Templates

### 9.1 Supabase E-Mail Templates

**Supabase Dashboard → Authentication → Email Templates**

**Bestätigungs-E-Mail (confirm_signup):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1b4d89; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1b4d89; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Handwerker-CRM</h1>
    </div>
    <div class="content">
      <h2>Willkommen bei Handwerker-CRM!</h2>
      <p>Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, um loszulegen:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" class="button">E-Mail bestätigen</a>
      </p>
      <p><small>Dieser Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, ignoriere diese E-Mail.</small></p>
    </div>
    <div class="footer">
      <p>© 2025 Handwerker-CRM | <a href="https://handwerker-crm.de/datenschutz">Datenschutz</a></p>
    </div>
  </div>
</body>
</html>
```

**Magic Link (magic_link):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1b4d89; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1b4d89; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Handwerker-CRM</h1>
    </div>
    <div class="content">
      <h2>Dein Login-Link</h2>
      <p>Klicke auf den Button, um dich ohne Passwort anzumelden:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" class="button">Jetzt anmelden</a>
      </p>
      <p><small>Dieser Link ist 1 Stunde gültig und kann nur einmal verwendet werden.</small></p>
    </div>
    <div class="footer">
      <p>© 2025 Handwerker-CRM</p>
    </div>
  </div>
</body>
</html>
```

**Passwort zurücksetzen (reset_password):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1b4d89; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1b4d89; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Handwerker-CRM</h1>
    </div>
    <div class="content">
      <h2>Passwort zurücksetzen</h2>
      <p>Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button, um ein neues Passwort zu wählen:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" class="button">Neues Passwort wählen</a>
      </p>
      <div class="warning">
        <strong>⚠️ Nicht angefordert?</strong><br>
        Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.
      </div>
      <p><small>Dieser Link ist 1 Stunde gültig.</small></p>
    </div>
    <div class="footer">
      <p>© 2025 Handwerker-CRM</p>
    </div>
  </div>
</body>
</html>
```

---

## 10. Passwort vergessen Flow

### 10.1 Frontend Implementation

```typescript
// components/auth/ForgotPasswordForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError('E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-green-800">E-Mail gesendet!</h3>
        <p className="text-green-700 mt-2">
          Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen deines Passworts.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail-Adresse
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
          placeholder="deine@email.de"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50"
      >
        {loading ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
      </button>
    </form>
  )
}
```

### 10.2 Reset Password Page

```typescript
// app/auth/reset-password/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (error) {
      setError('Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.')
    } else {
      router.push('/auth/login?message=password_updated')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary-500 mb-6">
          Neues Passwort wählen
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neues Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 11. Account löschen

### 11.1 SQL Function für Account-Löschung

```sql
-- migrations/020_account_deletion.sql

-- Function zum vollständigen Löschen eines Accounts
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Prüfe ob User existiert
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- 1. Lösche alle Termine
    DELETE FROM appointments WHERE user_id = p_user_id;
    
    -- 2. Lösche alle Line Items (über Angebote/Rechnungen)
    DELETE FROM line_items WHERE quote_id IN (
        SELECT id FROM quotes WHERE user_id = p_user_id
    );
    DELETE FROM line_items WHERE invoice_id IN (
        SELECT id FROM invoices WHERE user_id = p_user_id
    );
    
    -- 3. Lösche alle Rechnungen
    DELETE FROM invoices WHERE user_id = p_user_id;
    
    -- 4. Lösche alle Angebote
    DELETE FROM quotes WHERE user_id = p_user_id;
    
    -- 5. Lösche alle Projekte
    DELETE FROM projects WHERE user_id = p_user_id;
    
    -- 6. Lösche alle Kunden
    DELETE FROM customers WHERE user_id = p_user_id;
    
    -- 7. Lösche alle Vorlagen
    DELETE FROM templates WHERE user_id = p_user_id;
    
    -- 8. Lösche Audit-Log
    DELETE FROM audit_log WHERE user_id = p_user_id;
    
    -- 9. Lösche Subscription
    DELETE FROM subscriptions WHERE user_id = p_user_id;
    
    -- 10. Lösche Payment History
    DELETE FROM payment_history WHERE user_id = p_user_id;
    
    -- 11. Lösche Profil
    DELETE FROM profiles WHERE id = p_user_id;
    
    -- 12. Lösche Auth User (über Admin API)
    -- Dies wird über Edge Function gemacht
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für Anonymisierung statt Löschung (für GoBD-Compliance)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Anonymisiere Profil (behalte für Rechnungsarchiv)
    UPDATE profiles SET
        email = 'deleted_' || p_user_id || '@deleted.local',
        owner_name = 'Gelöschter Nutzer',
        company_name = NULL,
        phone = NULL,
        mobile = NULL,
        street = NULL,
        postal_code = NULL,
        city = NULL,
        tax_id = NULL,
        vat_id = NULL,
        iban = NULL,
        bic = NULL,
        logo_url = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Anonymisiere Kunden
    UPDATE customers SET
        first_name = 'Gelöscht',
        last_name = 'Gelöscht',
        company_name = NULL,
        email = NULL,
        phone = NULL,
        street = NULL,
        notes = NULL,
        deleted_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 11.2 Edge Function für Account-Löschung

```typescript
// supabase/functions/delete-account/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // User aus JWT Token holen
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { confirmation } = await req.json()
    
    // Sicherheitscheck: User muss "LÖSCHEN" bestätigen
    if (confirmation !== 'LÖSCHEN') {
      return new Response(
        JSON.stringify({ error: 'Bitte bestätige die Löschung mit "LÖSCHEN"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Stripe Subscription kündigen falls vorhanden
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()
    
    if (subscription?.stripe_subscription_id) {
      // Stripe API aufrufen zum Kündigen
      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
          },
        }
      )
      
      if (!stripeResponse.ok) {
        console.error('Stripe cancellation failed:', await stripeResponse.text())
      }
    }

    // 2. Daten anonymisieren (für GoBD - Rechnungen müssen 10 Jahre aufbewahrt werden)
    const { error: anonymizeError } = await supabaseAdmin.rpc('anonymize_user_data', {
      p_user_id: user.id
    })
    
    if (anonymizeError) {
      console.error('Anonymize error:', anonymizeError)
    }

    // 3. Bestätigungs-E-Mail senden
    await sendDeletionConfirmationEmail(user.email!)

    // 4. Auth User löschen
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Account konnte nicht gelöscht werden' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account wurde gelöscht' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendDeletionConfirmationEmail(email: string) {
  // SMTP E-Mail senden
  const response = await fetch('https://api.smtp-service.de/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SMTP_API_KEY')}`
    },
    body: JSON.stringify({
      from: Deno.env.get('SMTP_FROM_EMAIL'),
      to: email,
      subject: 'Dein Account wurde gelöscht - Handwerker-CRM',
      html: `
        <h2>Dein Account wurde gelöscht</h2>
        <p>Wie von dir angefordert, haben wir deinen Handwerker-CRM Account gelöscht.</p>
        <p>Falls du Fragen hast, kontaktiere uns unter support@handwerker-crm.de</p>
        <p>Wir hoffen, dich in Zukunft wieder begrüßen zu dürfen!</p>
      `
    })
  })
  
  return response.ok
}
```

### 11.3 Frontend: Account löschen Dialog

```typescript
// components/settings/DeleteAccountDialog.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (confirmation !== 'LÖSCHEN') {
      setError('Bitte gib "LÖSCHEN" ein, um fortzufahren')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ confirmation })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Löschen fehlgeschlagen')
      }

      // Logout und Redirect
      await supabase.auth.signOut()
      router.push('/?deleted=true')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 text-sm"
      >
        Account löschen
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Account löschen
            </h2>
            
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
              </p>
              <p>Folgendes wird gelöscht:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Alle deine Kundendaten</li>
                <li>Alle Angebote und Projekte</li>
                <li>Dein Profil und Einstellungen</li>
                <li>Dein Abonnement wird gekündigt</li>
              </ul>
              <p className="text-sm">
                Hinweis: Rechnungen werden aus rechtlichen Gründen anonymisiert aufbewahrt.
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gib <strong>LÖSCHEN</strong> ein, um zu bestätigen:
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="LÖSCHEN"
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirmation !== 'LÖSCHEN'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Wird gelöscht...' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## 12. Sicherheitseinstellungen

### 12.1 Supabase Auth Settings

```
- Bestätigungs-E-Mail: Aktiviert
- Passwort-Mindestlänge: 8 Zeichen
- Session Timeout: 7 Tage
- Refresh Token Rotation: Aktiviert
- JWT Expiry: 3600 (1 Stunde)
```

### 12.2 CORS & Redirect URLs

```
Site URL: https://handwerker-crm.de
Redirect URLs:
  - https://handwerker-crm.de/auth/callback
  - https://handwerker-crm.de/auth/reset-password
  - http://localhost:3000/auth/callback (Development)
  - http://localhost:3000/auth/reset-password (Development)
```

---

## 13. Checkliste OAuth & SMTP Setup

### Google
- [ ] Google Cloud Console Projekt erstellt
- [ ] OAuth 2.0 Client ID erstellt
- [ ] Redirect URI konfiguriert
- [ ] Client ID/Secret in Supabase eingetragen

### GitHub
- [ ] GitHub OAuth App erstellt
- [ ] Callback URL konfiguriert
- [ ] Client ID/Secret in Supabase eingetragen

### Apple
- [ ] Apple Developer Account (€99/Jahr)
- [ ] App ID mit Sign In with Apple erstellt
- [ ] Service ID erstellt
- [ ] Private Key generiert
- [ ] Alle Werte in Supabase eingetragen

### SMTP Server
- [ ] SMTP Host, Port, User, Password konfiguriert
- [ ] Sender E-Mail verifiziert
- [ ] SPF/DKIM/DMARC Records gesetzt
- [ ] Test-E-Mail erfolgreich gesendet
- [ ] Alle E-Mail Templates angepasst
