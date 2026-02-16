# 🏗️ SaaS Blueprint

> **Ein vollständiges Template für deutsche B2B SaaS-Anwendungen.**
> 
> Next.js 14 + Supabase + Stripe + Tailwind CSS
> DSGVO-konform, GoBD-konform, Kleinunternehmer-fähig

---

## 📋 Was ist enthalten?

### Dokumentation (100% fertig)
- ✅ Datenbank-Schema mit 13 SQL Migrations
- ✅ 10 Supabase Edge Functions (E-Mail, PDF, Stripe, Cron)
- ✅ 6 E-Mail-Templates für Supabase Auth
- ✅ Rechtliche Seiten (Impressum, Datenschutz, AGB)
- ✅ Design System (Farben, Komponenten, Spacing)
- ✅ API-Referenz mit Supabase Queries
- ✅ Stripe-Integration (Checkout, Portal, Webhooks)
- ✅ Admin-Dashboard Spezifikation
- ✅ Demo-Modus Spezifikation

### Konfiguration (100% fertig)
- ✅ package.json mit allen Dependencies
- ✅ TypeScript Konfiguration
- ✅ Tailwind CSS Konfiguration
- ✅ Next.js Konfiguration
- ✅ Environment Variables Template
- ✅ Global CSS mit Design System

### Was du noch brauchst
- ❌ React-Komponenten (werden generiert)
- ❌ Seiten/Routes (werden generiert)
- ❌ API-Routes (werden generiert)

---

## 🚀 So verwendest du das Blueprint

### Schritt 1: Konfiguration ausfüllen

Öffne `CONFIG.md` und fülle alle Werte aus:
- App-Name und Domain
- Betreiber-Daten (Impressum)
- Farben und Design
- Preise und Pläne
- Features und Module

### Schritt 2: Generator-Prompt verwenden

Kopiere den **kompletten Prompt** unten und gib ihn an Claude (mit Dateizugriff).

### Schritt 3: App bauen lassen

Claude liest die Blueprint-Dateien und generiert:
- Alle React-Komponenten
- Alle Seiten
- Alle API-Routes
- Angepasste SQL-Migrations
- Angepasste Edge Functions

---

## 🤖 Generator-Prompt

> **Kopiere alles zwischen den Linien und gib es an Claude:**

---

```
Ich möchte eine SaaS-App bauen. Bitte lies zuerst das Blueprint in diesem Verzeichnis:

1. Lies `CONFIG.md` für meine App-Konfiguration
2. Lies `CLAUDE.md` für Entwicklungsanweisungen
3. Lies die Dokumentation in `docs/`
4. Nutze die SQL-Migrations in `supabase/migrations/`
5. Nutze die Edge Functions in `supabase/functions/`

**Meine App-Konfiguration:**

[HIER CONFIG.md EINFÜGEN ODER FOLGENDES AUSFÜLLEN]

APP_NAME: "..."
APP_SLUG: "..."
APP_DOMAIN: "..."
APP_TAGLINE: "..."
TARGET_AUDIENCE: "..."

OWNER_NAME: "..."
OWNER_STREET: "..."
OWNER_CITY: "..."
OWNER_EMAIL: "..."

PRIMARY_COLOR: "#..."
ACCENT_COLOR: "#..."

PLANS:
- Starter: kostenlos, max 10 Kunden
- Pro: 29€/Monat, unbegrenzt
- Business: 59€/Monat, Team-Features

**Bitte baue die App Schritt für Schritt:**

1. Passe alle Platzhalter in den Dateien an meine Konfiguration an
2. Erstelle die Supabase-Client Utilities (lib/supabase/)
3. Erstelle die UI-Komponenten (components/ui/)
4. Erstelle die Auth-Seiten (Login, Register, Callback)
5. Erstelle das Dashboard-Layout
6. Erstelle die Feature-Seiten (Kunden, Projekte, etc.)
7. Erstelle die Einstellungen-Seiten
8. Erstelle die rechtlichen Seiten
9. Erstelle die Demo-Modus Seiten
10. Teste alles auf Vollständigkeit

Beginne mit Schritt 1 und frage mich, wenn du Entscheidungen brauchst.
```

---

## 📁 Verzeichnisstruktur

