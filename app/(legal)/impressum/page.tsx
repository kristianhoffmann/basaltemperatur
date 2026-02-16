import { Metadata } from 'next';

// ============================================================================
// IMPRESSUM
// Pflichtangaben nach § 5 TMG / § 18 MStV
// Einzelunternehmer · Basaltemperatur App
// WICHTIG: Vor Produktivbetrieb echte Daten in .env.local eintragen!
// ============================================================================

export const metadata: Metadata = {
  title: 'Impressum – Basaltemperatur',
  description: 'Impressum und Anbieterkennzeichnung für die Basaltemperatur App',
};

export default function ImpressumPage() {
  const company = {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || '[Dein vollständiger Name]',
    street: process.env.NEXT_PUBLIC_COMPANY_STREET || '[Straße Hausnummer]',
    city: process.env.NEXT_PUBLIC_COMPANY_CITY || '[PLZ Stadt]',
    country: 'Deutschland',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '[kontakt@basaltemperatur.online]',
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
  };

  return (
    <>
      <h1>Impressum</h1>

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        {company.name}<br />
        {company.street}<br />
        {company.city}<br />
        {company.country}
      </p>

      <h2>Kontakt</h2>
      <p>
        {company.phone && <>{`Telefon: ${company.phone}`}<br /></>}
        E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {company.name}<br />
        {company.street}<br />
        {company.city}
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>

      <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Hinweis zu Gesundheitsinformationen</h2>
      <p>
        Die Basaltemperatur App ist ein persönliches Zyklustagebuch zur Selbstbeobachtung.
        Die App dient <strong>nicht</strong> als Medizinprodukt, Verhütungsmittel oder
        Diagnosewerkzeug. Sie ersetzt keine ärztliche Beratung oder Untersuchung.
      </p>
      <p>
        Algorithmenbasierte Vorhersagen (z.B. Eisprung-Erkennung, Zyklusprognosen) sind
        Schätzungen und können individuell abweichen. Für medizinische Entscheidungen
        konsultieren Sie bitte Ihre Ärztin oder Ihren Arzt.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
        nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
        Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
        Tätigkeit hinweisen.
      </p>
      <p>
        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
        allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
        erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
        Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
        entfernen.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
        dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
        der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
        Zustimmung des jeweiligen Autors bzw. Erstellers.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-500">
        Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
      </p>
    </>
  );
}
