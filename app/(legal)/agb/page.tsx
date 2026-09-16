import { Metadata } from 'next';
import Link from 'next/link';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import {
  getLegalCompany,
  getLegalInfrastructure,
  getMissingCompanyFields,
  LEGAL_LAST_UPDATED,
} from '@/app/(legal)/legalConfig';

// ============================================================================
// ALLGEMEINE GESCHÄFTSBEDINGUNGEN
// Basaltemperatur App – kostenlose Basisnutzung, Analyse einmalig 9,99 €
// WICHTIG: Von einem Anwalt prüfen lassen vor Produktivbetrieb!
// ============================================================================

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Allgemeine Geschäftsbedingungen für die Basaltemperatur App',
  alternates: {
    canonical: '/agb',
  },
};

export default function AGBPage() {
  const company = getLegalCompany();
  const infrastructure = getLegalInfrastructure();
  const missingFields = getMissingCompanyFields(company);

  return (
    <>
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <LegalDataWarning missingFields={missingFields} />

      <h2>§ 1 Geltungsbereich und Anbieter</h2>
      <p>
        (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) gelten für alle Verträge
        zwischen {company.name}, {company.street}, {company.city} (nachfolgend „Anbieter“) und
        den Nutzerinnen und Nutzern (nachfolgend „Kunde“) über die Nutzung der Webanwendung unter
        www.basaltemperatur.online und der iOS-App „Basaltemperatur“ (zusammen „App“).
      </p>
      <p>
        (2) Abweichende Bedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn,
        der Anbieter stimmt ihrer Geltung ausdrücklich zu.
      </p>
      <p>
        (3) Die App richtet sich an Verbraucher im Sinne des § 13 BGB. Die Nutzung ist Personen
        ab 16 Jahren gestattet.
      </p>

      <h2>§ 2 Leistungen</h2>
      <p>
        (1) <strong>Kostenlose Basisnutzung:</strong> Nach der Registrierung kann der Kunde
        kostenlos Basaltemperaturwerte und Periodentage eintragen, bearbeiten und ansehen.
      </p>
      <p>
        (2) <strong>Kostenpflichtige Freischaltung („Analyse“):</strong> Gegen eine einmalige
        Zahlung erhält der Kunde Zugang zu den auf der Website beschriebenen erweiterten
        Funktionen, derzeit insbesondere rückblickende Auswertungen, Statistiken, Zyklus- und
        Periodenprognosen, Zyklusvergleich und Export.
      </p>
      <p>
        (3) <strong>Medizinischer Hinweis:</strong> Die App ist ein persönliches Zyklustagebuch
        zur Selbstbeobachtung. Sie ist <strong>kein</strong> Medizinprodukt im Sinne der
        Verordnung (EU) 2017/745 (MDR), kein Verhütungsmittel und kein Diagnosewerkzeug.
        Rückblickende Auswertungen und Prognosen, etwa zu Zyklusphasen und zum Periodenbeginn,
        sind statistische Schätzungen und können individuell abweichen. Sie sind nicht zur
        Verhütung und nicht als Grundlage medizinischer Entscheidungen bestimmt; dafür ist
        ärztlicher Rat einzuholen.
      </p>
      <p>
        (4) Der Anbieter stellt die App mit einer angestrebten Verfügbarkeit von 99 % im
        Jahresmittel bereit. Ausgenommen sind angekündigte Wartungsarbeiten und Störungen, die
        außerhalb seines Einflussbereichs liegen. Der Anbieter führt regelmäßige Datensicherungen
        durch.
      </p>
      <p>
        (5) Der Anbieter darf die App ändern, wenn dafür ein triftiger Grund besteht, etwa die
        Anpassung an eine neue technische Umgebung, an gesetzliche Vorgaben oder aus
        Sicherheitsgründen, dem Kunden dadurch keine zusätzlichen Kosten entstehen und er klar
        und verständlich über die Änderung informiert wird. Beeinträchtigt eine Änderung die
        Nutzbarkeit der bezahlten Funktionen mehr als nur unerheblich, stehen dem Kunden die
        Rechte aus § 327r BGB zu.
      </p>

      <h2>§ 3 Registrierung (kostenloser Nutzungsvertrag)</h2>
      <p>
        (1) Die Darstellung der App auf der Website ist kein rechtlich bindendes Angebot.
      </p>
      <p>
        (2) Der Kunde füllt das Registrierungsformular aus, akzeptiert diese AGB und gibt mit
        Klick auf „Registrieren“ ein Angebot auf Abschluss eines kostenlosen Nutzungsvertrags
        ab. Vor dem Absenden kann er seine Eingaben jederzeit im Formular prüfen und
        korrigieren. Der Vertrag kommt zustande, sobald das Konto angelegt ist und der Kunde
        Zugriff darauf erhält.
      </p>
      <p>
        (3) Die Verarbeitung von Gesundheitsdaten erfolgt nur mit einer gesonderten,
        ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO. Der Kunde kann sie
        jederzeit in den Einstellungen widerrufen; ohne Einwilligung können keine neuen
        Einträge gespeichert werden. Einzelheiten stehen in der{' '}
        <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      <p>
        (4) Der Kunde macht bei der Registrierung wahrheitsgemäße Angaben, hält seine
        Zugangsdaten geheim und gibt sein Konto nicht an Dritte weiter.
      </p>

      <h2>§ 4 Kauf der Analyse</h2>
      <p>
        (1) <strong>Kauf in der Webanwendung:</strong> Der Kunde wählt im eingeloggten Bereich
        „Jetzt kaufen“, bestätigt, dass die Freischaltung sofort beginnen soll, und wird zur
        Zahlungsseite des Zahlungsdienstleisters Stripe weitergeleitet. Dort wählt er eine der
        angebotenen Zahlungsarten und kann seine Angaben vor dem Absenden prüfen und
        korrigieren oder den Vorgang abbrechen. Mit Klick auf die Schaltfläche „Bezahlen“ gibt
        der Kunde ein verbindliches Angebot ab. Der Vertrag kommt zustande, sobald die Zahlung
        bestätigt ist; die Freischaltung erfolgt unmittelbar danach.
      </p>
      <p>
        (2) <strong>Kauf in der iOS-App:</strong> Käufe in der iOS-App werden über den App Store
        von Apple abgewickelt. Für Bezahlung, Belege und Erstattungen gelten zusätzlich die
        Bedingungen von Apple; Erstattungen und Widerrufe von App-Store-Käufen laufen über
        Apple.
      </p>
      <p>
        (3) Der Preis beträgt <strong>einmalig 9,99 €</strong>. Es handelt sich um einen
        Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen. Es
        entstehen keine wiederkehrenden Kosten und es wird kein Abonnement abgeschlossen.
      </p>
      <p>
        (4) Nach erfolgreicher Zahlung erhält der Kunde zeitlich unbegrenzten Zugang zu den
        freigeschalteten Funktionen einschließlich künftiger Updates („Lifetime-Zugang“). Die
        Freischaltung ist an das Konto gebunden, mit dem gekauft wurde.
      </p>
      <p>
        (5) Der Anbieter speichert den Vertragstext nicht gesondert. Die jeweils geltenden AGB
        sind jederzeit unter <Link href="/agb">www.basaltemperatur.online/agb</Link> abrufbar
        und können gespeichert und ausgedruckt werden. Vertragssprache ist Deutsch.
      </p>

      <h2>§ 5 Widerrufsrecht</h2>
      <p>
        (1) Verbrauchern steht beim Kauf der Analyse ein Widerrufsrecht zu. Einzelheiten
        regelt die <Link href="/widerruf">Widerrufsbelehrung</Link>. Der Widerruf kann
        jederzeit online unter <Link href="/widerruf-ausueben">Vertrag widerrufen</Link>{' '}
        erklärt werden.
      </p>
      <p>
        (2) Die Widerrufsfrist beträgt vierzehn Tage ab Vertragsschluss und bleibt auch dann
        bestehen, wenn der Kunde die Analyse in dieser Zeit bereits nutzt. Hat der Kunde
        verlangt, dass die Freischaltung vor Ablauf der Widerrufsfrist beginnt, schuldet er bei
        einem Widerruf einen angemessenen Betrag für den bis dahin bereitgestellten Zeitraum
        (§ 357a Abs. 2 BGB).
      </p>

      <h2>§ 6 Pflichten des Kunden</h2>
      <p>(1) Der Kunde verpflichtet sich,</p>
      <ul>
        <li>die App nur im Rahmen der geltenden Gesetze zu nutzen,</li>
        <li>keine rechtswidrigen oder schädlichen Inhalte einzustellen,</li>
        <li>die Sicherheit der App nicht zu gefährden und</li>
        <li>keine automatisierten Abfragen oder Bots einzusetzen.</li>
      </ul>
      <p>
        (2) Bei erheblichen Verstößen darf der Anbieter den Zugang nach vorheriger Abmahnung
        sperren; bei schwerwiegenden Verstößen auch ohne Abmahnung.
      </p>

      <h2>§ 7 Datenschutz</h2>
      <p>
        (1) Der Anbieter verarbeitet personenbezogene Daten nach den gesetzlichen Bestimmungen.
        Einzelheiten stehen in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      <p>
        (2) Die eingegebenen Gesundheitsdaten werden auf der derzeitigen Infrastruktur
        gespeichert ({infrastructure.webProvider} / {infrastructure.dbProvider};
        Datenstandort: {infrastructure.webLocation} bzw. {infrastructure.dbLocation}).
      </p>

      <h2>§ 8 Nutzungsrechte</h2>
      <p>
        (1) Der Anbieter räumt dem Kunden ein einfaches, nicht übertragbares Recht zur
        persönlichen Nutzung der App ein.
      </p>
      <p>
        (2) Alle Rechte an der App, einschließlich Software, Design und Marken, verbleiben beim
        Anbieter. Der Kunde behält alle Rechte an seinen Einträgen und Daten.
      </p>

      <h2>§ 9 Gewährleistung</h2>
      <p>
        Es gelten die gesetzlichen Vorschriften über Mängel digitaler Produkte (§§ 327 ff.
        BGB), einschließlich der Pflicht zur Bereitstellung von Aktualisierungen.
      </p>

      <h2>§ 10 Haftung</h2>
      <p>
        (1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, für Schäden
        aus der Verletzung des Lebens, des Körpers oder der Gesundheit, nach dem
        Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.
      </p>
      <p>
        (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher
        Vertragspflichten, also solcher Pflichten, deren Erfüllung die ordnungsgemäße
        Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung der Kunde vertrauen
        darf. In diesem Fall ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden
        begrenzt.
      </p>
      <p>
        (3) Rückblickende Auswertungen und statistische Prognosen beruhen auf den Eingaben des
        Kunden; der Anbieter übernimmt keine Gewähr dafür, dass sie auf den individuellen
        Zyklus zutreffen (siehe § 2 Abs. 3). Absatz 1 bleibt unberührt.
      </p>
      <p>
        (4) Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der Erfüllungsgehilfen
        des Anbieters.
      </p>

      <h2>§ 11 Laufzeit, Kündigung und Konto-Löschung</h2>
      <p>
        (1) Der Nutzungsvertrag läuft auf unbestimmte Zeit. Der Kunde kann ihn jederzeit ohne
        Frist beenden, indem er sein Konto in den Einstellungen löscht oder die Löschung per
        E-Mail an <a href={`mailto:${company.email}`}>{company.email}</a> verlangt.
      </p>
      <p>
        (2) Das Recht beider Seiten zur außerordentlichen Kündigung aus wichtigem Grund bleibt
        unberührt.
      </p>
      <p>
        (3) Bei der Konto-Löschung werden alle personenbezogenen Daten einschließlich der
        Gesundheitsdaten unwiderruflich gelöscht, soweit keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen (etwa für Zahlungsbelege oder
        Widerrufserklärungen).
      </p>
      <p>
        (4) Mit der Löschung endet auch die Freischaltung. Eine Erstattung des Kaufpreises
        erfolgt nur im Rahmen des Widerrufsrechts oder gesetzlicher Ansprüche.
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <p>
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
        UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit ihnen dadurch nicht
        der Schutz entzogen wird, den die zwingenden Bestimmungen des Staates ihres
        gewöhnlichen Aufenthalts gewähren.
      </p>
      <p>
        (2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
        Wirksamkeit der übrigen Bestimmungen unberührt.
      </p>
      <p>
        (3) Die frühere EU-Plattform zur Online-Streitbeilegung (OS-Plattform) wurde zum
        <strong> 20. Juli 2025</strong> eingestellt (Verordnung (EU) 2024/3228). Der Anbieter
        ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Stand: {LEGAL_LAST_UPDATED}
      </p>
    </>
  );
}
