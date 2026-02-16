# 🚀 Blueprint 2026: Feature-Analyse & Empfehlungen

> **Stand:** Januar 2026
> **Basierend auf:** SaaS-Trends 2025/2026, Industrie-Best-Practices, Wettbewerberanalyse

---

## 📊 Aktueller Stand des Blueprints

### ✅ Was wir haben (Solide Basis)

| Bereich | Dateien | Status |
|---------|---------|--------|
| Dokumentation | 8 MD-Dateien | ✅ Exzellent |
| Docs (Rechtlich, API, etc.) | 10 MD-Dateien | ✅ Vollständig |
| SQL Migrations | 13 Dateien | ✅ Vollständig |
| Edge Functions | 10 Funktionen | ✅ Vollständig |
| App-Seiten | 7 TSX-Dateien | ⚠️ Grundstruktur |
| Components | 12 TSX-Dateien | ⚠️ Basis |
| Lib/Utils | 8 Dateien | ⚠️ Basis |

**Gesamtzahl: 77 Dateien**

---

## 🔴 KRITISCH FEHLEND (Muss für MVP)

### 1. Onboarding-Flow ❌

**Warum wichtig:** 80% der User verlassen Apps, weil sie nicht wissen, wie sie funktionieren.

```
Fehlende Dateien:
├── app/(auth)/onboarding/
│   ├── page.tsx           # Haupt-Onboarding
│   ├── steps/
│   │   ├── Welcome.tsx    # Willkommen + Name
│   │   ├── Company.tsx    # Firmendaten
│   │   ├── Plan.tsx       # Plan-Auswahl
│   │   └── Complete.tsx   # Fertig + Confetti 🎉
│   └── components/
│       ├── OnboardingProgress.tsx
│       └── OnboardingLayout.tsx
└── lib/hooks/useOnboarding.ts
```

**Features:**
- Multi-Step Wizard
- Progress-Indikator
- Skip-Option
- Personalisierung basierend auf Antworten

---

### 2. Registrierung-Seite ❌

```
Fehlende Dateien:
├── app/(auth)/registrieren/page.tsx
└── components/forms/RegisterForm.tsx
```

---

### 3. Passwort-Vergessen Flow ❌

```
Fehlende Dateien:
├── app/(auth)/passwort-vergessen/page.tsx
├── app/(auth)/passwort-aendern/page.tsx
└── components/forms/ResetPasswordForm.tsx
```

---

### 4. Kunden-CRUD Seiten ❌

```
Fehlende Dateien:
├── app/(dashboard)/kunden/
│   ├── page.tsx           # Liste mit Filter/Suche
│   ├── [id]/page.tsx      # Detailansicht
│   ├── [id]/bearbeiten/page.tsx
│   └── neu/page.tsx       # Neuer Kunde
├── components/features/customers/
│   ├── CustomerList.tsx
│   ├── CustomerCard.tsx
│   ├── CustomerForm.tsx
│   └── CustomerFilters.tsx
└── lib/actions/customers.ts
```

---

### 5. Weitere UI-Komponenten ❌

```
Fehlende Dateien:
├── components/ui/
│   ├── modal.tsx          # Dialog/Modal
│   ├── toast.tsx          # Notifications
│   ├── table.tsx          # Data Table
│   ├── badge.tsx          # Status-Badges
│   ├── dropdown.tsx       # Dropdown-Menü
│   ├── select.tsx         # Select-Input
│   ├── textarea.tsx       # Textarea
│   ├── checkbox.tsx       # Checkbox
│   ├── radio.tsx          # Radio-Buttons
│   ├── switch.tsx         # Toggle Switch
│   ├── tabs.tsx           # Tab-Navigation
│   ├── skeleton.tsx       # Loading Skeletons
│   ├── alert.tsx          # Alert-Boxen
│   ├── avatar.tsx         # User Avatare
│   ├── pagination.tsx     # Pagination
│   ├── empty-state.tsx    # Leere Zustände
│   └── file-upload.tsx    # Datei-Upload
```

---

### 6. Einstellungen-Seiten ❌

```
Fehlende Dateien:
├── app/(dashboard)/einstellungen/
│   ├── page.tsx           # Profil
│   ├── abo/page.tsx       # Subscription
│   ├── konto/page.tsx     # Account/Löschen
│   ├── benachrichtigungen/page.tsx
│   └── team/page.tsx      # (wenn Multi-User)
```

---

### 7. Rechtliche Seiten ❌

```
Fehlende Dateien:
├── app/(legal)/
│   ├── impressum/page.tsx
│   ├── datenschutz/page.tsx
│   └── agb/page.tsx
```

---

## 🟡 WICHTIG (Für professionelle App)

### 8. Analytics Dashboard 📊

**Trend 2026:** Embedded Analytics ist Standard.

