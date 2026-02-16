# {{APP_EMOJI}} {{APP_NAME}}

> **{{APP_TAGLINE}}**

Eine SaaS-Anwendung für {{TARGET_AUDIENCE}}. DSGVO-konform, GoBD-konform, Kleinunternehmer-fähig.

---

## 🚀 Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/your-username/{{APP_SLUG}}.git
cd {{APP_SLUG}}

# 2. Dependencies installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# → Werte in .env.local eintragen

# 4. Supabase Datenbank aufsetzen
# → Migrations in Supabase SQL Editor ausführen (siehe unten)

# 5. Development Server starten
npm run dev
```

---

## 📋 Vollständige Setup-Anleitung

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. **WICHTIG:** Wähle Region **Frankfurt (eu-central-1)** für DSGVO
4. Notiere:
   - Project URL
   - `anon` Key (öffentlich)
   - `service_role` Key (geheim!)

### 2. Datenbank-Migrations ausführen

Führe die SQL-Dateien in dieser Reihenfolge aus unter **Supabase Dashboard → SQL Editor**:

```
supabase/migrations/
├── 001_create_profiles.sql
├── 002_create_customers.sql
├── 003_create_projects.sql
├── 004_create_quotes.sql
├── 005_create_invoices.sql
├── 006_create_line_items.sql
├── 007_create_appointments.sql
├── 008_create_templates.sql
├── 009_create_audit_log.sql
├── 010_create_functions.sql
├── 011_create_triggers.sql
├── 012_create_subscriptions.sql
└── 013_019_additional_tables.sql
```

### 3. Supabase Auth konfigurieren

**Dashboard → Authentication → Providers:**
- [x] Email (aktiviert)
- [x] Google (Client ID + Secret von Google Cloud Console)
- [ ] GitHub (optional)
- [ ] Apple (optional)

**Dashboard → Authentication → URL Configuration:**
```
Site URL: http://localhost:3000
Redirect URLs: 
  - http://localhost:3000/auth/callback
  - https://{{APP_DOMAIN}}/auth/callback
```

**Dashboard → Authentication → Email Templates:**
- Nutze die fertigen Templates aus `docs/EMAIL-TEMPLATES.md`

### 4. Stripe konfigurieren

1. Erstelle einen [Stripe Account](https://stripe.com)
2. **Products → Preise erstellen** (siehe CONFIG.md für Preise)
3. **WICHTIG:** Tax Collection deaktivieren (Kleinunternehmer)
4. **Webhooks → Endpoint hinzufügen:**
   - URL: `https://{{APP_DOMAIN}}/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

### 5. Edge Functions deployen

Erstelle jede Function in **Supabase Dashboard → Edge Functions → New Function**:

| Function | Wichtigkeit |
|----------|-------------|
| `send-email` | Basis |
| `send-welcome-email` | E-Mail |
| `send-invoice-reminder` | E-Mail |
| `delete-account` | DSGVO |
| `cleanup-demo` | Cron |
| `generate-pdf` | PDF |
| `process-email-queue` | Cron |
| **`stripe-webhook`** | ⚠️ **KRITISCH** |
| **`create-checkout-session`** | ⚠️ **KRITISCH** |
| **`create-portal-session`** | ⚠️ **KRITISCH** |

---

## 📁 Projektstruktur

```
{{APP_SLUG}}/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, Register
│   ├── (dashboard)/          # Hauptanwendung
│   ├── (demo)/               # Demo-Modus
│   ├── (admin)/              # Admin-Dashboard
│   ├── (legal)/              # Impressum, Datenschutz, AGB
│   ├── api/                  # API Routes
│   └── globals.css           # Design System
├── components/               # React Komponenten
├── lib/                      # Supabase Clients, Utilities
├── types/                    # TypeScript Types
├── docs/                     # Dokumentation
└── supabase/
    ├── migrations/           # SQL Migrations
    └── functions/            # Edge Functions
```

---

## 📖 Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [CONFIG.md](CONFIG.md) | App-Konfiguration |
| [CLAUDE.md](CLAUDE.md) | Entwicklungsanweisungen |
| [docs/DATABASE.md](docs/DATABASE.md) | Datenbank-Schema |
| [docs/AUTH.md](docs/AUTH.md) | Authentifizierung |
| [docs/EMAIL-TEMPLATES.md](docs/EMAIL-TEMPLATES.md) | E-Mail-Templates |
| [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) | Design System |
| [docs/STRIPE.md](docs/STRIPE.md) | Zahlungen |
| [docs/LEGAL.md](docs/LEGAL.md) | Rechtliche Texte |
| [docs/EDGE-FUNCTIONS.md](docs/EDGE-FUNCTIONS.md) | Edge Functions |

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3.4 |
| Backend | Supabase (PostgreSQL, Frankfurt) |
| Auth | Supabase Auth + OAuth |
| Payments | Stripe (Checkout, Portal) |
| E-Mail | Eigener SMTP + Edge Functions |
| Hosting | Vercel + Supabase Cloud (EU) |

---

## 🔒 Compliance

- **DSGVO:** EU-Server (Frankfurt), Datenschutzerklärung, Löschfunktion
- **GoBD:** Unveränderbare Rechnungen, Audit-Log, 10 Jahre Archivierung
- **§19 UStG:** Kleinunternehmer-Regelung (keine MwSt.)

---

## 📄 Lizenz

Proprietär – Alle Rechte vorbehalten.

**Betreiber:**
```
{{OWNER_NAME}}
{{OWNER_STREET}}
{{OWNER_CITY}}
```
