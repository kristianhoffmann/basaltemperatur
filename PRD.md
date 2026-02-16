# PRD – {{APP_NAME}}

> **Product Requirements Document**
> 
> Dieses Dokument beschreibt die Anforderungen für {{APP_NAME}}.

---

## 1. Produkt-Vision

### 1.1 Elevator Pitch

{{APP_NAME}} ist eine Web-App für {{TARGET_AUDIENCE}}. 

**{{APP_TAGLINE}}**

### 1.2 Problem

{{PROBLEM_SOLVED}}

### 1.3 Lösung

{{APP_DESCRIPTION}}

### 1.4 Zielgruppe

- **Primär:** {{TARGET_AUDIENCE}}
- **Unternehmensgröße:** {{TARGET_AUDIENCE_SIZE}}
- **Branche:** {{INDUSTRY}}

---

## 2. Features

### 2.1 MVP (Phase 1)

#### Authentifizierung
- [ ] E-Mail + Passwort Login
- [ ] OAuth (Google, optional: Apple, GitHub)
- [ ] Passwort zurücksetzen
- [ ] E-Mail-Bestätigung
- [ ] Onboarding nach Registrierung

#### Dashboard
- [ ] Übersicht mit wichtigen Kennzahlen
- [ ] Schnellzugriff auf häufige Aktionen
- [ ] Responsive Design (Mobile-First)

#### Kundenverwaltung
- [ ] Kunden anlegen, bearbeiten, löschen
- [ ] Kontaktdaten (Name, E-Mail, Telefon, Adresse)
- [ ] Notizen und Tags
- [ ] Suchfunktion

#### Angebote
- [ ] Angebot erstellen mit Positionen
- [ ] PDF-Export
- [ ] Status-Tracking (Entwurf → Gesendet → Angenommen/Abgelehnt)
- [ ] In Rechnung umwandeln

#### Rechnungen
- [ ] Rechnung erstellen mit Positionen
- [ ] PDF-Export
- [ ] GoBD-konform (unveränderbar nach Versand)
- [ ] Fortlaufende Rechnungsnummern
- [ ] Zahlungsstatus tracken

#### Demo-Modus
- [ ] Alle Features ohne Registrierung testen
- [ ] Beispieldaten werden generiert
- [ ] "Jetzt registrieren" Banner

#### Stripe-Integration
- [ ] Plan-Auswahl
- [ ] Checkout-Flow
- [ ] Kundenportal (Abo verwalten)
- [ ] Webhooks für Abo-Events

#### Rechtliches
- [ ] Impressum
- [ ] Datenschutzerklärung
- [ ] AGB

### 2.2 Phase 2

- [ ] Kalender / Terminplanung
- [ ] E-Mail-Versand direkt aus der App
- [ ] Vorlagen für wiederkehrende Leistungen
- [ ] Zahlungserinnerungen
- [ ] Admin-Dashboard (Nutzer, Analytics)

### 2.3 Phase 3

- [ ] Team-Funktionen (Mitarbeiter hinzufügen)
- [ ] XRechnung / E-Rechnung
- [ ] Mobile App (PWA oder Native)
- [ ] API für Integrationen
- [ ] Erweiterte Berichte

---

## 3. Nicht-funktionale Anforderungen

### 3.1 Performance
- Time to Interactive < 3 Sekunden
- Lighthouse Score > 90
- Funktioniert auch bei schlechter Verbindung

### 3.2 Sicherheit
- HTTPS everywhere
- Row Level Security auf allen Tabellen
- Rate Limiting auf API-Endpoints
- CSRF-Schutz

### 3.3 Compliance
- **DSGVO:** Datenverarbeitung in EU, Löschfunktion, Datenschutzerklärung
- **GoBD:** Unveränderbare Rechnungen, Audit-Log, 10 Jahre Archivierung
- **§19 UStG:** Kleinunternehmer-Option (keine MwSt.)

### 3.4 Barrierefreiheit
- WCAG 2.1 AA anstreben
- Tastaturnavigation
- Screen Reader Support
- Kontrastverhältnisse einhalten

---

## 4. Preismodell

### {{PLAN_1_NAME}} (Kostenlos)
- Bis zu {{PLAN_1_LIMIT}} Kunden
- Basis-Funktionen
- Community Support

### {{PLAN_2_NAME}} ({{PLAN_2_PRICE}}€/Monat)
- Unbegrenzte Kunden
- PDF-Export
- E-Mail-Versand
- E-Mail-Support

### {{PLAN_3_NAME}} ({{PLAN_3_PRICE}}€/Monat)
- Alles aus {{PLAN_2_NAME}}
- Team-Funktionen
- Prioritäts-Support
- Erweiterte Berichte

### Trial
- {{TRIAL_DAYS}} Tage kostenlos testen
- Keine Kreditkarte erforderlich
- Voller Funktionsumfang

---

## 5. Technische Architektur

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod

### Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage
- Edge Functions

### Payments
- Stripe Checkout
- Stripe Customer Portal
- Stripe Webhooks

### Hosting
- Vercel (Frontend)
- Supabase Cloud (Backend, EU)

---

## 6. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Stripe-Ausfall | Niedrig | Hoch | Graceful Degradation, Status-Seite |
| Supabase-Ausfall | Niedrig | Hoch | Backups, Monitoring |
| Datenverlust | Niedrig | Kritisch | Tägliche Backups, Point-in-Time Recovery |
| DSGVO-Verstoß | Mittel | Hoch | Rechtliche Prüfung, DPA mit Supabase |

---

## 7. Erfolgskriterien

### Launch (Monat 1)
- [ ] 100 registrierte Nutzer
- [ ] 10 zahlende Kunden
- [ ] < 5 kritische Bugs

### Quartal 1
- [ ] 500 registrierte Nutzer
- [ ] 50 zahlende Kunden
- [ ] NPS > 30

### Jahr 1
- [ ] 5.000 registrierte Nutzer
- [ ] 500 zahlende Kunden
- [ ] MRR > 10.000€
