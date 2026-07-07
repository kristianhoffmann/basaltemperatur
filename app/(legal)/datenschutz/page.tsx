import { Metadata } from 'next';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { AnalyticsOptOut } from '@/app/(legal)/AnalyticsOptOut';
import {
  getLegalCompany,
  getLegalInfrastructure,
  getMissingCompanyFields,
  LEGAL_LAST_UPDATED,
} from '@/app/(legal)/legalConfig';

// ============================================================================
// DATENSCHUTZERKLÄRUNG
// DSGVO-konforme Datenschutzerklärung für Basaltemperatur App
// Besonderheit: Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO)
// Infrastrukturangaben werden aus Environment-Variablen gezogen
// ============================================================================

export const metadata: Metadata = {
  title: 'Datenschutzerklärung – Basaltemperatur',
  description: 'Informationen zum Datenschutz und zur Verarbeitung Ihrer personenbezogenen Daten',
  alternates: {
    canonical: '/datenschutz',
  },
};

export default function DatenschutzPage() {
  const company = getLegalCompany();
  const infrastructure = getLegalInfrastructure();
  const missingFields = getMissingCompanyFields(company);

  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <LegalDataWarning missingFields={missingFields} />

      <h2>1. Datenschutz auf einen Blick</h2>

      <h3>Allgemeine Hinweise</h3>
      <p>
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
        personenbezogenen Daten passiert, wenn Sie die Basaltemperatur App nutzen.
        Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert
        werden können.
      </p>

      <h3>Datenerfassung in dieser App</h3>
      <p><strong>Wer ist verantwortlich für die Datenerfassung?</strong></p>
      <p>
        Die Datenverarbeitung erfolgt durch den Betreiber der App. Dessen
        Kontaktdaten können Sie dem Abschnitt „Verantwortliche Stelle“ in dieser
        Datenschutzerklärung entnehmen.
      </p>

      <p><strong>Welche Daten werden erfasst?</strong></p>
      <p>
        Bei der Nutzung dieser App werden insbesondere folgende Daten verarbeitet:
      </p>
      <ul>
        <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse, Passwort-Hash</li>
        <li><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Basaltemperaturwerte, Periodendaten (Datum, Stärke), Zyklusnotizen</li>
        <li><strong>Nutzungsdaten:</strong> Zykluseinstellungen, Profilpräferenzen</li>
        <li><strong>Technische Daten:</strong> IP-Adresse, Browsertyp, Zugriffszeiten (Server-Logs)</li>
        <li><strong>Nutzungsanalyse:</strong> besuchte Seiten, Referrer, Geräte-/Browserdaten, Sprache, Zeitzone, pseudonyme Besucher- und Sitzungskennungen</li>
      </ul>

      <p><strong>Wofür nutzen wir Ihre Daten?</strong></p>
      <p>
        Ihre Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet:
        Temperaturkurve, rückblickende Auswertung von Temperaturanstiegen, Zyklusstatistiken
        und Periodenvorhersagen.
        Es erfolgt <strong>keine</strong> Weitergabe an Dritte zu Werbezwecken.
      </p>

      <h2>2. Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO)</h2>
      <p>
        Die Basaltemperatur App verarbeitet <strong>Gesundheitsdaten</strong>, die nach
        Art. 9 Abs. 1 DSGVO zu den besonderen Kategorien personenbezogener Daten gehören.
        Hierzu zählen:
      </p>
      <ul>
        <li>Basaltemperaturmessungen</li>
        <li>Periodendaten (Datum und Intensität der Blutung)</li>
        <li>Zyklusbezogene Notizen (z.B. Krankheit, Schlafstörungen)</li>
        <li>Daraus abgeleitete Informationen (Temperaturanstiege, Zyklusphase, statistische Fruchtbarkeitsfenster)</li>
      </ul>
      <p>
        Die Verarbeitung erfolgt ausschließlich auf Grundlage Ihrer <strong>ausdrücklichen
          Einwilligung</strong> gemäß Art. 9 Abs. 2 lit. a DSGVO, die Sie bei der Registrierung
        erteilen. Sie können diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen,
        indem Sie in den Einstellungen die Einwilligung widerrufen, Ihr Konto löschen oder
        uns per E-Mail kontaktieren.
      </p>

      <h2>3. Hosting und Datenspeicherung</h2>

      <h3>Webhosting</h3>
      <p>
        Die Web-App wird bei <strong>{infrastructure.webProvider}</strong> gehostet.
        Datenstandort: <strong>{infrastructure.webLocation}</strong>.
      </p>
      <p>
        Beim Zugriff auf die Website werden automatisch technische Daten in Server-Log-Dateien
        erfasst (IP-Adresse, Browsertyp, Zugriffszeit). Diese Daten werden nicht mit anderen
        Datenquellen zusammengeführt.
      </p>

      <h3>Datenbank</h3>
      <p>
        Ihre Nutzerdaten (Registrierung, Temperatureinträge, Periodendaten) werden in einer
        Datenbank bei <strong>{infrastructure.dbProvider}</strong> gespeichert.
        Datenstandort: <strong>{infrastructure.dbLocation}</strong>.
      </p>
      <p>
        Sofern ein Anbieter Daten außerhalb der EU/des EWR verarbeitet, erfolgt dies nur
        auf Basis geeigneter Garantien gemäß Art. 44 ff. DSGVO (z.B. EU-Standardvertragsklauseln).
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und
        Art. 28 DSGVO (Auftragsverarbeitung).
      </p>

      <h2>4. Ihre Rechte</h2>
      <p>Ihnen stehen folgende Rechte zu:</p>
      <ul>
        <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
        <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen.</li>
        <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen. Die Konto-Löschung ist direkt in der App unter „Einstellungen“ möglich.</li>
        <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
        <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem maschinenlesbaren Format erhalten.</li>
        <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen.</li>
        <li><strong>Widerruf der Einwilligung:</strong> Die Einwilligung zur Verarbeitung von Gesundheitsdaten kann jederzeit widerrufen werden.</li>
      </ul>
      <p>
        Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <span>{company.email.replace('@', ' [at] ')}</span>
      </p>

      <h2>5. Verantwortliche Stelle</h2>
      <p>Die verantwortliche Stelle für die Datenverarbeitung ist:</p>
      <p>
        {company.name}<br />
        {company.street}<br />
        {company.city}
      </p>
      <p>
        E-Mail: <span>{company.email.replace('@', ' [at] ')}</span>
      </p>

      <h2>6. Registrierung und Benutzerkonto</h2>
      <p>
        Bei der Registrierung erheben wir Ihren Namen, Ihre E-Mail-Adresse und ein
        selbstgewähltes Passwort. Das Passwort wird ausschließlich als kryptografischer
        Hash gespeichert. Wir haben keinen Zugriff auf Ihr Klartext-Passwort.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Die App verwendet technisch notwendige Cookies für die Session-Verwaltung
        (Anmeldestatus). Für die unten beschriebene Nutzungsanalyse werden keine
        Drittanbieter-Cookies gesetzt; die pseudonyme Besucherkennung wird im lokalen
        Browser-Speicher gespeichert.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
        technischen Funktionsfähigkeit).
      </p>

      <h2>8. Nutzungsanalyse</h2>
      <p>
        Wir erfassen einfache technische Nutzungsdaten, um Fehler, Reichweite und
        Nutzung der App nachvollziehen zu können. Dabei werden insbesondere Seitenpfad,
        vollständige URL, Referrer, Seitentitel, Sprache, Zeitzone, Bildschirmgröße,
        Browser-/Betriebssysteminformationen, pseudonyme Besucher- und Sitzungskennungen
        sowie ein gehashter IP-Wert verarbeitet. Die Analyse erfolgt auf unserer eigenen
        Infrastruktur und nicht zu Werbezwecken.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse
        liegt im sicheren und wirtschaftlichen Betrieb der App. Sie können die
        Nutzungsanalyse für diesen Browser deaktivieren; außerdem respektiert die App
        die Browser-Einstellung „Do Not Track“, sofern sie gesetzt ist.
      </p>
      <p>
        In der iOS-App wird diese Nutzungsanalyse nur gesendet, wenn Sie sie in den
        Einstellungen ausdrücklich aktivieren. Sie können diese Einstellung dort
        jederzeit wieder deaktivieren.
      </p>
      <AnalyticsOptOut />

      <h2>8a. Google Analytics 4</h2>
      <p>
        Zusätzlich nutzen wir Google Analytics 4 (Google Ireland Limited, Gordon House,
        Barrow Street, Dublin 4, Irland) ausschließlich nach vorheriger Einwilligung.
        Ohne Einwilligung wird der Google-Analytics-Tag nicht geladen. Nach Zustimmung
        verarbeitet Google insbesondere Seitenaufrufe, technische Geräteinformationen,
        Referrer, ungefähre Standortdaten und pseudonyme Nutzungskennungen. Google Analytics
        speichert laut Google keine einzelnen IP-Adressen von EU-Nutzern.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG.
        Die Einwilligung kann durch Löschen der lokalen Browser-Auswahl oder über künftige
        Consent-Einstellungen widerrufen werden.
      </p>

      <h2>8b. GitHub</h2>
      <p>
        Der Quellcode wird über GitHub verwaltet und mit Vercel-Deployments verbunden.
        GitHub verarbeitet dabei insbesondere technische Account-, Repository- und
        Deployment-Metadaten, jedoch keine App-Inhaltsdaten aus der Supabase-Datenbank.
      </p>

      <h2>9. Zahlungsdienstleister</h2>

      <h3>Stripe</h3>
      <p>
        Für die Zahlungsabwicklung nutzen wir Stripe (Stripe Payments Europe, Ltd.,
        1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland).
        Bei der Zahlung werden Ihre Zahlungsdaten direkt an Stripe übermittelt.
        Wir speichern <strong>keine</strong> Kreditkartennummern oder Bankdaten.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
      </p>
      <p>
        Datenschutzerklärung von Stripe:{' '}
        <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">
          https://stripe.com/de/privacy
        </a>
      </p>

      <h2>10. Speicherdauer</h2>
      <p>
        Ihre Gesundheitsdaten werden gespeichert, solange Ihr Benutzerkonto besteht.
        Bei Löschung Ihres Kontos werden alle personenbezogenen Daten einschließlich
        Temperatureinträge und Periodendaten unwiderruflich gelöscht.
      </p>
      <p>
        Steuer- und handelsrechtliche Aufbewahrungspflichten (z.B. für Rechnungsdaten)
        bleiben hiervon unberührt (Aufbewahrungsfrist: bis zu 10 Jahre).
      </p>

      <h2>11. Beschwerderecht bei der Aufsichtsbehörde</h2>
      <p>
        Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten
        gegen die DSGVO verstößt, haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
        zu beschweren. Sie können sich insbesondere an die Aufsichtsbehörde Ihres Wohnsitzes,
        Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes wenden.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Stand: {LEGAL_LAST_UPDATED}
      </p>
    </>
  );
}