```
Fehlende Dateien:
├── app/(dashboard)/analytics/page.tsx
├── components/features/analytics/
│   ├── StatsCard.tsx
│   ├── RevenueChart.tsx
│   ├── CustomerChart.tsx
│   ├── QuoteConversionChart.tsx
│   └── ActivityTimeline.tsx
└── lib/hooks/useAnalytics.ts
```

**Features:**
- Umsatz-Übersicht (Monat/Jahr)
- Angebots-Conversion-Rate
- Kunden-Wachstum
- Überfällige Rechnungen

---

### 9. Globale Suche (Command Palette) 🔍

**Trend 2026:** Natural Language Interfaces & Quick Navigation

```
Fehlende Dateien:
├── components/shared/CommandPalette.tsx
└── lib/hooks/useCommandPalette.ts
```

**Features:**
- `Cmd+K` / `Ctrl+K` Shortcut
- Suche über alle Entitäten
- Schnell-Aktionen (Neuer Kunde, Neue Rechnung)
- Keyboard Navigation

---

### 10. Benachrichtigungs-System 🔔

```
Fehlende Dateien:
├── components/shared/NotificationCenter.tsx
├── components/shared/NotificationItem.tsx
├── lib/hooks/useNotifications.ts
└── supabase/migrations/xxx_notifications.sql
```

**Features:**
- In-App Benachrichtigungen
- E-Mail-Präferenzen
- Echtzeit mit Supabase Realtime

---

### 11. Dark Mode 🌙

**Trend 2026:** Standard-Feature

```
Fehlende Dateien:
├── components/shared/ThemeToggle.tsx
├── lib/hooks/useTheme.ts
└── app/globals.css (Dark Mode Variablen)
```

---

### 12. Toast/Notification System 🍞

```
Fehlende Dateien:
├── components/ui/toast.tsx
├── components/shared/Toaster.tsx
└── lib/hooks/useToast.ts
```

---

### 13. Export-Funktionen 📤

```
Fehlende Dateien:
├── lib/utils/export.ts
│   ├── exportToCSV()
│   ├── exportToExcel()
│   └── exportToPDF()
└── components/shared/ExportButton.tsx
```

---

### 14. Bulk-Aktionen ⚡

```
Fehlende Dateien:
├── components/shared/BulkActions.tsx
└── lib/hooks/useBulkSelection.ts
```

**Features:**
- Mehrere Kunden auswählen
- Bulk-Löschen, Bulk-Export
- Status ändern

---

## 🟢 NICE-TO-HAVE (2026 Trends)

### 15. AI-Integration 🤖

**Top Trend 2026:** AI-Agents, Copilots, Predictive Analytics

```
Mögliche Features:
├── AI-Assistent für Angebotserstellung
├── Automatische Zahlungserinnerungs-Texte
├── Churn-Prediction (welche Kunden sind gefährdet)
├── Intelligente Preisvorschläge
└── Natürliche Sprach-Suche
```

```
Fehlende Dateien:
├── lib/ai/
│   ├── openai.ts          # OpenAI Client
│   ├── prompts.ts         # Prompt Templates
│   └── actions.ts         # AI Server Actions
├── components/ai/
│   ├── AIAssistant.tsx    # Chat-Interface
│   └── AISuggestion.tsx   # Inline-Vorschläge
└── supabase/functions/ai-assistant/index.ts
```

---

### 16. Internationalisierung (i18n) 🌍

```
Fehlende Dateien:
├── lib/i18n/
│   ├── config.ts
│   └── dictionaries/
│       ├── de.json
│       └── en.json
├── middleware.ts (i18n routing)
└── components/shared/LanguageSelector.tsx
```

---

### 17. PWA Support 📱

```
Fehlende Dateien:
├── public/manifest.json
├── public/sw.js           # Service Worker
└── app/manifest.ts
```

**Features:**
- Offline-Fähigkeit
- Push-Benachrichtigungen
- App-Icon auf Homescreen

---

### 18. Keyboard Shortcuts ⌨️

```
Fehlende Dateien:
├── lib/hooks/useKeyboardShortcuts.ts
└── components/shared/ShortcutsHelp.tsx
```

**Shortcuts:**
- `n` + `k` = Neuer Kunde
- `n` + `a` = Neues Angebot
- `n` + `r` = Neue Rechnung
- `?` = Shortcuts anzeigen

---

### 19. Activity Log / Audit Trail 📝

```
Fehlende Dateien:
├── app/(dashboard)/aktivitaet/page.tsx
└── components/features/activity/
    ├── ActivityFeed.tsx
    └── ActivityItem.tsx
```

**Features:**
- Wer hat was wann geändert
- GoBD-Compliance
- Filter nach Entität/User

---

### 20. Feedback-System & NPS 💬

```
Fehlende Dateien:
├── components/shared/FeedbackWidget.tsx
├── components/shared/NPSSurvey.tsx
└── supabase/migrations/xxx_feedback.sql
```

---

### 21. Changelog / What's New 📰

