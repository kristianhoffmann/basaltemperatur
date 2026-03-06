import { Metadata } from 'next';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { getLegalCompany, getMissingCompanyFields, LEGAL_LAST_UPDATED } from '@/app/(legal)/legalConfig';

// ============================================================================
// IMPRESSUM
// Pflichtangaben nach § 5 DDG / § 18 MStV
// Einzelunternehmer · Basaltemperatur App
// WICHTIG: Vor Produktivbetrieb echte Daten in .env.local eintragen!
// ============================================================================

export const metadata: Metadata = {
  title: 'Impressum – Basaltemperatur',
  description: 'Impressum und Anbieterkennzeichnung für die Basaltemperatur App',
  alternates: {
    canonical: '/impressum',
  },
};

export default function ImpressumPage() {
  const company = getLegalCompany();
  const missingFields = getMissingCompanyFields(company);

  return (
    <>
      <h1>Impressum</h1>
      <LegalDataWarning missingFields={missingFields} />

      <h2>Angaben gemäß § 5 DDG</h2>
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

      <h2>Hinweis zur Online-Streitbeilegung</h2>
      <p>
        Die frühere EU-Plattform zur Online-Streitbeilegung (OS-Plattform) wurde zum
        <strong> 20. Juli 2025</strong> eingestellt (Verordnung (EU) 2024/3228).
        Eine Streitbeilegung über diese Plattform ist daher nicht mehr möglich.
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
        Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen
        Gesetzen verantwortlich. Eine Verpflichtung zur Überwachung übermittelter oder
        gespeicherter fremder Informationen besteht nur im Rahmen der gesetzlichen Vorschriften.
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
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Stand: {LEGAL_LAST_UPDATED}
      </p>
    </>
  );
}
