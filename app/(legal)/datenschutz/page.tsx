import { Metadata } from 'next';
import Link from 'next/link';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { StatisticsConsentSettings } from '@/app/(legal)/StatisticsConsentSettings';
import {
  getLegalCompany,
  getLegalInfrastructure,
  getMissingCompanyFields,
  LEGAL_LAST_UPDATED,
} from '@/lib/legal/config';
import { TRAFFIC_RETENTION_MONTHS, WITHDRAWAL_RETENTION_YEARS } from '@/lib/retention';

// ============================================================================
// DATENSCHUTZERKLÄRUNG
// Besonderheit: Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO)
// Jede Verarbeitung hier muss es im Code geben und umgekehrt — beim Einbau eines
// neuen Dienstes, Cookies oder Speicher-Keys diese Seite mitziehen.
// ============================================================================

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Informationen zum Datenschutz und zur Verarbeitung Ihrer personenbezogenen Daten',
  alternates: {
    canonical: '/datenschutz',
  },
};

const STORAGE_ROWS: Array<[name: string, kind: string, purpose: string, basis: string, duration: string]> = [
  ['sb-…-auth-token', 'Cookie', 'Anmeldung und Sitzung', 'notwendig', 'bis zur Abmeldung bzw. Ablauf der Sitzung'],
  ['bt_statistics_consent_v2', 'Local Storage', 'speichert Ihre Auswahl zur Statistik', 'notwendig', 'bis Sie den Browser-Speicher löschen'],
  ['theme, notification-*, pwa-install-dismissed', 'Local Storage', 'Darstellung, selbst gewählte Erinnerungen, ausgeblendete Hinweise', 'notwendig', 'bis Sie den Browser-Speicher löschen'],
  ['Service-Worker-Cache', 'Cache Storage', 'schnelleres Laden und Offline-Seite', 'notwendig', 'bis zur nächsten App-Version'],
  ['bt_visitor_id', 'Local Storage', 'pseudonyme Besucherkennung der eigenen Statistik', 'Einwilligung', 'bis zum Widerruf oder Löschen des Browser-Speichers'],
  ['bt_session_id, bt_last_url', 'Session Storage', 'Sitzungskennung und vorherige Seite der eigenen Statistik', 'Einwilligung', 'bis zum Schließen des Tabs'],
  ['seo_autopilot_attribution', 'Cookie', 'merkt sich, über welchen Blogartikel Sie gekommen sind', 'Einwilligung', '30 Tage'],
  ['_ga, _ga_*', 'Cookie', 'Google Analytics', 'Einwilligung', 'bis zu 2 Jahre'],
];

