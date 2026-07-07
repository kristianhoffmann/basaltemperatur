// lib/actions/auth.ts
// Server Actions für Authentifizierung

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { trackConversion } from '@/lib/seo-autopilot/attribution'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const SignUpSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z
    .string()
    .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.')
    .regex(/[A-Z]/, 'Das Passwort muss mindestens einen Großbuchstaben enthalten.')
    .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten.'),
  companyName: z.string().optional(),
  ownerName: z.string().min(1, 'Bitte gib deinen Namen ein.'),
  termsAccepted: z.literal('true', {
    errorMap: () => ({ message: 'Bitte akzeptiere die AGB und Datenschutzrichtlinien.' }),
  }),
  sensitiveDataConsent: z.literal('true', {
    errorMap: () => ({ message: 'Bitte willige in die Verarbeitung deiner Gesundheitsdaten ein.' }),
  }),
})

const SignInSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein.'),
})

const ResetPasswordSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
})

const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.')
    .regex(/[A-Z]/, 'Das Passwort muss mindestens einen Großbuchstaben enthalten.')
    .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten.'),
})

type AuthActionState = {
  error?: unknown
  success?: boolean
  message?: string
} | null

const SENSITIVE_DATA_CONSENT_VERSION = '2026-05-18'

// ============================================
// SIGN UP
// ============================================

export async function signUp(_prevState: AuthActionState, formData: FormData) {
  const supabase = await createClient()
  const companyNameValue = formData.get('companyName')

  const validatedFields = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    companyName: typeof companyNameValue === 'string' && companyNameValue.trim() ? companyNameValue : undefined,
    ownerName: formData.get('ownerName'),
    termsAccepted: formData.get('termsAccepted'),
    sensitiveDataConsent: formData.get('sensitiveDataConsent'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password, companyName, ownerName } = validatedFields.data

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        company_name: companyName,
        owner_name: ownerName,
        terms_accepted: true,
        sensitive_data_consent: true,
        sensitive_data_consent_version: SENSITIVE_DATA_CONSENT_VERSION,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  // SEO-Autopilot signup conversion (fire-and-forget; never blocks signup).
  if (data.user) {
    try {
      const raw = (await cookies()).get('seo_autopilot_attribution')?.value
      const attr = raw
        ? (JSON.parse(raw) as { postId?: string; slug?: string; locale?: string; keyword?: string })
        : {}
      await trackConversion({ eventName: 'signup' }, attr)
    } catch {
      // analytics must never break registration
    }
  }

  // Bei Email-Bestätigung erforderlich
  if (data.user && !data.session) {
    return {
      success: true,
      message: 'Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link geschickt.',
    }
  }

  redirect('/onboarding')
}

// ============================================
// SIGN IN
// ============================================

export async function signIn(_prevState: AuthActionState, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Ungültige E-Mail oder Passwort.' }
    }
    if (error.message === 'Email not confirmed') {
      return { error: 'Bitte bestätige zuerst deine E-Mail-Adresse.' }
    }
    return { error: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, sensitive_data_consent_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed || !profile?.sensitive_data_consent_at) {
    redirect('/onboarding')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function withdrawSensitiveDataConsent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      sensitive_data_consent_at: null,
      sensitive_data_consent_version: null,
      intended_use_acknowledged_at: null,
      onboarding_completed: false,
    })
    .eq('id', user.id)

  if (error) {
    throw new Error('Einwilligung konnte nicht widerrufen werden.')
  }

  await supabase.auth.updateUser({
    data: {
      sensitive_data_consent: false,
      sensitive_data_consent_version: null,
    },
  })

  revalidatePath('/', 'layout')
  redirect('/onboarding?consent=revoked')
}

// ============================================
// OAUTH
// ============================================

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'Google-Anmeldung fehlgeschlagen.' }
  }

  if (data.url) {
    redirect(data.url)
  }
}

// ============================================
// PASSWORD RESET
// ============================================

export async function resetPassword(_prevState: AuthActionState, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = ResetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: 'Fehler beim Zurücksetzen des Passworts.' }
  }

  return {
    success: true,
    message: 'Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen geschickt.',
  }
}

// ============================================
// UPDATE PASSWORD
// ============================================

export async function updatePassword(_prevState: AuthActionState, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = UpdatePasswordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { password } = validatedFields.data

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: 'Passwort konnte nicht aktualisiert werden.' }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=password_reset')
}

// ============================================
// DELETE ACCOUNT
// ============================================

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const confirmation = formData.get('confirmation') as string

  if (confirmation !== 'LÖSCHEN') {
    return { error: 'Bitte gib "LÖSCHEN" ein, um dein Konto zu löschen.' }
  }

  // Aktuellen User holen
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht angemeldet.' }
  }

  // Alle Benutzerdaten löschen (DSGVO-konform)
  await supabase.from('temperature_entries').delete().eq('user_id', user.id)
  await supabase.from('period_entries').delete().eq('user_id', user.id)
  await supabase.from('cycles').delete().eq('user_id', user.id)
  await adminClient.from('profiles').delete().eq('id', user.id)

  // Account über Admin-Client löschen
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return { error: 'Konto konnte nicht gelöscht werden. Bitte versuche es erneut.' }
  }

  // Logout und Redirect
  await supabase.auth.signOut()
  redirect('/?deleted=true')
}

// ============================================
// UPDATE PROFILE
// ============================================

export async function updateProfile(_prevState: AuthActionState, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()

  if (!name || name.length < 1) {
    return { error: 'Bitte gib einen Namen ein.' }
  }

  if (name.length > 100) {
    return { error: 'Der Name darf maximal 100 Zeichen lang sein.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht angemeldet.' }
  }

  // Mirror the name into both auth metadata (used by iOS) and profiles.display_name (used by web)
  const { error: authError } = await supabase.auth.updateUser({
    data: { owner_name: name },
  })

  if (authError) {
    return { error: 'Name konnte nicht aktualisiert werden.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Name konnte nicht aktualisiert werden.' }
  }

  revalidatePath('/einstellungen')
  return { success: true, message: 'Name erfolgreich aktualisiert.' }
}
