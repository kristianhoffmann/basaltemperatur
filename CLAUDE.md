# CLAUDE.md – Anweisungen für die App-Entwicklung

> **Diese Datei erklärt Claude, wie die App aufgebaut werden soll.**
> 
> Lies zuerst `CONFIG.md` für die App-spezifische Konfiguration!

---

## 🎯 Projekt-Übersicht

**App:** `{{APP_NAME}}`  
**Domain:** `{{APP_DOMAIN}}`  
**Tagline:** `{{APP_TAGLINE}}`  
**Zielgruppe:** `{{TARGET_AUDIENCE}}`

### Tech Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4 |
| Backend | Supabase (PostgreSQL, Frankfurt) |
| Auth | Supabase Auth (Email + OAuth) |
| Payments | Stripe (Checkout, Portal, Webhooks) |
| E-Mail | Eigener SMTP über Edge Functions |
| Hosting | Vercel (EU) |

---

## 📁 Projektstruktur

```
{{APP_SLUG}}/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-Seiten (kein Sidebar)
│   │   ├── login/
│   │   ├── registrieren/
│   │   └── auth/callback/
│   ├── (dashboard)/              # Hauptapp mit Sidebar
│   │   ├── layout.tsx            # Dashboard Layout
│   │   ├── page.tsx              # Dashboard Home
│   │   ├── kunden/
│   │   ├── projekte/
│   │   ├── angebote/
│   │   ├── rechnungen/
│   │   ├── kalender/
│   │   └── einstellungen/
│   ├── (demo)/                   # Demo-Modus (ohne Auth)
│   │   └── demo/
│   ├── (admin)/                  # Admin-Dashboard
│   │   └── admin/
│   ├── (legal)/                  # Rechtliche Seiten
│   │   ├── impressum/
│   │   ├── datenschutz/
│   │   └── agb/
│   ├── api/                      # API Routes
│   │   └── webhooks/stripe/
│   ├── layout.tsx                # Root Layout
│   └── globals.css               # Tailwind + Custom Styles
│
├── components/
│   ├── ui/                       # Basis-Komponenten
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── forms/                    # Formular-Komponenten
│   │   ├── CustomerForm.tsx
│   │   ├── QuoteForm.tsx
│   │   └── ...
│   └── features/                 # Feature-spezifisch
│       ├── DashboardStats.tsx
│       ├── CustomerList.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Client
│   │   ├── server.ts             # Server Client
│   │   └── middleware.ts         # Auth Middleware
│   ├── stripe.ts                 # Stripe Utilities
│   └── utils.ts                  # Hilfsfunktionen
│
├── types/
│   └── database.ts               # Supabase Types
│
├── contexts/
│   └── DemoContext.tsx           # Demo-Modus Context
│
├── hooks/
│   ├── useSubscription.ts
│   └── useUser.ts
│
└── supabase/
    ├── migrations/               # 13 SQL Migrations
    └── functions/                # 10 Edge Functions
```

---

## 🎨 Design-Prinzipien

### Farben (aus CONFIG.md)

```css
:root {
  --primary: {{PRIMARY_COLOR}};
  --accent: {{ACCENT_COLOR}};
  --success: {{SUCCESS_COLOR}};
  --error: {{ERROR_COLOR}};
  --warning: {{WARNING_COLOR}};
  --background: {{BACKGROUND_COLOR}};
}
```

### Komponenten-Stil

- **Buttons:** Abgerundet (rounded-xl), deutliche Hover-States
- **Cards:** Weiche Schatten, abgerundete Ecken
- **Inputs:** Klare Fokus-States, Validierungsfarben
- **Spacing:** Großzügig (p-4, gap-4 minimum)
- **Mobile First:** Responsive ab 320px

### Zielgruppe beachten

Die App richtet sich an `{{TARGET_AUDIENCE}}`. Das bedeutet:
- **Einfachheit** vor Features
- **Große Touch-Targets** (min 44px)
- **Klare Sprache** (kein Fachjargon)
- **Schnelle Ladezeiten** (auch mit 3G)

---

## 🗄️ Datenbank-Konventionen

### Tabellennamen
- Plural, snake_case: `customers`, `line_items`
- Alle Tabellen haben: `id`, `created_at`, `updated_at`
- User-Daten haben: `user_id` (Foreign Key zu auth.users)

