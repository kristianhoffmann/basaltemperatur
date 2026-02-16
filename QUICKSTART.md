# ⚡ Quickstart – In 5 Minuten zur App-Spezifikation

> **Kopiere den Prompt unten, fülle die Lücken aus, und gib ihn an Claude.**

---

## Der Generator-Prompt

```markdown
Ich möchte eine SaaS-App bauen. Du hast Zugriff auf ein Blueprint-Verzeichnis mit:
- SQL-Migrations für die Datenbank
- Edge Functions für E-Mail, PDF, Stripe
- E-Mail-Templates
- Dokumentation für Auth, Stripe, Admin, Demo-Modus

**Meine App:**

APP_NAME: "[DEIN APP NAME]"
APP_DOMAIN: "[deine-domain.de]"
APP_TAGLINE: "[Dein Slogan in einem Satz]"
ZIELGRUPPE: "[Für wen ist die App?]"
BRANCHE: "[Handwerk/Gastronomie/Fitness/etc.]"

**Betreiber (Impressum):**
NAME: "[Dein Name]"
STRASSE: "[Deine Straße + Hausnummer]"
ORT: "[PLZ Stadt]"
EMAIL: "[deine@email.de]"
KLEINUNTERNEHMER: [ja/nein]

**Design:**
PRIMÄRFARBE: "[#hexcode]" (z.B. #1b4d89 für Blau)
AKZENTFARBE: "[#hexcode]" (z.B. #f9e45b für Gelb)

**Preise:**
- Starter: kostenlos, max [X] Kunden
- Pro: [X]€/Monat, unbegrenzte Kunden
- Business: [X]€/Monat, Team-Features

**Features aktivieren:**
- [x] Kundenverwaltung
- [x] Angebote mit PDF
- [x] Rechnungen (GoBD)
- [x] Demo-Modus
- [ ] Kalender (Phase 2)
- [ ] Team-Funktionen (Phase 3)

**Bitte:**
1. Passe alle Dateien im Blueprint an meine Konfiguration an
2. Ersetze alle {{PLATZHALTER}} mit meinen Werten
3. Erstelle dann die React-Komponenten und Seiten
4. Beginne mit der Auth-Implementierung

Frage mich bei Unklarheiten!
```

---

## Beispiel: Ausgefüllter Prompt

```markdown
Ich möchte eine SaaS-App bauen. Du hast Zugriff auf ein Blueprint-Verzeichnis.

**Meine App:**

APP_NAME: "FitStudio Pro"
APP_DOMAIN: "fitstudio-pro.de"
APP_TAGLINE: "Dein Fitnessstudio in der Hosentasche"
ZIELGRUPPE: "Kleine Fitnessstudios und Personal Trainer"
BRANCHE: "Fitness"

**Betreiber:**
NAME: "Anna Schmidt"
STRASSE: "Sportstraße 42"
ORT: "80331 München"
EMAIL: "info@fitstudio-pro.de"
KLEINUNTERNEHMER: nein (USt-IdNr: DE123456789)

**Design:**
PRIMÄRFARBE: "#059669" (Grün)
AKZENTFARBE: "#fbbf24" (Gold)

**Preise:**
- Starter: kostenlos, max 20 Mitglieder
- Pro: 39€/Monat, unbegrenzt
- Business: 79€/Monat, Team + Kurse

**Features:**
- [x] Mitgliederverwaltung (statt Kunden)
- [x] Trainingsplan-Vorlagen (statt Angebote)
- [x] Rechnungen
- [x] Demo-Modus
- [x] Kurskalender

Bitte passe das Blueprint an und erstelle die App!
```

---

## Was passiert dann?

Claude wird:

1. **CONFIG.md ausfüllen** mit deinen Werten
2. **Alle Platzhalter ersetzen** in:
   - README.md
   - LEGAL.md (Impressum, Datenschutz, AGB)
   - EMAIL-TEMPLATES.md
   - globals.css (Farben)
   - package.json (App-Name)
3. **Entitäten anpassen** (z.B. "Kunden" → "Mitglieder")
4. **React-Komponenten erstellen**
5. **Seiten implementieren**

---

## Dateien im Blueprint

| Datei | Was wird angepasst? |
|-------|---------------------|
| `CONFIG.md` | Alle deine Werte |
| `README.md` | App-Name, Domain, Beschreibung |
| `docs/LEGAL.md` | Impressum, Datenschutz, AGB |
| `docs/EMAIL-TEMPLATES.md` | E-Mail-Texte, Farben |
| `app/globals.css` | CSS-Variablen für Farben |
| `tailwind.config.ts` | Design-Tokens |
| `supabase/migrations/*.sql` | Tabellennamen (optional) |
| `supabase/functions/*` | E-Mail-Texte, Domain |

---

## Tipps

### Farben finden
- [Coolors](https://coolors.co/) – Farbpaletten Generator
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) – Vordefinierte Farben

### Gute Taglines
- "Vom [Problem] zu [Lösung] in [Zeit/Klicks]"
- "[Produkt] für [Zielgruppe]"
- "Einfach. Schnell. [Benefit]."

### Preisfindung
- Starter: Kostenlos mit Limit (Lead-Generierung)
- Pro: 25-50€/Monat (Hauptprodukt)
- Business: 2x Pro-Preis (Enterprise-Features)
