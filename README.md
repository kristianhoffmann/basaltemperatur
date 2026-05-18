# Basaltemperatur

Web- und iOS-App für Basaltemperatur-Tracking, Periodenmarkierung und Zyklusanalyse.

## Funktionsumfang

- Kostenlos: Temperatur mit Messqualität eintragen, Periodentage markieren, Kalender nutzen
- Premium (einmalig 9,99 €): Prognosen, Statistiken, Zyklusvergleich, PDF-Export
- Rechtliche Seiten: Impressum, Datenschutz, AGB, Widerruf
- Stripe Checkout, StoreKit 2 und serverseitige Entitlements für Lifetime-Zugang

## Tech-Stack

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Auth + Postgres)
- Stripe Checkout + Apple StoreKit 2
- iOS App in SwiftUI (`ios/Basaltemperatur`)

## Lokales Setup (Web)

1. Abhängigkeiten installieren:

```bash
npm install
```

2. `.env.local` anlegen (siehe `.env.production.example` als Vorlage, ohne Live-Secrets committen)

3. Supabase Migrationen ausführen (im SQL Editor, in dieser Reihenfolge):

- `supabase/migrations/001_create_profiles.sql`
- `supabase/migrations/002_create_temperature_entries.sql`
- `supabase/migrations/003_create_period_entries.sql`
- `supabase/migrations/004_create_cycles.sql`
- `supabase/migrations/20260214_fix_rls.sql`
- `supabase/migrations/20260214170534_add_cervical_mucus.sql`
- `supabase/migrations/20260518090000_add_measurement_quality_and_entitlements.sql`

4. Dev-Server starten:

```bash
npm run dev
```

5. Qualitätschecks:

```bash
npm run lint
npm run test
npm run build
```

## Benötigte Umgebungsvariablen (Web)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional für zukünftige Flows)
- `APP_STORE_BUNDLE_ID` (Standard: `de.basaltemperatur.app`)
- `APP_STORE_LIFETIME_PRODUCT_ID` (Standard: `de.basaltemperatur.lifetime`)

Rechtliche Seiten (Pflichtangaben):

- `NEXT_PUBLIC_COMPANY_NAME`
- `NEXT_PUBLIC_COMPANY_STREET`
- `NEXT_PUBLIC_COMPANY_CITY`
- `NEXT_PUBLIC_COMPANY_COUNTRY`
- `NEXT_PUBLIC_COMPANY_EMAIL`
- `NEXT_PUBLIC_COMPANY_PHONE` (optional)

Infrastrukturangaben:

- `NEXT_PUBLIC_WEB_HOSTING_PROVIDER`
- `NEXT_PUBLIC_WEB_HOSTING_LOCATION`
- `NEXT_PUBLIC_DB_PROVIDER`
- `NEXT_PUBLIC_DB_LOCATION`

Optional:

- `NEXT_PUBLIC_APP_STORE_URL` (Landingpage-Link „App Store (bald)“)

## Stripe Integration

- Checkout-Route: `POST /api/checkout`
- Webhook-Route: `POST /api/stripe-webhook`
- Relevantes Event: `checkout.session.completed`
- Nach erfolgreicher Zahlung wird `profiles.has_lifetime_access = true` gesetzt
- Die Entitlement-Felder in `profiles` dürfen clientseitig nicht verändert werden.

Wichtig:

- Im Live-Betrieb muss `NEXT_PUBLIC_APP_URL` eine öffentliche HTTPS-Domain sein.
- Für den Webhook muss exakt dieselbe Route in Stripe hinterlegt sein.

## Deployment (Plesk / Node.js)

- Startup-Datei: `app.js`
- Build/Start:

```bash
npm install
npm run build
npm run start
```

- Application Root und Document Root in Plesk korrekt setzen (Document Root muss unterhalb Application Root liegen).

## iOS App

Projekt liegt unter `ios/Basaltemperatur`.

- Tabs: Dashboard, Kalender, Anleitung, Eintrag, Mehr
- Kalender zeigt auch prognostizierte Periodentage (bei Lifetime)
- Einträge enthalten Messzeit, Schlafdauer, Störfaktoren, Ausschluss aus der Auswertung und Zervixschleim
- Profil zeigt `Lifetime` Badge bei freigeschaltetem Zugang
- App-Store-kompatibler Standard: StoreKit 2 Non-Consumable (`de.basaltemperatur.lifetime`) und kein externer Kauf-Link in Release-Builds

iOS-Konfiguration:

- Bundle ID: `de.basaltemperatur.app`
- In-App-Kauf: Non-Consumable `de.basaltemperatur.lifetime`
- StoreKit-Käufe werden über `POST /api/app-store/entitlement` serverseitig geprüft und dem eingeloggten Konto zugeordnet.

Build lokal (Beispiel):

```bash
xcodebuild -project ios/Basaltemperatur.xcodeproj -scheme Basaltemperatur -configuration Debug -destination 'generic/platform=iOS' build
```

## CI

GitHub Actions Pipeline unter `.github/workflows/ci.yml`:

- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

## Hinweise

- Temperaturanstiege werden rückblickend ausgewertet; Fruchtbarkeitsfenster und zukünftige Ereignisse sind statistische Prognosen und keine medizinische Diagnose.
- Live-Secrets niemals in Git committen.