```
saas-blueprint/
├── BLUEPRINT.md              # Diese Datei
├── CONFIG.md                 # ⚙️ DEINE KONFIGURATION
├── CLAUDE.md                 # Anweisungen für Claude
├── README.md                 # Setup-Anleitung
├── PRD.md                    # Produktanforderungen (Template)
│
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript
├── tailwind.config.ts        # Tailwind CSS
├── next.config.js            # Next.js
├── .env.example              # Environment Variables
│
├── app/
│   └── globals.css           # Design System
│
├── types/
│   └── database.ts           # Supabase Types (Template)
│
├── docs/
│   ├── DATABASE.md           # Datenbank-Schema
│   ├── AUTH.md               # Authentifizierung
│   ├── EMAIL-TEMPLATES.md    # E-Mail-Templates
│   ├── UI-GUIDELINES.md      # Design System
│   ├── LEGAL.md              # Rechtliche Texte
│   ├── API.md                # API Referenz
│   ├── STRIPE.md             # Zahlungen
│   ├── ADMIN.md              # Admin-Dashboard
│   ├── DEMO.md               # Demo-Modus
│   └── EDGE-FUNCTIONS.md     # Edge Functions
│
└── supabase/
    ├── migrations/           # 13 SQL-Dateien
    │   ├── 001_create_profiles.sql
    │   ├── 002_create_customers.sql
    │   ├── ...
    │   └── 013_019_additional_tables.sql
    │
    └── functions/            # 10 Edge Functions
        ├── send-email/
        ├── send-welcome-email/
        ├── send-invoice-reminder/
        ├── delete-account/
        ├── cleanup-demo/
        ├── generate-pdf/
        ├── process-email-queue/
        ├── stripe-webhook/
        ├── create-checkout-session/
        └── create-portal-session/
```

---

## 🔧 Platzhalter-Referenz

Diese Platzhalter werden in den Template-Dateien verwendet:

| Platzhalter | Beispiel | Verwendung |
|-------------|----------|------------|
| `{{APP_NAME}}` | Handwerker-CRM | Überall |
| `{{APP_SLUG}}` | handwerker-crm | URLs, Dateinamen |
| `{{APP_DOMAIN}}` | handwerker-crm.de | Links, E-Mails |
| `{{APP_TAGLINE}}` | Vom Anruf zur Rechnung | Header, Meta |
| `{{PRIMARY_COLOR}}` | #1b4d89 | CSS, E-Mails |
| `{{ACCENT_COLOR}}` | #f9e45b | CSS, E-Mails |
| `{{OWNER_NAME}}` | Max Mustermann | Impressum |
| `{{OWNER_EMAIL}}` | info@app.de | Kontakt |

---

## ✅ Checkliste nach Generierung

### Supabase Setup
- [ ] Projekt in Frankfurt (eu-central-1) erstellt
- [ ] Alle 13 Migrations ausgeführt
- [ ] Auth Providers aktiviert (Email, Google)
- [ ] E-Mail-Templates eingefügt
- [ ] SMTP konfiguriert
- [ ] Alle 10 Edge Functions deployt
- [ ] Edge Function Secrets gesetzt

### Stripe Setup
- [ ] Products & Prices erstellt
- [ ] Price IDs in Secrets gespeichert
- [ ] Webhook Endpoint erstellt
- [ ] Webhook Secret gespeichert
- [ ] Customer Portal aktiviert

### Vercel Setup
- [ ] Projekt deployt
- [ ] Environment Variables gesetzt
- [ ] Domain konfiguriert

---

## 📚 Beispiel: Handwerker-CRM

Das Blueprint wurde ursprünglich für das Handwerker-CRM entwickelt:

```yaml
APP_NAME: "Handwerker-CRM"
APP_SLUG: "handwerker-crm"
APP_TAGLINE: "Vom Anruf zur Rechnung in 3 Klicks"
TARGET_AUDIENCE: "Kleinsthandwerker (1-9 Mitarbeiter)"

MODULES:
  customers: true     # Kundenverwaltung
  projects: true      # Aufträge
  quotes: true        # Angebote mit PDF
  invoices: true      # Rechnungen (GoBD)
  calendar: true      # Terminplanung
  templates: true     # Leistungsvorlagen

PLANS:
  - Starter: 0€ (10 Kunden)
  - Handwerker: 29€ (unbegrenzt)
  - Meister: 59€ (Team)
```

---

## 🛠️ Tech Stack

| Bereich | Technologie | Warum? |
|---------|-------------|--------|
| Frontend | Next.js 14 | App Router, Server Components |
| Styling | Tailwind CSS | Schnell, konsistent |
| Backend | Supabase | PostgreSQL, Auth, Storage |
| Auth | Supabase Auth | OAuth, Magic Links |
| Payments | Stripe | Checkout, Portal, Webhooks |
| E-Mail | SMTP via Edge Functions | Volle Kontrolle |
| Hosting | Vercel | Optimiert für Next.js |
| Region | Frankfurt (EU) | DSGVO-konform |

---

## 📄 Lizenz

Dieses Blueprint ist frei verwendbar für eigene Projekte.

---

## 🆘 Support

Bei Fragen zum Blueprint:
1. Lies zuerst die Dokumentation in `docs/`
2. Prüfe die Beispiel-Konfiguration
3. Frag Claude mit Kontext aus diesem Verzeichnis