```
Fehlende Dateien:
├── app/(dashboard)/changelog/page.tsx
├── components/shared/WhatsNewModal.tsx
└── content/changelog/
    ├── 2026-01-15.md
    └── 2026-01-01.md
```

---

### 22. API für Kunden 🔌

```
Fehlende Dateien:
├── app/api/v1/
│   ├── customers/route.ts
│   ├── quotes/route.ts
│   ├── invoices/route.ts
│   └── docs/page.tsx      # API Dokumentation
├── lib/api/
│   ├── auth.ts            # API Key Validation
│   └── rate-limit.ts
└── supabase/migrations/xxx_api_keys.sql
```

---

### 23. Integrations-Hub 🔗

**Trend 2026:** API-First, Composable Architecture

```
Mögliche Integrationen:
├── Google Calendar
├── DATEV (Buchhaltung)
├── Zapier/Make Webhooks
├── E-Mail (IMAP Sync)
└── Cloud-Speicher (Dropbox, Google Drive)
```

---

### 24. Multi-Tenancy / Team-Features 👥

```
Fehlende Dateien:
├── app/(dashboard)/team/
│   ├── page.tsx           # Team-Mitglieder
│   ├── einladen/page.tsx  # Einladung
│   └── rollen/page.tsx    # Rollen-Verwaltung
├── lib/rbac/
│   ├── permissions.ts
│   └── roles.ts
└── supabase/migrations/xxx_team_members.sql
```

---

## 📋 Priorisierte Umsetzungs-Roadmap

### Phase 1: MVP-Ready (Muss haben)
**Geschätzte Zeit: 8-12 Stunden**

1. ✅ ~~Layouts (Root, Auth, Dashboard)~~
2. ✅ ~~Login-Seite~~
3. ⬜ Registrierung-Seite
4. ⬜ Passwort-Vergessen Flow
5. ⬜ Onboarding-Flow (3 Steps)
6. ⬜ Kunden-CRUD komplett
7. ⬜ Weitere UI-Komponenten (Modal, Toast, Table, etc.)
8. ⬜ Einstellungen-Seiten
9. ⬜ Rechtliche Seiten
10. ⬜ Toast/Notification System

### Phase 2: Professionell (Sollte haben)
**Geschätzte Zeit: 6-8 Stunden**

11. ⬜ Analytics Dashboard
12. ⬜ Command Palette (Cmd+K)
13. ⬜ Dark Mode
14. ⬜ Export-Funktionen
15. ⬜ Bulk-Aktionen
16. ⬜ Activity Log

### Phase 3: 2026-Ready (Nice-to-have)
**Geschätzte Zeit: 10-20 Stunden**

17. ⬜ AI-Integration (Basisversion)
18. ⬜ i18n (DE/EN)
19. ⬜ PWA Support
20. ⬜ Keyboard Shortcuts
21. ⬜ Feedback-System
22. ⬜ Changelog
23. ⬜ Public API

---

## 🎯 Empfehlung

**Für ein "Ein-Prompt-zur-App" Blueprint empfehle ich:**

1. **Phase 1 komplett umsetzen** → Dann kann Claude eine funktionsfähige App generieren
2. **Phase 2 als optionale Module** → Claude kann sie hinzufügen wenn gewünscht
3. **Phase 3 als Dokumentation** → Beschreibung wie man es später hinzufügen kann

**Aktuelle Vollständigkeit:** ~35%
**Nach Phase 1:** ~75%
**Nach Phase 2:** ~90%
**Nach Phase 3:** ~100%

---

## 📁 Geschätzte Datei-Anzahl nach Fertigstellung

| Phase | Neue Dateien | Gesamt |
|-------|--------------|--------|
| Aktuell | - | 77 |
| Phase 1 | +45 | ~122 |
| Phase 2 | +25 | ~147 |
| Phase 3 | +40 | ~187 |

---

## 💡 Besondere 2026-Trends die wir einbauen sollten

### 1. **Usage-Based Pricing UI**
- Nicht nur feste Pläne, sondern auch Verbrauchsanzeige
- "Du hast noch 50 Rechnungen in diesem Monat"

### 2. **AI-Copilot Light**
- Einfacher AI-Button bei Textfeldern
- "Beschreibung generieren", "Verbessern", "Kürzen"

### 3. **Health Score für Kunden**
- Automatische Bewertung: Aktiv, Gefährdet, Inaktiv
- Basierend auf letzter Aktivität, Zahlungsverhalten

### 4. **Smart Notifications**
- Nicht nur "Rechnung überfällig"
- Sondern "Kunde X hat 3 überfällige Rechnungen, Gesamtwert: 5.000€"

### 5. **Quick Actions überall**
- Rechtsklick-Menü auf Tabellenzeilen
- Swipe-Aktionen auf Mobile

---

Soll ich mit Phase 1 weitermachen und die fehlenden Dateien erstellen?
