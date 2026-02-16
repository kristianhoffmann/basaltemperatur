# Rechtliche Seiten – SaaS Blueprint

> **⚠️ ANPASSEN ERFORDERLICH!**
> 
> Ersetze alle `{{PLATZHALTER}}` mit deinen Werten aus `CONFIG.md`.
> Die Betreiber-Informationen unten sind Beispiele!

---

## Betreiber-Informationen

```
{{OWNER_NAME}}
{{OWNER_STREET}}
{{OWNER_CITY}}
{{OWNER_COUNTRY}}

E-Mail: {{OWNER_EMAIL}}
Telefon: {{OWNER_PHONE}}
```

### Steuerliche Situation

**Bei Kleinunternehmerregelung (§19 UStG):**
- Keine Umsatzsteuer-Identifikationsnummer erforderlich
- Keine MwSt. auf Rechnungen/Abos
- Hinweis auf Kleinunternehmerregelung in Impressum

**Bei regulärem Unternehmen:**
- USt-IdNr. angeben
- MwSt. auf Rechnungen berechnen

**Pflichtangaben im Impressum:**
- Vollständiger Name ✓
- Ladungsfähige Anschrift ✓
- E-Mail-Adresse ✓
- OS-Plattform Link ✓
- Bei GmbH: Handelsregister, Geschäftsführer

---

## Bot-Schutz Komponente

```typescript
// components/legal/ObfuscatedContact.tsx
'use client'

import { useState, useEffect } from 'react'

type ContactType = 'email' | 'phone' | 'website'

// Verschlüsselte Kontaktdaten (ROT13 + Base64)
const ENCODED = {
  email: 'eXZmZ3ZuYS51YnNzemFhQHpyLnBieg==',  // ROT13 dann Base64
  phone: 'MDUxMTE1NTM4OTg3',                    // Base64
  website: 'eXZmZ3ZuYXVic3N6bmFhLnFy'           // ROT13 dann Base64
}

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function decode(encoded: string, useRot13 = true): string {
  try {
    const base64Decoded = atob(encoded)
    return useRot13 ? rot13(base64Decoded) : base64Decoded
  } catch {
    return ''
  }
}

interface Props {
  type: ContactType
  showLabel?: boolean
  className?: string
}

export function ObfuscatedContact({ type, showLabel = false, className = '' }: Props) {
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    // Client-side Dekodierung
    const useRot13 = type !== 'phone'
    setValue(decode(ENCODED[type], useRot13))
  }, [type])

  const labels = {
    email: 'E-Mail',
    phone: 'Telefon', 
    website: 'Website'
  }

  const formatPhone = (num: string) => {
    // 015115538987 -> 0151 1553 8987
    return num.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    setRevealed(true)
  }

  if (!value) return null

  const renderValue = () => {
    if (!revealed) {
      return (
        <button 
          onClick={handleReveal}
          className="text-primary-500 hover:text-primary-600 underline cursor-pointer bg-transparent border-none p-0"
          aria-label={`${labels[type]} anzeigen`}
        >
          [{labels[type]} anzeigen]
        </button>
      )
    }

    switch (type) {
      case 'email':
        return <span className="select-all">{value}</span>
      case 'phone':
        return <span className="select-all">{formatPhone(value)}</span>
      case 'website':
        return (
          <a 
            href={`https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline"
          >
            {value}
          </a>
        )
    }
  }

  return (
    <span className={className}>
      {showLabel && <span className="font-medium">{labels[type]}: </span>}
      {renderValue()}
    </span>
  )
}

// Zusätzlicher Honeypot für Bots
export function HoneypotField() {
  return (
    <input
      type="email"
      name="email_confirm"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ 
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        height: 0,
        width: 0 
      }}
    />
  )
}
```

---

## 1. Impressum

### app/(legal)/impressum/page.tsx

```typescript
// app/(legal)/impressum/page.tsx
import { Metadata } from 'next'
import { ObfuscatedContact } from '@/components/legal/ObfuscatedContact'

