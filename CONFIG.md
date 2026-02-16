# 🎯 SaaS Blueprint - Konfiguration

> **Diese Datei definiert alle Variablen für deine App.**
> 
> Fülle diese Werte aus und gib sie zusammen mit dem Generator-Prompt an Claude.

---

## App-Identität

```yaml
APP_NAME: "Meine App"                    # Name der App
APP_SLUG: "meine-app"                    # URL-freundlich (klein, keine Leerzeichen)
APP_DOMAIN: "meine-app.de"               # Domain
APP_TAGLINE: "Der Slogan deiner App"     # Kurzer Slogan
APP_DESCRIPTION: |
  Eine ausführlichere Beschreibung deiner App.
  Was macht sie? Welches Problem löst sie?
APP_EMOJI: "🚀"                          # Ein Emoji für die App
```

---

## Zielgruppe & Business

```yaml
TARGET_AUDIENCE: "Freelancer und kleine Unternehmen"
TARGET_AUDIENCE_SIZE: "1-10 Mitarbeiter"
INDUSTRY: "Allgemein"                    # z.B. Handwerk, Gastronomie, Fitness
PROBLEM_SOLVED: |
  Beschreibe das Problem, das deine App löst.
  
MAIN_BENEFIT: "Zeit sparen und Überblick behalten"
```

---

## Betreiber (Impressum)

```yaml
OWNER_NAME: "Max Mustermann"
OWNER_COMPANY: "Mustermann GmbH"         # Optional, leer lassen wenn Einzelunternehmer
OWNER_STREET: "Musterstraße 1"
OWNER_CITY: "12345 Musterstadt"
OWNER_COUNTRY: "Deutschland"
OWNER_EMAIL: "info@meine-app.de"
OWNER_PHONE: "+49 123 456789"            # Optional
OWNER_VAT_ID: "DE123456789"              # Optional, Umsatzsteuer-ID
```

---

## Design

```yaml
PRIMARY_COLOR: "#1b4d89"                 # Hauptfarbe (Buttons, Links)
PRIMARY_COLOR_LIGHT: "#2a5a9a"           # Hellere Variante
ACCENT_COLOR: "#f9e45b"                  # Akzentfarbe (CTAs)
SUCCESS_COLOR: "#6db784"                 # Erfolg/Bestätigung
ERROR_COLOR: "#dc2626"                   # Fehler
WARNING_COLOR: "#f59e0b"                 # Warnung
BACKGROUND_COLOR: "#e8f5f2"              # Hintergrund (hell, freundlich)
BACKGROUND_DARK: "#f9fafb"               # Footer, Cards

# Fonts (Google Fonts empfohlen)
FONT_HEADINGS: "Plus Jakarta Sans"
FONT_BODY: "DM Sans"
FONT_MONO: "JetBrains Mono"
```

---

## Preise & Pläne

```yaml
CURRENCY: "EUR"
CURRENCY_SYMBOL: "€"

PLANS:
  - name: "Starter"
    slug: "starter"
    price_monthly: 0
    price_yearly: 0
    description: "Kostenlos für immer"
    features:
      - "Bis zu 10 Kunden"
      - "Basis-Funktionen"
    limits:
      customers: 10
      projects: 5
      
  - name: "Pro"
    slug: "pro"
    price_monthly: 29
    price_yearly: 290
    description: "Für wachsende Unternehmen"
    features:
      - "Unbegrenzte Kunden"
      - "PDF-Export"
      - "E-Mail-Versand"
    limits:
      customers: -1  # unlimited
      projects: -1
      
  - name: "Business"
    slug: "business"
    price_monthly: 59
    price_yearly: 590
    description: "Alle Funktionen"
    features:
      - "Alles aus Pro"
      - "Team-Funktionen"
      - "Prioritäts-Support"
    limits:
      customers: -1
      projects: -1
      team_members: 5

# Trial
TRIAL_DAYS: 14
```

---

## Features & Module

```yaml
# Aktiviere/Deaktiviere Module
MODULES:
  customers: true          # Kundenverwaltung
  projects: true           # Projektverwaltung
  quotes: true             # Angebote
  invoices: true           # Rechnungen
  calendar: true           # Kalender/Termine
  templates: true          # Vorlagen
  demo_mode: true          # Demo ohne Registrierung
  admin_dashboard: true    # Admin-Bereich
  
# Rechtliche Anforderungen
COMPLIANCE:
  gdpr: true               # DSGVO (EU)
  gobd: true               # GoBD (Deutschland, für Rechnungen)
  small_business: true     # Kleinunternehmer-Regelung §19 UStG
```

---

## Entitäten (Datenmodell)

> Passe diese an deine App an. Die Standard-Entitäten decken typische B2B SaaS ab.

```yaml
ENTITIES:
  # Hauptentität (z.B. Kunden, Mitglieder, Kontakte)
  - name: "customers"
    singular: "Kunde"
    plural: "Kunden"
    icon: "Users"
    fields:
      - name, email, phone, company_name
      - street, postal_code, city
      - notes, tags
      
  # Sekundäre Entitäten
  - name: "projects"
    singular: "Projekt"
    plural: "Projekte"
    icon: "Folder"
    parent: "customers"    # Gehört zu Kunden
    
  - name: "quotes"
    singular: "Angebot"
    plural: "Angebote"
    icon: "FileText"
    parent: "customers"
    has_line_items: true
    has_pdf: true
    
  - name: "invoices"
    singular: "Rechnung"
    plural: "Rechnungen"
    icon: "Receipt"
    parent: "customers"
    has_line_items: true
    has_pdf: true
    requires_audit_log: true  # GoBD
    
  - name: "appointments"
    singular: "Termin"
    plural: "Termine"
    icon: "Calendar"
    parent: "customers"
```

---

## E-Mail Texte

```yaml
EMAIL:
  welcome_subject: "Willkommen bei {{APP_NAME}}! 🎉"
  welcome_greeting: "Hallo {{NAME}},"
  welcome_body: |
    schön, dass du dabei bist! Mit {{APP_NAME}} wird deine Arbeit zum Kinderspiel.
    
  reminder_subject: "Erinnerung: Offene Rechnung {{INVOICE_NUMBER}}"
  
  signature: |
    Viel Erfolg!
    Dein {{APP_NAME}} Team
```

---

## Demo-Modus Beispieldaten

```yaml
DEMO:
  session_duration_days: 30
  
  sample_customers:
    - name: "Familie Müller"
      email: "mueller@example.de"
    - name: "Firma Schmidt GmbH"
      email: "info@schmidt.de"
    - name: "Max Beispiel"
      email: "max@beispiel.de"
      
  sample_projects:
    - name: "Website Relaunch"
      status: "in_progress"
    - name: "Beratung Q1"
      status: "completed"
```

---

## Nächste Schritte

1. **Fülle alle Werte oben aus**
2. **Kopiere diese Datei**
3. **Gib sie zusammen mit dem Prompt aus `BLUEPRINT.md` an Claude**
4. **Claude generiert dir die komplette App!**
