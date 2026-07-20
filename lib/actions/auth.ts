// lib/actions/auth.ts
// Server Actions für Authentifizierung

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { trackConversion } from '@/lib/seo-autopilot/attribution'
import { planAccountDeletion } from '@/lib/account-deletion'
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

type StripeErrorLike = { statusCode?: number; code?: string }

/** Nicht mehr kündbare Zustände — hier gibt es nichts zu tun. */
const SETTLED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'incomplete_expired'])

/**
 * Sucht offene Abos zur E-Mail des Kontos.
 *
 * Basaltemperatur hat keine `stripe_customer_id` am Profil, weil der Kauf
 * einmalig ist (Checkout mode: 'payment'). Die Suche läuft deshalb über die
 * Kunden-E-Mail. Ist Stripe nicht konfiguriert oder existiert kein Kunde,
 * ist das Ergebnis schlicht leer — das ist der Normalfall, kein Fehler.
 */
async function findActiveSubscriptionIds(email: string): Promise<string[]> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return []

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

  const customers = await stripe.customers.list({ email, limit: 100 })
  if (customers.data.length === 0) return []

  const ids: string[] = []
  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100,
    })

    for (const subscription of subscriptions.data) {
      if (!SETTLED_SUBSCRIPTION_STATUSES.has(subscription.status)) {
        ids.push(subscription.id)
      }
    }
  }

  return ids
}

/**
 * Kündigt ein Abo. Bereits gekündigte oder nicht mehr existierende Abos
 * gelten als erledigt; jeder andere Fehler wird geworfen, damit der Aufrufer
 * abbrechen kann.
 */
async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

  try {
    await stripe.subscriptions.cancel(subscriptionId)
  } catch (err) {
    const stripeErr = err as StripeErrorLike
    if (stripeErr?.statusCode === 404 || stripeErr?.code === 'resource_missing') {
      return
    }
    throw err
  }
}

/**
 * Selbstbedienungs-Löschung des eigenen Kontos (DSGVO Art. 17).
 *
 * Ablauf (Reihenfolge ist sicherheitsrelevant):
 *   1. Reauthentifizierung mit dem aktuellen Passwort gegen einen
 *      Wegwerf-Client (persistSession: false) — ein Fehlversuch darf die
 *      laufende Session nicht anfassen.
 *   2. Zweite Bestätigung: der Nutzer tippt seine eigene E-Mail, der Server
 *      prüft die Übereinstimmung erneut (die Client-Prüfung ist nur Komfort).
 *   3. Etwaige Stripe-Abos kündigen — VOR jeder Datenlöschung. Scheitert
 *      das, bricht die Aktion ab und das Konto bleibt vollständig erhalten.
 *      Basaltemperatur verkauft einen einmaligen Lifetime-Kauf, im Regelfall
 *      gibt es also gar kein Abo — das ist kein Fehler, sondern der Normalfall.
 *   4. Daten löschen, Auth-User ZULETZT.
 */
export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'Nicht angemeldet.' }
  }

  const password = (formData.get('password') as string) || ''
  const confirmEmail = (formData.get('confirmEmail') as string) || ''

  if (!password) {
    return { error: 'Bitte gib dein Passwort ein.' }
  }

  // ─── 1. Reauthentifizierung über einen Wegwerf-Client ────────────
  // Eigener Client mit Anon-Key und persistSession: false — ein
  // fehlgeschlagener Versuch schreibt keine Cookies und kann die
  // bestehende Session nicht beschädigen.
  const throwawayClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  const { error: reauthError } = await throwawayClient.auth.signInWithPassword({
    email: user.email,
    password,
  })
  // Die Wegwerf-Session sofort wieder entwerten — sie hat ihren Zweck erfüllt.
  await throwawayClient.auth.signOut().catch(() => { })

  // ─── 2. Abos suchen und Plan erstellen ───────────────────────────
  // Erst nach bestandener Reauthentifizierung nach Stripe greifen, damit
  // ein Fremder nicht per Fehlversuch Kontodaten abfragen kann.
  let activeSubscriptionIds: string[] = []

  if (!reauthError) {
    try {
      activeSubscriptionIds = await findActiveSubscriptionIds(user.email)
    } catch (err) {
      console.error('[deleteAccount] Stripe-Abfrage fehlgeschlagen:', err)
      return {
        error:
          'Dein Zahlungsstatus konnte nicht geprüft werden. Dein Konto wurde deshalb NICHT ' +
          'gelöscht. Bitte versuche es später erneut.',
      }
    }
  }

  const plan = planAccountDeletion({
    sessionEmail: user.email,
    typedEmail: confirmEmail,
    passwordVerified: !reauthError,
    activeSubscriptionIds,
  })

  if (!plan.ok) {
    return { error: plan.error }
  }

  // ─── 3. Stripe zuerst — Abbruch lässt das Konto unangetastet ─────
  for (const step of plan.steps) {
    if (step.kind !== 'cancel-subscription') continue

    try {
      await cancelSubscription(step.subscriptionId)
    } catch (err) {
      console.error('[deleteAccount] Kündigung fehlgeschlagen:', err)
      return {
        error:
          'Dein Abo konnte nicht gekündigt werden. Dein Konto wurde deshalb NICHT gelöscht. ' +
          'Bitte versuche es später erneut oder kontaktiere den Support.',
      }
    }
  }

  // ─── 4. Daten löschen, Auth-User zuletzt ─────────────────────────
  const adminClient = createAdminClient()

  for (const step of plan.steps) {
    if (step.kind === 'delete-table') {
      const { error } = await adminClient
        .from(step.table)
        .delete()
        .eq(step.idColumn, user.id)

      if (error) {
        console.error(`[deleteAccount] Löschen von ${step.table} fehlgeschlagen:`, error.message)
      }
      continue
    }

    if (step.kind === 'delete-auth-user') {
      const { error } = await adminClient.auth.admin.deleteUser(user.id)

      if (error) {
        return { error: 'Konto konnte nicht gelöscht werden. Bitte versuche es erneut.' }
      }
    }
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
