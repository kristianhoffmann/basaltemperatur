import { Metadata } from 'next';
import Link from 'next/link';

// ============================================================================
// ALLGEMEINE GESCHÄFTSBEDINGUNGEN
// Basaltemperatur App – Einmalzahlung 9,99 € (Lifetime)
// WICHTIG: Von einem Anwalt prüfen lassen vor Produktivbetrieb!
// ============================================================================

export const metadata: Metadata = {
  title: 'AGB – Basaltemperatur',
  description: 'Allgemeine Geschäftsbedingungen für die Basaltemperatur App',
};

export default function AGBPage() {
  const company = {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || '[Dein vollständiger Name]',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '[kontakt@basaltemperatur.app]',
  };

  return (
    <>
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle
        Verträge, die zwischen {company.name} (nachfolgend „Anbieter") und der nutzenden
        Person (nachfolgend „Kunde") über die Nutzung der Web- und Mobilanwendung
        „Basaltemperatur" (nachfolgend „App") geschlossen werden.
      </p>
      <p>
        (2) Es gelten ausschließlich diese AGB. Abweichende Bedingungen des Kunden werden
        nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich
        schriftlich zu.
      </p>
      <p>
        (3) Der Kunde ist Verbraucher im Sinne des § 13 BGB, soweit der Zweck der Nutzung
        nicht seiner gewerblichen oder selbständigen beruflichen Tätigkeit zugerechnet
        werden kann.
      </p>

      <h2>§ 2 Vertragsgegenstand</h2>
      <p>
        (1) Gegenstand des Vertrages ist die Bereitstellung der Basaltemperatur App als
        webbasierte Anwendung (SaaS) und als iOS-App zur persönlichen Zyklusbeobachtung.
      </p>
      <p>
        (2) Die App ermöglicht die Aufzeichnung von Basaltemperaturwerten, die Dokumentation
        der Periodenblutung, die algorithmische Erkennung des Eisprungs sowie statistische
        Zyklusauswertungen.
      </p>
      <p>
        (3) <strong>Medizinischer Haftungsausschluss:</strong> Die App ist ein persönliches
        Zyklustagebuch zur Selbstbeobachtung. Sie ist <strong>kein</strong> Medizinprodukt
        im Sinne der EU-Verordnung 2017/745 (MDR), kein Verhütungsmittel und kein
        Diagnosewerkzeug. Algorithmische Vorhersagen (Eisprung-Erkennung, Zyklusprognosen)
        sind Schätzungen und können individuell abweichen. Für medizinische Entscheidungen
        ist ärztlicher Rat einzuholen.
      </p>

      <h2>§ 3 Vertragsschluss und Registrierung</h2>
      <p>
        (1) Der Vertrag kommt durch die Registrierung des Kunden in der App und die
        Bestätigung der E-Mail-Adresse zustande.
      </p>
      <p>
        (2) Mit der Registrierung bestätigt der Kunde, dass er die AGB und die{' '}
        <Link href="/datenschutz" className="text-primary-600 hover:underline">
          Datenschutzerklärung
        </Link>{' '}
        gelesen hat und diesen zustimmt.
      </p>
      <p>
        (3) Der Kunde erteilt bei der Registrierung eine ausdrückliche Einwilligung in die
        Verarbeitung seiner Gesundheitsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO.
      </p>
      <p>
        (4) Der Kunde muss bei der Registrierung wahrheitsgemäße Angaben machen und ist
        verpflichtet, seine Zugangsdaten geheim zu halten.
      </p>

      <h2>§ 4 Leistungen und Verfügbarkeit</h2>
      <p>
        (1) Der Anbieter stellt die App mit einer angestrebten Verfügbarkeit von 99 % im
        Jahresmittel bereit. Ausgenommen sind geplante Wartungsarbeiten, Störungen außerhalb
        des Einflussbereichs des Anbieters sowie technische Probleme auf Seiten des Kunden.
      </p>
      <p>
        (2) Der Anbieter ist berechtigt, die App weiterzuentwickeln und den Funktionsumfang
        zu erweitern oder anzupassen, soweit dies für den Kunden zumutbar ist.
      </p>
      <p>
        (3) Der Anbieter führt regelmäßige Datensicherungen durch. Dies entbindet den
        Kunden nicht von einer eigenen Sicherung seiner Daten.
      </p>

      <h2>§ 5 Vergütung</h2>
      <p>
        (1) Die Nutzung der App erfordert eine <strong>einmalige Zahlung von 9,99 €</strong>{' '}
        (inkl. gesetzl. MwSt.). Es handelt sich um eine Einmalzahlung – es entstehen
        keine wiederkehrenden Kosten oder Abonnements.
      </p>
      <p>
        (2) Nach erfolgreicher Zahlung erhält der Kunde zeitlich unbegrenzten Zugang zu
        allen Funktionen der App einschließlich zukünftiger Updates („Lifetime-Zugang").
      </p>
      <p>
        (3) Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Der Kunde wählt bei
        der Zahlung eine der angebotenen Zahlungsmethoden (Kreditkarte, SEPA-Lastschrift o.ä.).
      </p>

      <h2>§ 6 Widerrufsrecht für Verbraucher</h2>
      <p>
        (1) Verbraucher haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von Gründen
        diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des
        Vertragsschlusses.
      </p>
      <p>
        (2) Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({company.name}, E-Mail:{' '}
        <a href={`mailto:${company.email}`}>{company.email}</a>) mittels einer eindeutigen
        Erklärung (z.B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen,
        informieren. Sie können dafür das{' '}
        <Link href="/widerruf" className="text-primary-600 hover:underline">
          Muster-Widerrufsformular
        </Link>{' '}
        verwenden.
      </p>
      <p>
        (3) Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
        Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
      </p>
      <p>
        (4) Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen unverzüglich
        und spätestens binnen 14 Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
        Ihren Widerruf bei uns eingegangen ist.
      </p>
      <p>
        (5) <strong>Vorzeitiges Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht
        erlischt bei einem Vertrag über die Lieferung von digitalen Inhalten, die nicht auf
        einem körperlichen Datenträger geliefert werden, wenn der Anbieter mit der Ausführung
        des Vertrags begonnen hat, nachdem der Kunde ausdrücklich zugestimmt hat, dass der
        Anbieter mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnt, und
        der Kunde seine Kenntnis davon bestätigt hat, dass er durch seine Zustimmung mit
        Beginn der Ausführung des Vertrags sein Widerrufsrecht verliert (§ 356 Abs. 5 BGB).
      </p>

      <h2>§ 7 Pflichten des Kunden</h2>
      <p>(1) Der Kunde verpflichtet sich:</p>
      <ul>
        <li>Die App nur im Rahmen der geltenden Gesetze zu nutzen</li>
        <li>Keine rechtswidrigen oder schädlichen Inhalte einzustellen</li>
        <li>Die Sicherheit der App nicht zu gefährden</li>
        <li>Keine automatisierten Abfragen oder Bots einzusetzen</li>
      </ul>
      <p>
        (2) Bei Verstößen ist der Anbieter berechtigt, den Zugang zur App zu sperren.
      </p>

      <h2>§ 8 Datenschutz</h2>
      <p>
        (1) Der Anbieter verarbeitet personenbezogene Daten des Kunden gemäß den
        gesetzlichen Bestimmungen und der{' '}
        <Link href="/datenschutz" className="text-primary-600 hover:underline">
          Datenschutzerklärung
        </Link>.
      </p>
      <p>
        (2) Die bei der Nutzung der App eingegebenen Gesundheitsdaten werden auf Servern
        in <strong>Deutschland</strong> gespeichert (Strato VPS, Berlin; Supabase,
        Frankfurt am Main).
      </p>
      <p>
        (3) Der Kunde bleibt für die Richtigkeit der von ihm eingegebenen Daten
        verantwortlich.
      </p>

      <h2>§ 9 Nutzungsrechte</h2>
      <p>
        (1) Der Anbieter räumt dem Kunden ein einfaches, nicht übertragbares Recht zur
        persönlichen Nutzung der App ein.
      </p>
      <p>
        (2) Alle Rechte an der App, einschließlich Software, Design und Marken, verbleiben
        beim Anbieter.
      </p>
      <p>
        (3) Der Kunde behält alle Rechte an seinen Inhalten und Daten.
      </p>

      <h2>§ 10 Gewährleistung und Haftung</h2>
      <p>
        (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des
        Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
      </p>
      <p>
        (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher
        Vertragspflichten. Die Haftung ist auf den vorhersehbaren, typischerweise
        eintretenden Schaden begrenzt.
      </p>
      <p>
        (3) Eine Haftung für die <strong>Richtigkeit algorithmischer Vorhersagen</strong> (Eisprung,
        Zykluslänge, Fruchtbarkeitsfenster) ist ausgeschlossen. Diese dienen der
        Selbstbeobachtung und ersetzen keine medizinische Beratung.
      </p>

      <h2>§ 11 Konto-Löschung</h2>
      <p>
        (1) Da es sich um einen Lifetime-Zugang handelt, gibt es keine Vertragslaufzeit
        oder Kündigungsfrist.
      </p>
      <p>
        (2) Der Kunde kann sein Konto jederzeit über die Einstellungen in der App oder
        per E-Mail an {company.email} löschen lassen.
      </p>
      <p>
        (3) Bei Konto-Löschung werden alle personenbezogenen Daten einschließlich
        Gesundheitsdaten unwiderruflich gelöscht. Eine Erstattung des Kaufpreises
        erfolgt nicht (es sei denn, das Widerrufsrecht ist noch nicht erloschen).
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <p>
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
        UN-Kaufrechts.
      </p>
      <p>
        (2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so berührt
        dies nicht die Wirksamkeit der übrigen Bestimmungen.
      </p>
      <p>
        (3) Die EU-Kommission stellt eine Plattform für außergerichtliche Streitbeilegung
        bereit:{' '}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-500">
        Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
      </p>
    </>
  );
}
