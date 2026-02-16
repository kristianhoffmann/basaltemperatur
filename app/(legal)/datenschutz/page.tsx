import { Metadata } from 'next';

// ============================================================================
// DATENSCHUTZERKLÄRUNG
// DSGVO-konforme Datenschutzerklärung für Basaltemperatur App
// Besonderheit: Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO)
// Hosting: Strato VPS (DE) + Supabase (Frankfurt, DE)
// ============================================================================

export const metadata: Metadata = {
  title: 'Datenschutzerklärung – Basaltemperatur',
  description: 'Informationen zum Datenschutz und zur Verarbeitung Ihrer personenbezogenen Daten',
};

export default function DatenschutzPage() {
  const company = {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || '[Dein vollständiger Name]',
    street: process.env.NEXT_PUBLIC_COMPANY_STREET || '[Straße Hausnummer]',
    city: process.env.NEXT_PUBLIC_COMPANY_CITY || '[PLZ Stadt]',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '[kontakt@basaltemperatur.online]',
  };

  return (
    <>
      <h1>Datenschutzerklärung</h1>

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
        Kontaktdaten können Sie dem Abschnitt „Verantwortliche Stelle" in dieser
        Datenschutzerklärung entnehmen.
      </p>

      <p><strong>Welche Daten werden erfasst?</strong></p>
      <p>
        Bei der Nutzung dieser App werden insbesondere folgende Daten verarbeitet:
      </p>
      <ul>
        <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt)</li>
        <li><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Basaltemperaturwerte, Periodendaten (Datum, Stärke), Zyklusnotizen</li>
        <li><strong>Nutzungsdaten:</strong> Zykluseinstellungen, Profilpräferenzen</li>
        <li><strong>Technische Daten:</strong> IP-Adresse, Browsertyp, Zugriffszeiten (Server-Logs)</li>
      </ul>

      <p><strong>Wofür nutzen wir Ihre Daten?</strong></p>
      <p>
        Ihre Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet:
        Temperaturkurve, Eisprung-Erkennung, Zyklusstatistiken und Periodenvorhersagen.
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
        <li>Daraus abgeleitete Informationen (Eisprungdatum, Zyklusphase, Fruchtbarkeitsfenster)</li>
      </ul>
      <p>
        Die Verarbeitung erfolgt ausschließlich auf Grundlage Ihrer <strong>ausdrücklichen
          Einwilligung</strong> gemäß Art. 9 Abs. 2 lit. a DSGVO, die Sie bei der Registrierung
        erteilen. Sie können diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen,
        indem Sie Ihr Konto löschen oder uns per E-Mail kontaktieren.
      </p>

      <h2>3. Hosting und Datenspeicherung</h2>

      <h3>Webserver (Strato)</h3>
      <p>
        Die Web-App wird auf einem VPS-Server der Strato AG, Otto-Ostrowski-Straße 7,
        10249 Berlin, Deutschland, gehostet. Alle Daten verbleiben auf Servern in
        <strong> Deutschland</strong>.
      </p>
      <p>
        Beim Zugriff auf die Website werden automatisch technische Daten in Server-Log-Dateien
        erfasst (IP-Adresse, Browsertyp, Zugriffszeit). Diese Daten werden nicht mit anderen
        Datenquellen zusammengeführt.
      </p>

      <h3>Datenbank (Supabase)</h3>
      <p>
        Ihre Nutzerdaten (Registrierung, Temperatureinträge, Periodendaten) werden in einer
        Supabase-Datenbank gespeichert. Der Datenbankserver befindet sich in
        <strong> Frankfurt am Main, Deutschland</strong> (AWS eu-central-1).
      </p>
      <p>
        Supabase Inc. (USA) ist der Technologieanbieter. Für die Datenverarbeitung in der
        EU-Region gelten die EU-Standardvertragsklauseln. Ihre Gesundheitsdaten verlassen
        zu keinem Zeitpunkt die EU.
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
        <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen. Die Konto-Löschung ist direkt in der App unter „Einstellungen" möglich.</li>
        <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
        <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem maschinenlesbaren Format erhalten.</li>
        <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen.</li>
        <li><strong>Widerruf der Einwilligung:</strong> Die Einwilligung zur Verarbeitung von Gesundheitsdaten kann jederzeit widerrufen werden.</li>
      </ul>
      <p>
        Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>

      <h2>5. Verantwortliche Stelle</h2>
      <p>Die verantwortliche Stelle für die Datenverarbeitung ist:</p>
      <p>
        {company.name}<br />
        {company.street}<br />
        {company.city}
      </p>
      <p>
        E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>

      <h2>6. Registrierung und Benutzerkonto</h2>
      <p>
        Bei der Registrierung erheben wir Ihren Namen, Ihre E-Mail-Adresse und ein
        selbstgewähltes Passwort. Das Passwort wird ausschließlich als kryptografischer
        Hash gespeichert (bcrypt). Wir haben keinen Zugriff auf Ihr Klartext-Passwort.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Die App verwendet ausschließlich <strong>technisch notwendige Cookies</strong> für
        die Session-Verwaltung (Anmeldestatus). Es werden keine Tracking-Cookies,
        Analyse-Tools oder Werbe-Cookies eingesetzt.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
        technischen Funktionsfähigkeit).
      </p>

      <h2>8. Zahlungsdienstleister</h2>

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

      <h2>9. Speicherdauer</h2>
      <p>
        Ihre Gesundheitsdaten werden gespeichert, solange Ihr Benutzerkonto besteht.
        Bei Löschung Ihres Kontos werden alle personenbezogenen Daten einschließlich
        Temperatureinträge und Periodendaten unwiderruflich gelöscht.
      </p>
      <p>
        Steuer- und handelsrechtliche Aufbewahrungspflichten (z.B. für Rechnungsdaten)
        bleiben hiervon unberührt (Aufbewahrungsfrist: bis zu 10 Jahre).
      </p>

      <h2>10. Beschwerderecht bei der Aufsichtsbehörde</h2>
      <p>
        Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten
        gegen die DSGVO verstößt, haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
        zu beschweren. Sie können sich insbesondere an die Aufsichtsbehörde Ihres Wohnsitzes,
        Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes wenden.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-500">
        Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
      </p>
    </>
  );
}