export const metadata: Metadata = {
  title: 'Impressum | Handwerker-CRM',
  description: 'Impressum und rechtliche Angaben zu Handwerker-CRM',
  robots: 'noindex, nofollow'
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Angaben gemäß § 5 DDG
            </h2>
            <address className="not-italic text-gray-700 leading-relaxed">
              <strong>Kristian Hoffmann</strong><br />
              Karl-Kraut-Straße 15<br />
              30177 Hannover<br />
              Deutschland
            </address>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Kontakt</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-medium">Telefon:</span>{' '}
                <ObfuscatedContact type="phone" />
              </p>
              <p>
                <span className="font-medium">E-Mail:</span>{' '}
                <ObfuscatedContact type="email" />
              </p>
              <p>
                <span className="font-medium">Website:</span>{' '}
                <ObfuscatedContact type="website" />
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Umsatzsteuer</h2>
            <p className="text-gray-700">
              Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Es erfolgt kein Ausweis der Umsatzsteuer aufgrund der Anwendung der 
              Kleinunternehmerregelung nach § 19 UStG.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <address className="not-italic text-gray-700">
              Kristian Hoffmann<br />
              Karl-Kraut-Straße 15<br />
              30177 Hannover
            </address>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">EU-Streitschlichtung</h2>
            <p className="text-gray-700">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-700 mt-2">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p className="text-gray-700">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren 
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Haftungshinweis</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die 
              Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich 
              deren Betreiber verantwortlich.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Stand: Januar 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 2. Datenschutzerklärung

### app/(legal)/datenschutz/page.tsx

```typescript
// app/(legal)/datenschutz/page.tsx
import { Metadata } from 'next'
import { ObfuscatedContact } from '@/components/legal/ObfuscatedContact'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Handwerker-CRM',
  description: 'Informationen zum Datenschutz bei Handwerker-CRM',
  robots: 'noindex, nofollow'
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-gray-500 mb-8">Stand: Januar 2025</p>

          {/* Inhaltsverzeichnis */}
          <nav className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-gray-800 mb-3">Inhaltsübersicht</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li><a href="#verantwortlicher" className="hover:text-primary-500">Verantwortlicher</a></li>
              <li><a href="#uebersicht" className="hover:text-primary-500">Übersicht der Verarbeitungen</a></li>
              <li><a href="#rechtsgrundlagen" className="hover:text-primary-500">Rechtsgrundlagen</a></li>
              <li><a href="#hosting" className="hover:text-primary-500">Hosting (Supabase)</a></li>
              <li><a href="#zahlungen" className="hover:text-primary-500">Zahlungsabwicklung (Stripe)</a></li>
              <li><a href="#registrierung" className="hover:text-primary-500">Registrierung und Anmeldung</a></li>
              <li><a href="#geschaeftsdaten" className="hover:text-primary-500">Geschäftliche Leistungen</a></li>
              <li><a href="#kontakt" className="hover:text-primary-500">Kontaktaufnahme</a></li>
              <li><a href="#rechte" className="hover:text-primary-500">Rechte der betroffenen Personen</a></li>
              <li><a href="#loeschung" className="hover:text-primary-500">Löschung von Daten</a></li>
            </ol>
          </nav>

          {/* 1. Verantwortlicher */}
          <section id="verantwortlicher" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Verantwortlicher</h2>
            <address className="not-italic text-gray-700 mb-4">
              <strong>Kristian Hoffmann</strong><br />
              Karl-Kraut-Straße 15<br />
              30177 Hannover<br />
              Deutschland
            </address>
            <p className="text-gray-700">
              <span className="font-medium">E-Mail:</span>{' '}
              <ObfuscatedContact type="email" />
            </p>
            <p className="text-gray-700 mt-4 text-sm">
              <a href="/impressum" className="text-primary-500 hover:underline">
                Vollständige Angaben → Impressum
              </a>
            </p>
          </section>

          {/* 2. Übersicht */}
          <section id="uebersicht" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Übersicht der Verarbeitungen</h2>
            
            <h3 className="font-medium text-gray-800 mt-4 mb-2">Arten der verarbeiteten Daten</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Bestandsdaten (z.B. Namen, Adressen)</li>
              <li>Kontaktdaten (z.B. E-Mail, Telefonnummern)</li>
              <li>Inhaltsdaten (z.B. Kundeninformationen, Rechnungsdaten)</li>
              <li>Vertragsdaten (z.B. Vertragsgegenstand, Laufzeit)</li>
              <li>Zahlungsdaten (z.B. Bankverbindung – nur bei Ihren Kunden)</li>
              <li>Nutzungsdaten (z.B. besuchte Seiten, Zugriffszeiten)</li>
              <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen, Geräteinformationen)</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-6 mb-2">Kategorien betroffener Personen</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Nutzer (Handwerker, die unsere Anwendung verwenden)</li>
              <li>Interessenten (Besucher der Website, Demo-Nutzer)</li>
              <li>Geschäftspartner</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-6 mb-2">Zwecke der Verarbeitung</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Bereitstellung der Anwendung und deren Funktionen</li>
              <li>Erbringung vertraglicher Leistungen und Kundenservice</li>
              <li>Abwicklung von Zahlungen</li>
              <li>Sicherheitsmaßnahmen</li>
              <li>Beantwortung von Kontaktanfragen</li>
            </ul>
          </section>

          {/* 3. Rechtsgrundlagen */}
          <section id="rechtsgrundlagen" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Rechtsgrundlagen</h2>
            <p className="text-gray-700 mb-4">
              Wir verarbeiten Ihre Daten auf Grundlage folgender Rechtsgrundlagen der DSGVO:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</strong> – 
                Sie haben uns Ihre Einwilligung zur Verarbeitung erteilt.
              </li>
              <li>
                <strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</strong> – 
                Die Verarbeitung ist erforderlich für die Erfüllung eines Vertrags mit Ihnen 
                (z.B. Bereitstellung der Anwendung nach Registrierung).
              </li>
              <li>
                <strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</strong> – 
                Wir unterliegen rechtlichen Verpflichtungen (z.B. Aufbewahrungspflichten).
              </li>
              <li>
                <strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</strong> – 
                Die Verarbeitung ist zur Wahrung unserer berechtigten Interessen erforderlich 
                (z.B. Sicherheit der Anwendung).
              </li>
            </ul>
          </section>

          {/* 4. Hosting */}
          <section id="hosting" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Hosting und Backend-Infrastruktur</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">
                🇪🇺 Alle Daten werden auf Servern innerhalb der Europäischen Union (Deutschland) gespeichert.
              </p>
            </div>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">Supabase (Datenbank & Authentifizierung)</h3>
            <p className="text-gray-700 mb-2">
              Wir nutzen Supabase als Backend-Infrastruktur. Supabase hostet unsere Datenbank und 
              verarbeitet Authentifizierungsdaten.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li><strong>Anbieter:</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992</li>
              <li><strong>Serverstandort:</strong> Frankfurt am Main, Deutschland (AWS eu-central-1)</li>
              <li><strong>Verarbeitete Daten:</strong> Alle in der Anwendung gespeicherten Daten, 
                Login-Informationen, IP-Adressen bei Authentifizierung</li>
              <li><strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
            </ul>
            <p className="text-gray-700 text-sm">
              Datenschutzrichtlinie von Supabase:{' '}
              <a 
                href="https://supabase.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                https://supabase.com/privacy
              </a>
            </p>

            <h3 className="font-medium text-gray-800 mt-6 mb-2">Vercel (Frontend-Hosting)</h3>
            <p className="text-gray-700 mb-2">
              Unsere Webanwendung wird bei Vercel gehostet.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li><strong>Anbieter:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
              <li><strong>Verarbeitete Daten:</strong> IP-Adressen, Zugriffsprotokolle, technische Daten</li>
              <li><strong>Rechtsgrundlage:</strong> Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</li>
            </ul>
            <p className="text-gray-700 text-sm">
              Vercel ist nach dem EU-U.S. Data Privacy Framework zertifiziert.
            </p>
          </section>

          {/* 5. Zahlungen */}
          <section id="zahlungen" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Zahlungsabwicklung</h2>
            
            <h3 className="font-medium text-gray-800 mt-4 mb-2">Stripe</h3>
            <p className="text-gray-700 mb-2">
              Für die Abwicklung von Zahlungen nutzen wir den Zahlungsdienstleister Stripe.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li><strong>Anbieter:</strong> Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, 
                Grand Canal Dock, Dublin, Irland</li>
              <li><strong>Verarbeitete Daten:</strong> Name, E-Mail-Adresse, Zahlungsinformationen 
                (Kreditkarte, SEPA), IP-Adresse, Geräteinformationen</li>
              <li><strong>Zweck:</strong> Abwicklung von Abonnement-Zahlungen</li>
              <li><strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>Speicherdauer:</strong> Gemäß gesetzlicher Aufbewahrungsfristen (10 Jahre)</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Hinweis:</strong> Ihre Zahlungsdaten (z.B. Kreditkartennummer) werden direkt 
                von Stripe verarbeitet und nicht auf unseren Servern gespeichert. Wir erhalten nur 
                eine Referenz-ID und den Zahlungsstatus.
              </p>
            </div>

            <p className="text-gray-700 text-sm">
              Datenschutzrichtlinie von Stripe:{' '}
              <a 
                href="https://stripe.com/de/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                https://stripe.com/de/privacy
              </a>
            </p>
          </section>

          {/* 6. Registrierung */}
          <section id="registrierung" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Registrierung und Anmeldung</h2>
            
            <p className="text-gray-700 mb-4">
              Nutzer können ein Benutzerkonto anlegen. Im Rahmen der Registrierung werden die 
              erforderlichen Pflichtangaben den Nutzern mitgeteilt.
            </p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">Verarbeitete Daten bei Registrierung</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Name, Firmenname (optional)</li>
              <li>Zeitpunkt der Registrierung</li>
              <li>IP-Adresse zum Zeitpunkt der Registrierung</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">Anmeldung mit OAuth-Providern</h3>
            <p className="text-gray-700 mb-2">
              Sie können sich auch mit folgenden Diensten anmelden:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li><strong>Google:</strong> Name, E-Mail-Adresse, Profilbild</li>
              <li><strong>GitHub:</strong> Name, E-Mail-Adresse, Profilbild</li>
              <li><strong>Apple:</strong> Name (optional), E-Mail-Adresse</li>
            </ul>
            <p className="text-gray-700 text-sm">
              Bei der Anmeldung über diese Dienste erhalten wir nur die oben genannten Daten. 
              Ihr Passwort bei dem jeweiligen Dienst wird uns nicht mitgeteilt.
            </p>

            <h3 className="font-medium text-gray-800 mt-6 mb-2">Löschung des Benutzerkontos</h3>
            <p className="text-gray-700">
              Sie können Ihr Benutzerkonto jederzeit in den Einstellungen löschen. Bei Löschung 
              werden Ihre personenbezogenen Daten gelöscht, sofern keine gesetzlichen 
              Aufbewahrungspflichten entgegenstehen. Rechnungsdaten werden gemäß GoBD für 10 Jahre 
              aufbewahrt, jedoch anonymisiert.
            </p>
          </section>

          {/* 7. Geschäftliche Leistungen */}
          <section id="geschaeftsdaten" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Geschäftliche Leistungen</h2>
            
            <p className="text-gray-700 mb-4">
              Wir verarbeiten Daten unserer Vertrags- und Geschäftspartner im Rahmen von 
              vertraglichen und vergleichbaren Rechtsverhältnissen.
            </p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">Ihre Kundendaten in der Anwendung</h3>
            <p className="text-gray-700 mb-2">
              Die Kundendaten, die Sie in unserer CRM-Anwendung speichern, werden ausschließlich 
              zur Bereitstellung unserer Dienstleistung verarbeitet:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
              <li>Wir haben keinen Zugriff auf Ihre Kundendaten</li>
              <li>Die Daten werden verschlüsselt übertragen (TLS) und gespeichert</li>
              <li>Sie sind allein für die Rechtmäßigkeit der Verarbeitung verantwortlich</li>
              <li>Bei Bedarf stellen wir Ihnen einen Auftragsverarbeitungsvertrag (AVV) bereit</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Wichtig für Handwerker:</strong> Als Nutzer unserer Anwendung sind Sie 
                selbst Verantwortlicher im Sinne der DSGVO für die Daten Ihrer Kunden. Informieren 
                Sie Ihre Kunden entsprechend über die Verarbeitung ihrer Daten.
              </p>
            </div>
          </section>

          {/* 8. Kontakt */}
          <section id="kontakt" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Kontaktaufnahme</h2>
            
            <p className="text-gray-700 mb-4">
              Bei der Kontaktaufnahme mit uns (z.B. per E-Mail oder Kontaktformular) werden die 
              Angaben des Nutzers zur Bearbeitung der Kontaktanfrage verarbeitet.
            </p>

            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Verarbeitete Daten:</strong> Name, E-Mail-Adresse, Nachrichteninhalt</li>
              <li><strong>Rechtsgrundlage:</strong> Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO) 
                bzw. Vertragserfüllung</li>
              <li><strong>Speicherdauer:</strong> Bis zur Erledigung der Anfrage, maximal 3 Jahre</li>
            </ul>
          </section>

          {/* 9. Rechte */}
          <section id="rechte" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Rechte der betroffenen Personen</h2>
            
            <p className="text-gray-700 mb-4">
              Als betroffene Person haben Sie folgende Rechte:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Auskunftsrecht (Art. 15 DSGVO)</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob Sie betreffende 
                  personenbezogene Daten verarbeitet werden.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Recht auf Berichtigung (Art. 16 DSGVO)</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, die Berichtigung unrichtiger Daten zu verlangen.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Recht auf Löschung (Art. 17 DSGVO)</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, die Löschung Ihrer Daten zu verlangen, sofern keine 
                  gesetzlichen Aufbewahrungspflichten entgegenstehen.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, Ihre Daten in einem gängigen Format zu erhalten. 
                  In unserer Anwendung können Sie Ihre Daten jederzeit als JSON oder CSV exportieren.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Widerspruchsrecht (Art. 21 DSGVO)</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, der Verarbeitung Ihrer Daten zu widersprechen.
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-800">Beschwerderecht</h3>
                <p className="text-gray-700 text-sm">
                  Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren. 
                  Zuständig ist die Landesbeauftragte für den Datenschutz Niedersachsen:{' '}
                  <a 
                    href="https://www.lfd.niedersachsen.de" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline"
                  >
                    www.lfd.niedersachsen.de
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 10. Löschung */}
          <section id="loeschung" className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Löschung von Daten</h2>
            
            <p className="text-gray-700 mb-4">
              Wir löschen personenbezogene Daten, sobald der Zweck der Speicherung entfällt und 
              keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">Aufbewahrungsfristen</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Rechnungsdaten:</strong> 10 Jahre (§ 147 AO, § 257 HGB) – werden anonymisiert</li>
              <li><strong>Vertragsdaten:</strong> 3 Jahre nach Vertragsende</li>
              <li><strong>Nutzungsdaten:</strong> Werden bei Kontolöschung gelöscht</li>
              <li><strong>Log-Dateien:</strong> 30 Tage</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">11. Cookies</h2>
            
            <p className="text-gray-700 mb-4">
              Unsere Anwendung verwendet ausschließlich technisch notwendige Cookies für die 
              Authentifizierung und Sitzungsverwaltung. Es werden keine Marketing- oder 
              Tracking-Cookies verwendet.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Cookie</th>
                    <th className="text-left py-2 font-medium">Zweck</th>
                    <th className="text-left py-2 font-medium">Speicherdauer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">sb-access-token</td>
                    <td className="py-2">Authentifizierung (Supabase)</td>
                    <td className="py-2">Session / 7 Tage</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">sb-refresh-token</td>
                    <td className="py-2">Token-Erneuerung (Supabase)</td>
                    <td className="py-2">7 Tage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 text-sm mt-4">
              Da wir nur technisch notwendige Cookies verwenden, ist kein Cookie-Banner erforderlich.
            </p>
          </section>

          {/* Änderungen */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">12. Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-gray-700">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte 
              Rechtslagen oder bei Änderungen des Dienstes anzupassen. Die aktuelle Fassung 
              finden Sie immer auf dieser Seite.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Stand: Januar 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. Allgemeine Geschäftsbedingungen (AGB)

### app/(legal)/agb/page.tsx

```typescript
// app/(legal)/agb/page.tsx
import { Metadata } from 'next'
import { ObfuscatedContact } from '@/components/legal/ObfuscatedContact'

export const metadata: Metadata = {
  title: 'AGB | Handwerker-CRM',
  description: 'Allgemeine Geschäftsbedingungen für Handwerker-CRM',
  robots: 'noindex, nofollow'
}

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-gray-500 mb-8">Stand: Januar 2025</p>

          {/* §1 Geltungsbereich */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 1 Geltungsbereich</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle 
                Verträge zwischen Kristian Hoffmann, Karl-Kraut-Straße 15, 30177 Hannover 
                (nachfolgend "Anbieter") und dem Kunden über die Nutzung der webbasierten 
                Anwendung "Handwerker-CRM" (nachfolgend "Dienst").
              </li>
              <li>
                Der Dienst richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB. 
                Die Nutzung durch Verbraucher ist nicht vorgesehen.
              </li>
              <li>
                Abweichende oder ergänzende AGB des Kunden werden nicht Vertragsbestandteil, 
                es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
              </li>
            </ol>
          </section>

          {/* §2 Vertragsgegenstand */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 2 Vertragsgegenstand</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Anbieter stellt dem Kunden eine webbasierte CRM-Anwendung zur Verwaltung 
                von Kunden, Angeboten, Aufträgen und Rechnungen als Software-as-a-Service (SaaS) 
                zur Verfügung.
              </li>
              <li>
                Der Funktionsumfang ergibt sich aus der jeweiligen Leistungsbeschreibung auf 
                der Website sowie dem gewählten Tarif (Starter, Handwerker, Meister).
              </li>
              <li>
                Der Anbieter ist berechtigt, den Funktionsumfang des Dienstes jederzeit zu 
                erweitern oder zu verbessern. Eine Einschränkung wesentlicher Funktionen 
                während der Vertragslaufzeit erfolgt nicht ohne vorherige Information.
              </li>
            </ol>
          </section>

          {/* §3 Vertragsschluss */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 3 Vertragsschluss & Registrierung</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Die Präsentation des Dienstes auf der Website stellt kein rechtlich 
                bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots.
              </li>
              <li>
                Durch die Registrierung gibt der Kunde ein verbindliches Angebot zum 
                Abschluss eines Nutzungsvertrages ab. Der Vertrag kommt zustande, wenn 
                der Anbieter die Registrierung per E-Mail bestätigt.
              </li>
              <li>
                Bei der Registrierung hat der Kunde wahrheitsgemäße und vollständige 
                Angaben zu machen. Der Kunde ist verpflichtet, seine Daten aktuell zu halten.
              </li>
              <li>
                Der Kunde darf sein Benutzerkonto nicht an Dritte weitergeben.
              </li>
            </ol>
          </section>

          {/* §4 Tarife und Preise */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 4 Tarife und Preise</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Dienst wird in verschiedenen Tarifen angeboten:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Starter (kostenlos):</strong> Eingeschränkter Funktionsumfang</li>
                  <li><strong>Handwerker (29 €/Monat oder 290 €/Jahr):</strong> Vollständiger Funktionsumfang</li>
                  <li><strong>Meister (59 €/Monat oder 590 €/Jahr):</strong> Vollständiger Funktionsumfang + Team-Funktionen</li>
                </ul>
              </li>
              <li>
                Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung). 
                Die angegebenen Preise sind Endpreise.
              </li>
              <li>
                Kostenpflichtige Tarife können mit einer 14-tägigen kostenlosen Testphase 
                beginnen. Nach Ablauf der Testphase wird das Abonnement automatisch 
                kostenpflichtig, sofern nicht vorher gekündigt wurde.
              </li>
              <li>
                Der Anbieter behält sich das Recht vor, die Preise mit einer Ankündigungsfrist 
                von 30 Tagen zum Ende der aktuellen Abrechnungsperiode anzupassen. Der Kunde 
                kann in diesem Fall zum Zeitpunkt der Preiserhöhung kündigen.
              </li>
            </ol>
          </section>

          {/* §5 Zahlung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 5 Zahlung</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Der Kunde kann 
                per Kreditkarte oder SEPA-Lastschrift zahlen.
              </li>
              <li>
                Bei monatlicher Zahlung wird der Betrag jeweils zu Beginn des Abrechnungszeitraums 
                fällig. Bei jährlicher Zahlung erfolgt die Abbuchung einmal jährlich im Voraus.
              </li>
              <li>
                Bei fehlgeschlagenen Zahlungen wird der Kunde per E-Mail informiert. Nach 
                drei fehlgeschlagenen Zahlungsversuchen innerhalb von 14 Tagen kann der 
                Zugang zum Dienst gesperrt werden.
              </li>
              <li>
                Der Kunde erhält für jede Zahlung eine Rechnung per E-Mail und kann diese 
                auch im Kundenportal abrufen.
              </li>
            </ol>
          </section>

          {/* §6 Laufzeit und Kündigung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 6 Laufzeit und Kündigung</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Vertrag für kostenpflichtige Tarife hat eine Mindestlaufzeit entsprechend 
                dem gewählten Abrechnungszeitraum (monatlich oder jährlich).
              </li>
              <li>
                Der Vertrag verlängert sich automatisch um den gleichen Zeitraum, wenn er 
                nicht vor Ablauf der Laufzeit gekündigt wird.
              </li>
              <li>
                Die Kündigung kann jederzeit zum Ende der aktuellen Abrechnungsperiode 
                erfolgen. Die Kündigung kann im Kundenportal (Stripe Customer Portal) 
                oder per E-Mail an den Anbieter erfolgen.
              </li>
              <li>
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt 
                unberührt.
              </li>
              <li>
                Nach Vertragsende hat der Kunde 30 Tage Zeit, seine Daten zu exportieren. 
                Danach werden die Daten gelöscht, soweit keine gesetzlichen 
                Aufbewahrungspflichten bestehen.
              </li>
            </ol>
          </section>

          {/* §7-12 gekürzt für Lesbarkeit... */}
          
          {/* §7 Nutzungsrechte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 7 Nutzungsrechte</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Anbieter räumt dem Kunden für die Dauer des Vertrages ein einfaches, 
                nicht übertragbares Recht zur Nutzung des Dienstes entsprechend dem 
                gewählten Tarif ein.
              </li>
              <li>
                Der Kunde darf den Dienst nur für eigene geschäftliche Zwecke nutzen. 
                Eine Unterlizenzierung oder Weitergabe an Dritte ist nicht gestattet.
              </li>
              <li>
                Der Kunde bleibt Eigentümer aller von ihm in den Dienst eingegebenen Daten.
              </li>
            </ol>
          </section>

          {/* §8 Pflichten des Kunden */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 8 Pflichten des Kunden</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten.</li>
              <li>Der Kunde ist für alle Aktivitäten unter seinem Benutzerkonto verantwortlich.</li>
              <li>Der Kunde darf den Dienst nicht für rechtswidrige Zwecke nutzen.</li>
              <li>Der Kunde ist selbst verantwortlich für die DSGVO-Konformität seiner Kundendaten.</li>
            </ol>
          </section>

          {/* §9 Verfügbarkeit */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 9 Verfügbarkeit</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Der Anbieter bemüht sich um eine Verfügbarkeit von 99 % im Jahresmittel.</li>
              <li>Geplante Wartungsarbeiten werden mindestens 24 Stunden vorher angekündigt.</li>
              <li>Der Anbieter haftet nicht für Ausfälle durch höhere Gewalt oder Drittanbieter.</li>
            </ol>
          </section>

          {/* §10 Haftung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 10 Haftung</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit.</li>
              <li>Bei leichter Fahrlässigkeit ist die Haftung auf den vertragstypischen Schaden begrenzt.</li>
              <li>Die Haftung ist auf maximal 1.000 € pro Schadenfall begrenzt.</li>
              <li>Der Anbieter haftet nicht für vermeidbare Datenverluste.</li>
            </ol>
          </section>

          {/* §11 Datenschutz */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 11 Datenschutz</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Anbieter verarbeitet personenbezogene Daten gemäß der{' '}
                <a href="/datenschutz" className="text-primary-500 hover:underline">
                  Datenschutzerklärung
                </a>.
              </li>
              <li>
                Auf Wunsch wird ein Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO geschlossen.
              </li>
            </ol>
          </section>

          {/* §12 Schlussbestimmungen */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">§ 12 Schlussbestimmungen</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Es gilt das Recht der Bundesrepublik Deutschland.</li>
              <li>Gerichtsstand ist Hannover (für Kaufleute).</li>
              <li>Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest gültig.</li>
              <li>Änderungen werden 30 Tage vor Inkrafttreten per E-Mail mitgeteilt.</li>
            </ol>
          </section>

          {/* Kontakt */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Kontakt</h2>
            <address className="not-italic text-gray-700">
              <strong>Kristian Hoffmann</strong><br />
              Karl-Kraut-Straße 15<br />
              30177 Hannover<br /><br />
              E-Mail: <ObfuscatedContact type="email" />
            </address>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">Stand: Januar 2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Legal Layout

```typescript
// app/(legal)/layout.tsx
import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-500">
            Handwerker-CRM
          </Link>
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link href="/impressum" className="hover:text-primary-500">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-primary-500">Datenschutz</Link>
            <Link href="/agb" className="hover:text-primary-500">AGB</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-100 border-t mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Handwerker-CRM – Kristian Hoffmann</p>
        </div>
      </footer>
    </div>
  )
}
```

---

## Checkliste

### Pflichtseiten
- [x] **Impressum** (§ 5 DDG) – mit Kleinunternehmer-Hinweis §19 UStG
- [x] **Datenschutzerklärung** – DSGVO mit Supabase (DE), Stripe, OAuth
- [x] **AGB** – B2B SaaS, Abo-Modell, Stripe-Zahlung

### Bot-Schutz
- [x] E-Mail verschlüsselt (ROT13 + Base64)
- [x] Telefon verschlüsselt (Base64)
- [x] Website verschlüsselt (ROT13 + Base64)
- [x] Click-to-reveal Funktion
- [x] Keine mailto:/tel: Links im HTML

### Steuerlich (Kleinunternehmer §19 UStG)
- [x] Hinweis im Impressum
- [x] Hinweis in AGB (Preise sind Endpreise)
- [x] Keine MwSt. auf Stripe-Rechnungen konfigurieren
- [ ] Steuernummer beantragen (falls nicht vorhanden)
