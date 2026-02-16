// lib/actions/auth.ts
// Server Actions für Authentifizierung

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

// ============================================
// SIGN UP
// ============================================

export async function signUp(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    companyName: formData.get('companyName'),
    ownerName: formData.get('ownerName'),
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
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  // Bei Email-Bestätigung erforderlich
  if (data.user && !data.session) {
    return {
      success: true,
      message: 'Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link geschickt.',
    }
  }

  redirect('/dashboard')
}

// ============================================
// SIGN IN
// ============================================

export async function signIn(prevState: any, formData: FormData) {
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

export async function resetPassword(prevState: any, formData: FormData) {
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

export async function updatePassword(prevState: any, formData: FormData) {
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

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()

  if (!name || name.length < 1) {
    return { error: 'Bitte gib einen Namen ein.' }
  }

  if (name.length > 100) {
    return { error: 'Der Name darf maximal 100 Zeichen lang sein.' }
  }

  const { error } = await supabase.auth.updateUser({
    data: { owner_name: name },
  })

  if (error) {
    return { error: 'Name konnte nicht aktualisiert werden.' }
  }

  revalidatePath('/einstellungen')
  return { success: true, message: 'Name erfolgreich aktualisiert.' }
}