export default function DatenschutzPage() {
  const company = getLegalCompany();
  const infrastructure = getLegalInfrastructure();
  const missingFields = getMissingCompanyFields(company);
  const mail = <a href={`mailto:${company.email}`}>{company.email}</a>;

  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <LegalDataWarning missingFields={missingFields} />

      <h2>1. Verantwortlicher</h2>
      <p>
        {company.name}<br />
        {company.street}<br />
        {company.city}<br />
        {company.country}<br />
        E-Mail: {mail}
      </p>
      <p>
        Ein Datenschutzbeauftragter ist nicht benannt, da keine gesetzliche Pflicht dazu besteht.
        Bei Fragen zum Datenschutz schreiben Sie uns einfach an die oben genannte Adresse.
      </p>

      <h2>2. Überblick</h2>
      <p>Bei der Nutzung von Website und App verarbeiten wir insbesondere:</p>
      <ul>
        <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse, Passwort-Hash, Zeitpunkte von Registrierung, Anmeldung und Einwilligungen</li>
        <li><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Basaltemperaturwerte, Periodendaten, Zyklusnotizen und daraus berechnete Auswertungen</li>
        <li><strong>Kaufdaten:</strong> Freischaltungsstatus, Zahlungsreferenz, Zeitpunkt Ihres Verlangens nach sofortigem Beginn</li>
        <li><strong>Technische Daten:</strong> IP-Adresse, Browser- und Geräteangaben, Zugriffszeiten (Server-Logs)</li>
        <li><strong>Statistikdaten</strong> – nur mit Ihrer Einwilligung, siehe Abschnitt 9</li>
      </ul>
      <p>
        Wir verwenden Ihre Daten, um die App bereitzustellen, Käufe abzuwickeln, den Betrieb
        abzusichern und – nur mit Einwilligung – die Nutzung auszuwerten. Wir verkaufen keine
        Daten und geben sie nicht zu Werbezwecken weiter. Eine automatisierte
        Entscheidungsfindung im Sinne von Art. 22 DSGVO findet nicht statt; Zyklusauswertungen
        und Prognosen sind rein rechnerische Anzeigen ohne rechtliche Wirkung für Sie.
      </p>

      <h2>3. Gesundheitsdaten (Art. 9 DSGVO)</h2>
      <p>
        Basaltemperatur, Periodendaten (Datum und Stärke der Blutung), Zyklusnotizen (z. B.
        Krankheit, Schlafstörungen) und die daraus berechneten Angaben (Temperaturanstiege,
        Zyklusphasen, Prognosen) sind Gesundheitsdaten. Wir verarbeiten sie ausschließlich auf
        Grundlage Ihrer <strong>ausdrücklichen Einwilligung</strong> nach Art. 9 Abs. 2 lit. a
        DSGVO, die Sie bei der Registrierung bzw. beim ersten Einrichten der App gesondert
        erteilen. Zeitpunkt und Fassung der Einwilligung speichern wir als Nachweis.
      </p>
      <p>
        Sie können die Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen – in den
        Einstellungen der App, durch Löschen Ihres Kontos oder per E-Mail. Danach können keine
        neuen Einträge mehr gespeichert werden. Ihre Gesundheitsdaten werden nur für die
        Funktionen der App verwendet und nicht an Dritte weitergegeben.
      </p>

      <h2>4. Hosting, Datenbank und Server-Logs</h2>
      <p>
        Website, App-Backend und Datenbank laufen bei <strong>{infrastructure.webProvider}</strong>{' '}
        ({infrastructure.webLocation}). Mit Hostinger besteht ein Vertrag zur
        Auftragsverarbeitung nach Art. 28 DSGVO. Die Datenbank betreiben wir selbst
        ({infrastructure.dbProvider}); Datenstandort: {infrastructure.dbLocation}.
      </p>
      <p>
        Bei jedem Aufruf speichert unser Webserver ein Zugriffsprotokoll mit vollständiger
        IP-Adresse, Datum und Uhrzeit, aufgerufener Adresse, Referrer, Browserkennung
        (User-Agent) und Statuscode. Das dient dem sicheren Betrieb, der Fehlersuche und der
        Erkennung von Missbrauch sowie automatisierter Zugriffe (z. B. Suchmaschinen- und
        KI-Crawler). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die Protokolle werden nach
        spätestens 90 Tagen automatisch gelöscht und nicht mit anderen Daten zusammengeführt.
      </p>

      <h2>5. Registrierung und Benutzerkonto</h2>
      <p>
        Für ein Konto benötigen wir Ihren Namen, Ihre E-Mail-Adresse und ein Passwort, das nur
        als kryptografischer Hash gespeichert wird. Ohne diese Angaben ist keine Nutzung
        möglich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Die Daten bleiben gespeichert,
        solange Ihr Konto besteht.
      </p>

      <h2>6. E-Mail-Versand (Brevo)</h2>
      <p>
        Kontobezogene E-Mails (z. B. Passwort zurücksetzen), die Vertragsbestätigung nach einem
        Kauf und die Eingangsbestätigung eines Widerrufs versenden wir über Brevo (Sendinblue SAS, 17 rue de Salneuve, 75017 Paris,
        Frankreich; deutsche Niederlassung: Brevo GmbH, Köpenicker Str. 126, 10179 Berlin).
        Dabei werden E-Mail-Adresse, Name, Inhalt der Nachricht sowie Versand- und
        Zustellinformationen verarbeitet. Brevo handelt als Auftragsverarbeiter nach Art. 28
        DSGVO. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, für die Vertragsbestätigung
        Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit § 312f BGB und für die Widerrufsbestätigung
        Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit § 356a BGB.
      </p>

      <h2>7. Kauf in der Webanwendung (Stripe)</h2>
      <p>
        Zahlungen in der Webanwendung wickelt Stripe ab (Stripe Payments Europe, Ltd.,
        1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland). Ihre
        Zahlungsdaten geben Sie direkt bei Stripe ein; wir speichern keine Kartennummern oder
        Bankdaten. An Stripe übermitteln wir Ihre E-Mail-Adresse, eine interne Nutzerkennung zur
        Zuordnung der Freischaltung, den Zeitpunkt, zu dem Sie den sofortigen Beginn verlangt
        haben, und – nur wenn Sie der Statistik zugestimmt haben – den Blogartikel, über den Sie
        gekommen sind. Für die Vertragsbestätigung per E-Mail erhalten wir von Stripe die dort
        angegebene E-Mail-Adresse und den Namen, die Bestellnummer, den Betrag und den Zeitpunkt
        der Zahlung. Stripe verarbeitet Zahlungsdaten zur Betrugsprävention und wegen
        gesetzlicher Pflichten auch in eigener Verantwortung und kann dabei Daten in die USA
        übermitteln (Stripe, Inc. ist nach dem EU-U.S. Data Privacy Framework zertifiziert).
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und c DSGVO. Kaufbelege bewahren wir nach
        § 147 AO und § 257 HGB bis zu 10 Jahre auf. Datenschutzerklärung von Stripe:{' '}
        <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">
          stripe.com/de/privacy
        </a>
      </p>

      <h2>8. iOS-App und Käufe über Apple</h2>
      <p>
        Käufe in der iOS-App laufen über den App Store von Apple (Apple Distribution
        International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irland), das dafür
        eigenverantwortlich handelt. Wir erhalten von Apple nur signierte Kaufinformationen
        (Transaktionskennung, Produkt, Kaufzeitpunkt, Status), um die Analyse freizuschalten –
        keine Zahlungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <p>
        Die iOS-App sendet Nutzungsstatistik (siehe Abschnitt 9) nur, wenn Sie das in den
        Einstellungen der App ausdrücklich einschalten; Sie können es dort jederzeit wieder
        ausschalten.
      </p>

      <h2 id="statistik">9. Statistik und Reichweitenmessung (nur mit Einwilligung)</h2>
      <p>
        Nur wenn Sie im Einwilligungsbanner „Statistik erlauben“ wählen, setzen wir die folgenden
        Verfahren ein. Ohne Einwilligung wird dafür nichts in Ihrem Browser gespeichert oder
        ausgelesen und nichts übertragen. Rechtsgrundlage ist § 25 Abs. 1 TDDDG in Verbindung
        mit Art. 6 Abs. 1 lit. a DSGVO.
      </p>
      <h3>Eigene Statistik</h3>
      <p>
        Auf unserem eigenen Server erfassen wir Seitenpfad und Adresse (ohne sensible
        Parameter), Seitentitel, Referrer, Kampagnenparameter, Sprache, Zeitzone, Bildschirm- und
        Fenstergröße, Farbschema, Verbindungstyp, Browser- und Geräteangaben, eine pseudonyme
        Besucher- und Sitzungskennung, bei angemeldeten Personen die Nutzerkennung sowie einen
        mit geheimem Schlüssel gebildeten Hashwert der IP-Adresse (die IP-Adresse selbst wird
        dafür nicht gespeichert). Die Einträge werden nach {TRAFFIC_RETENTION_MONTHS} Monaten
        gelöscht. Die Einstellung „Do Not Track“ Ihres Browsers wird zusätzlich beachtet.
      </p>
      <h3>Google Analytics 4</h3>
      <p>
        Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google
        verarbeitet Seitenaufrufe, Geräte- und Browserangaben, Referrer, ungefähre Standortdaten
        und pseudonyme Kennungen; Google Signals und Werbefunktionen sind deaktiviert. Dabei
        können Daten an Google LLC in den USA übermittelt werden; Google LLC ist nach dem
        EU-U.S. Data Privacy Framework zertifiziert (Art. 45 DSGVO). Daten auf Nutzer- und
        Ereignisebene werden in Google Analytics höchstens 14 Monate aufbewahrt.
        Datenschutzerklärung von Google:{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          policies.google.com/privacy
        </a>
      </p>
      <h3>Zuordnung von Käufen zu Blogartikeln</h3>
      <p>
        Wenn Sie über einen Blogartikel kommen, merkt sich ein Cookie für 30 Tage den Artikel und
        ggf. das Suchstichwort aus dem Link. Kaufen Sie in dieser Zeit, wird diese Angabe dem
        Kauf bei Stripe beigefügt, und unser Redaktionssystem (Abschnitt 10) erhält eine
        Zählmeldung ohne Personenbezug.
      </p>
      <h3>Einwilligung ändern oder widerrufen</h3>
      <p>
        Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen – hier
        oder über „Cookie-Einstellungen“ im Seitenfuß. Beim Widerruf löschen wir die genannten
        Kennungen und Cookies in Ihrem Browser.
      </p>
      <StatisticsConsentSettings />

      <h2>10. Blog und Redaktionssystem</h2>
      <p>
        Blogartikel und ihre Bilder stammen aus unserem Redaktionssystem „SEO Autopilot“, das wir
        selbst auf demselben Server in Deutschland betreiben. Die Bilder lädt Ihr Browser direkt
        von der Adresse supabase.seoautopilot.cloud; dabei werden technisch bedingt IP-Adresse,
        Browserkennung und die aufgerufene Seite übertragen und wie in Abschnitt 4 protokolliert.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Darstellung unserer Inhalte).
      </p>
      <p>
        Über dasselbe System verwalten wir unsere Apps. Dafür übermitteln wir für jedes Konto
        E-Mail-Adresse, Registrierungsdatum, letzte Anmeldung und Freischaltungsstatus, damit wir
        Support-Anfragen und Löschwünsche zentral bearbeiten können. Rechtsgrundlage ist Art. 6
        Abs. 1 lit. b und f DSGVO.
      </p>

      <h2>11. Widerruf eines Kaufs über die Online-Funktion</h2>
      <p>
        Wenn Sie unter <Link href="/widerruf-ausueben">Vertrag widerrufen</Link> einen Widerruf
        erklären, speichern wir Name, E-Mail-Adresse, Angaben zum Vertrag, Ihre Mitteilung,
        Datum und Uhrzeit des Eingangs, die Browserkennung sowie einen Hashwert der gekürzten
        IP-Adresse. Wir benötigen die Daten, um den Widerruf zu bearbeiten, Ihnen die gesetzlich
        vorgeschriebene Eingangsbestätigung per E-Mail zu senden (Abschnitt 6) und den Eingang
        nachweisen zu können. Rechtsgrundlage ist Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit
        § 356a BGB sowie Art. 6 Abs. 1 lit. f DSGVO. Die Daten werden
        {' '}{WITHDRAWAL_RETENTION_YEARS} Jahre nach Ende des Jahres ihres Eingangs gelöscht
        (Verjährungsfrist) und auch bei einer Konto-Löschung bis dahin aufbewahrt.
      </p>

      <h2>12. Kontakt per E-Mail</h2>
      <p>
        Wenn Sie uns schreiben, verarbeiten wir Ihre Angaben, um die Anfrage zu beantworten.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern es um Ihr Konto oder einen Kauf
        geht, sonst Art. 6 Abs. 1 lit. f DSGVO. Wir löschen die Nachrichten, wenn die Anfrage
        erledigt ist und keine Aufbewahrungspflichten bestehen.
      </p>

      <h2>13. Cookies und Speicher im Browser</h2>
      <p>
        Notwendige Einträge setzen wir auf Grundlage von § 25 Abs. 2 Nr. 2 TDDDG, weil die App
        sonst nicht funktioniert oder Ihre Auswahl nicht behält (Art. 6 Abs. 1 lit. b und f
        DSGVO). Alle übrigen Einträge setzen wir nur mit Ihrer Einwilligung (Abschnitt 9).
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2 pr-3 font-semibold">Name</th>
              <th className="py-2 pr-3 font-semibold">Art</th>
              <th className="py-2 pr-3 font-semibold">Zweck</th>
              <th className="py-2 pr-3 font-semibold">Grundlage</th>
              <th className="py-2 font-semibold">Dauer</th>
            </tr>
          </thead>
          <tbody>
            {STORAGE_ROWS.map(([name, kind, purpose, basis, duration]) => (
              <tr key={name} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-3 font-mono text-xs">{name}</td>
                <td className="py-2 pr-3">{kind}</td>
                <td className="py-2 pr-3">{purpose}</td>
                <td className="py-2 pr-3">{basis}</td>
                <td className="py-2">{duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>14. Empfänger und Drittländer</h2>
      <p>
        Personenbezogene Daten erhalten nur die in dieser Erklärung genannten Stellen: Hostinger
        und Brevo als Auftragsverarbeiter, Stripe und Apple in eigener Verantwortung für die
        Zahlungsabwicklung sowie – nur mit Einwilligung – Google. Eine Übermittlung in Drittländer
        erfolgt nur bei Stripe und Google in die USA, jeweils auf Grundlage des EU-U.S. Data
        Privacy Framework.
      </p>
      <p>
        Den Quellcode verwalten wir bei GitHub. Dorthin gelangen keine Daten aus Ihrem
        Benutzerkonto.
      </p>

      <h2>15. Speicherdauer im Überblick</h2>
      <ul>
        <li>Konto- und Gesundheitsdaten: bis zur Löschung Ihres Kontos, danach unwiderruflich gelöscht</li>
        <li>Server-Logs: höchstens 90 Tage</li>
        <li>Eigene Statistik: {TRAFFIC_RETENTION_MONTHS} Monate</li>
        <li>Widerrufserklärungen: {WITHDRAWAL_RETENTION_YEARS} Jahre nach Ende des Eingangsjahres</li>
        <li>Kaufbelege: bis zu 10 Jahre (§ 147 AO, § 257 HGB)</li>
      </ul>

      <h2>16. Ihre Rechte</h2>
      <ul>
        <li><strong>Auskunft (Art. 15 DSGVO)</strong> über Ihre gespeicherten Daten</li>
        <li><strong>Berichtigung (Art. 16 DSGVO)</strong> unrichtiger Daten</li>
        <li><strong>Löschung (Art. 17 DSGVO)</strong> – die Konto-Löschung ist direkt in den Einstellungen möglich</li>
        <li><strong>Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong></li>
        <li><strong>Datenübertragbarkeit (Art. 20 DSGVO)</strong> in einem maschinenlesbaren Format</li>
        <li><strong>Widerruf von Einwilligungen (Art. 7 Abs. 3 DSGVO)</strong> mit Wirkung für die Zukunft</li>
      </ul>
      <div className="my-4 rounded-lg border border-slate-300 bg-slate-50 p-4">
        <p className="!mt-0 font-semibold">Widerspruchsrecht (Art. 21 DSGVO)</p>
        <p className="!mb-0">
          Soweit wir Daten auf Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO)
          verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
          jederzeit widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir
          können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen überwiegen, oder
          die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von
          Rechtsansprüchen.
        </p>
      </div>
      <p>Zur Ausübung Ihrer Rechte genügt eine E-Mail an {mail}.</p>

      <h2>17. Beschwerderecht bei einer Aufsichtsbehörde</h2>
      <p>
        Sie können sich bei jeder Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem
        Mitgliedstaat Ihres Aufenthalts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes.
        Für uns zuständig ist die Landesbeauftragte für den Datenschutz Niedersachsen,
        Prinzenstraße 5, 30159 Hannover.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Stand: {LEGAL_LAST_UPDATED}
      </p>
    </>
  );
}