### Row Level Security (RLS)
**JEDE Tabelle** mit User-Daten braucht RLS:
```sql
ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own data"
ON tablename FOR ALL
USING (auth.uid() = user_id);
```

### Soft Delete
Für wichtige Entitäten (Kunden, Rechnungen):
```sql
deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
```

---

## 🔐 Auth-Flow

### Registrierung
1. User füllt Formular aus (Email + Passwort)
2. Supabase sendet Bestätigungs-E-Mail
3. User klickt Link → `/auth/callback`
4. Weiterleitung zu `/onboarding`
5. Profil vervollständigen
6. Weiterleitung zu `/dashboard`

### Login
1. Email + Passwort ODER OAuth
2. Bei Erfolg → Dashboard
3. Bei Fehler → Fehlermeldung

### Demo-Modus
1. User klickt "Demo starten"
2. Session-Token in Cookie (30 Tage)
3. Beispieldaten werden generiert
4. Voller Zugriff ohne Account
5. "Jetzt registrieren" Banner sichtbar

---

## 💳 Stripe-Integration

### Checkout-Flow
1. User wählt Plan
2. `create-checkout-session` Edge Function
3. Redirect zu Stripe Checkout
4. Webhook empfängt `checkout.session.completed`
5. Subscription in DB speichern

### Wichtige Edge Functions
- `stripe-webhook` – MUSS zuerst deployt werden!
- `create-checkout-session` – Für Upgrades
- `create-portal-session` – Für Abo-Verwaltung

---

## ⚠️ Wichtige Hinweise

### Edge Functions deployen!

**VOR dem ersten Test müssen ALLE Edge Functions in Supabase deployt sein:**

```
✅ send-email
✅ send-welcome-email
✅ send-invoice-reminder
✅ delete-account
✅ cleanup-demo
✅ generate-pdf
✅ process-email-queue
✅ stripe-webhook          ← KRITISCH
✅ create-checkout-session ← KRITISCH
✅ create-portal-session   ← KRITISCH
```

### Secrets nicht vergessen!

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
SMTP_FROM_EMAIL, SMTP_FROM_NAME
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_*_MONTHLY, STRIPE_PRICE_*_YEARLY
APP_URL
```

### GoBD-Compliance (Rechnungen)

- Rechnungen sind nach Versand **unveränderbar**
- Jede Änderung wird im `audit_log` protokolliert
- Rechnungsnummern sind **fortlaufend**
- 10 Jahre Aufbewahrungspflicht

### Kleinunternehmer (§19 UStG)

Wenn `is_small_business = true`:
- Keine MwSt. auf Rechnungen
- Hinweis: "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
- Stripe: Tax Collection deaktiviert

---

## 📖 Dokumentation

| Datei | Inhalt |
|-------|--------|
| `CONFIG.md` | App-Konfiguration (ZUERST LESEN!) |
| `BLUEPRINT.md` | Übersicht & Generator-Prompt |
| `docs/DATABASE.md` | Datenbank-Schema, Migrations |
| `docs/AUTH.md` | Authentifizierung, SMTP |
| `docs/EMAIL-TEMPLATES.md` | E-Mail-Templates für Supabase |
| `docs/UI-GUIDELINES.md` | Design System |
| `docs/LEGAL.md` | Rechtliche Texte |
| `docs/API.md` | Supabase Queries |
| `docs/STRIPE.md` | Zahlungen & Webhooks |
| `docs/ADMIN.md` | Admin-Dashboard |
| `docs/DEMO.md` | Demo-Modus |
| `docs/EDGE-FUNCTIONS.md` | Alle 10 Edge Functions |

---

## 🛠️ Entwicklungs-Workflow

### Bei jeder neuen Feature-Seite:

1. **Route anlegen** in `app/(dashboard)/feature/page.tsx`
2. **Komponenten** in `components/features/`
3. **Types** erweitern wenn nötig
4. **RLS Policy** prüfen für neue Tabellen
5. **Navigation** in Sidebar ergänzen

### Code-Stil

- **TypeScript** überall (kein `any`)
- **Server Components** als Default
- **Client Components** nur wenn nötig (`'use client'`)
- **Async/Await** statt Promises
- **Error Boundaries** für kritische Bereiche

### Testing-Priorität

1. Auth-Flow (Login, Logout, Register)
2. Stripe-Flow (Checkout, Portal)
3. CRUD-Operationen (Kunden, Rechnungen)
4. PDF-Export
5. E-Mail-Versand
