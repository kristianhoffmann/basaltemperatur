# Authentifizierung

Basaltemperatur nutzt Supabase Auth fuer Web und iOS.

## Login-Methoden

- Web: E-Mail/Passwort, Passwort-Reset und Google OAuth
- iOS: E-Mail/Passwort und Registrierung ueber Supabase Auth REST-Endpunkte
- Sessions werden serverseitig ueber `@supabase/ssr` Cookies und in iOS im Keychain gespeichert.

## Relevante Dateien

- Web Supabase Server Client: `lib/supabase/server.ts`
- Web Supabase Browser Client: `lib/supabase/client.ts`
- Auth Server Actions: `lib/actions/auth.ts`
- Route-Gating: `proxy.ts`
- OAuth/Recovery Callback: `app/(auth)/auth/callback/route.ts`
- iOS Supabase Service: `ios/Basaltemperatur/Services/SupabaseService.swift`

## Registrierung und Consent

Bei der Registrierung muss die Verarbeitung sensibler Zyklusdaten bestaetigt werden.
Die aktuelle Consent-Version ist `2026-05-18`.

Web setzt die Consent-Metadaten in `signUp()`:

- `terms_accepted`
- `sensitive_data_consent`
- `sensitive_data_consent_version`

iOS setzt dieselben Consent-Metadaten im Signup-Request, wenn der Consent im UI bestaetigt wurde.

Die Migration `20260518100000_add_sensitive_data_consent.sql` spiegelt den Consent in `profiles` und blockiert Temperatur- und Periodenwrites, solange `sensitive_data_consent_at` fehlt.

## Route-Gating

`proxy.ts` schuetzt die Dashboard-Routen:

- `/dashboard`
- `/kalender`
- `/einstellungen`
- `/statistiken`
- `/zyklen`
- `/export`
- `/eintrag`
- `/onboarding`
- `/erfolg`
- `/anleitung`

Nicht eingeloggte Nutzer werden zu `/login` umgeleitet. Eingeloggte Nutzer ohne abgeschlossenes Onboarding oder ohne Sensitive-Data-Consent werden nach `/onboarding` geleitet.

## Account-Loeschung

Web nutzt die Server Action `deleteAccount()` in `lib/actions/auth.ts`.
iOS nutzt `DELETE /api/delete-account` mit Bearer Token.

Beide Pfade loeschen:

- `temperature_entries`
- `period_entries`
- `cycles`
- `profiles`
- Supabase Auth User

## Admin-Zugriff

Admin-Zugriff ist derzeit eine konfigurierte E-Mail-Pruefung:

- `lib/adminAccess.ts`
- `lib/admin.ts`
- `app/admin/*`

Admin-Routen werden in `proxy.ts` und serverseitig in `requireAdmin()` abgesichert.

## Wichtige Env-Variablen

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

`SUPABASE_SERVICE_ROLE_KEY` darf nie im Browser oder in iOS ausgeliefert werden.
