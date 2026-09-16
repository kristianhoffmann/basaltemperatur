import type { LegalBlock } from './blocks'
import type { LegalCompany, LegalInfrastructure } from './config'

export function agbBlocks(company: LegalCompany, infrastructure: LegalInfrastructure): LegalBlock[] {
  return [
    { type: 'h2', text: '§ 1 Geltungsbereich und Anbieter' },
    { type: 'p', text: `(1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) gelten für alle Verträge zwischen ${company.name}, ${company.street}, ${company.city} (nachfolgend „Anbieter“) und den Nutzerinnen und Nutzern (nachfolgend „Kunde“) über die Nutzung der Webanwendung unter www.basaltemperatur.online und der iOS-App „Basaltemperatur“ (zusammen „App“).` },
    { type: 'p', text: '(2) Abweichende Bedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich zu.' },
    { type: 'p', text: '(3) Die App richtet sich an Verbraucher im Sinne des § 13 BGB. Die Nutzung ist Personen ab 16 Jahren gestattet.' },

    { type: 'h2', text: '§ 2 Leistungen' },
    { type: 'p', text: '(1) **Kostenlose Basisnutzung:** Nach der Registrierung kann der Kunde kostenlos Basaltemperaturwerte und Periodentage eintragen, bearbeiten und ansehen.' },
    { type: 'p', text: '(2) **Kostenpflichtige Freischaltung („Analyse“):** Gegen eine einmalige Zahlung erhält der Kunde Zugang zu den auf der Website beschriebenen erweiterten Funktionen, derzeit insbesondere rückblickende Auswertungen, Statistiken, Zyklus- und Periodenprognosen, Zyklusvergleich und Export.' },
    { type: 'p', text: '(3) **Medizinischer Hinweis:** Die App ist ein persönliches Zyklustagebuch zur Selbstbeobachtung. Sie ist **kein** Medizinprodukt im Sinne der Verordnung (EU) 2017/745 (MDR), kein Verhütungsmittel und kein Diagnosewerkzeug. Rückblickende Auswertungen und Prognosen, etwa zu Zyklusphasen und zum Periodenbeginn, sind statistische Schätzungen und können individuell abweichen. Sie sind nicht zur Verhütung und nicht als Grundlage medizinischer Entscheidungen bestimmt; dafür ist ärztlicher Rat einzuholen.' },
    { type: 'p', text: '(4) Der Anbieter stellt die App mit einer angestrebten Verfügbarkeit von 99 % im Jahresmittel bereit. Ausgenommen sind angekündigte Wartungsarbeiten und Störungen, die außerhalb seines Einflussbereichs liegen. Der Anbieter führt regelmäßige Datensicherungen durch.' },
    { type: 'p', text: '(5) Der Anbieter darf die App ändern, wenn dafür ein triftiger Grund besteht, etwa die Anpassung an eine neue technische Umgebung, an gesetzliche Vorgaben oder aus Sicherheitsgründen, dem Kunden dadurch keine zusätzlichen Kosten entstehen und er klar und verständlich über die Änderung informiert wird. Beeinträchtigt eine Änderung die Nutzbarkeit der bezahlten Funktionen mehr als nur unerheblich, stehen dem Kunden die Rechte aus § 327r BGB zu.' },

    { type: 'h2', text: '§ 3 Registrierung (kostenloser Nutzungsvertrag)' },
    { type: 'p', text: '(1) Die Darstellung der App auf der Website ist kein rechtlich bindendes Angebot.' },
    { type: 'p', text: '(2) Der Kunde füllt das Registrierungsformular aus, akzeptiert diese AGB und gibt mit Klick auf „Registrieren“ ein Angebot auf Abschluss eines kostenlosen Nutzungsvertrags ab. Vor dem Absenden kann er seine Eingaben jederzeit im Formular prüfen und korrigieren. Der Vertrag kommt zustande, sobald das Konto angelegt ist und der Kunde Zugriff darauf erhält.' },
    { type: 'p', text: '(3) Die Verarbeitung von Gesundheitsdaten erfolgt nur mit einer gesonderten, ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO. Der Kunde kann sie jederzeit in den Einstellungen widerrufen; ohne Einwilligung können keine neuen Einträge gespeichert werden. Einzelheiten stehen in der [Datenschutzerklärung](/datenschutz).' },
    { type: 'p', text: '(4) Der Kunde macht bei der Registrierung wahrheitsgemäße Angaben, hält seine Zugangsdaten geheim und gibt sein Konto nicht an Dritte weiter.' },

    { type: 'h2', text: '§ 4 Kauf der Analyse' },
    { type: 'p', text: '(1) **Kauf in der Webanwendung:** Der Kunde wählt im eingeloggten Bereich „Jetzt kaufen“, bestätigt, dass die Freischaltung sofort beginnen soll, und wird zur Zahlungsseite des Zahlungsdienstleisters Stripe weitergeleitet. Dort wählt er eine der angebotenen Zahlungsarten und kann seine Angaben vor dem Absenden prüfen und korrigieren oder den Vorgang abbrechen. Mit Klick auf die Schaltfläche „Bezahlen“ gibt der Kunde ein verbindliches Angebot ab. Der Vertrag kommt zustande, sobald die Zahlung bestätigt ist; die Freischaltung erfolgt unmittelbar danach.' },
    { type: 'p', text: '(2) **Kauf in der iOS-App:** Käufe in der iOS-App werden über den App Store von Apple abgewickelt. Für Bezahlung, Belege und Erstattungen gelten zusätzlich die Bedingungen von Apple; Erstattungen und Widerrufe von App-Store-Käufen laufen über Apple.' },
    { type: 'p', text: '(3) Der Preis beträgt **einmalig 9,99 €**. Es handelt sich um einen Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen. Es entstehen keine wiederkehrenden Kosten und es wird kein Abonnement abgeschlossen.' },
    { type: 'p', text: '(4) Nach erfolgreicher Zahlung erhält der Kunde zeitlich unbegrenzten Zugang zu den freigeschalteten Funktionen einschließlich künftiger Updates („Lifetime-Zugang“). Die Freischaltung ist an das Konto gebunden, mit dem gekauft wurde.' },
    { type: 'p', text: '(5) Nach einem Kauf in der Webanwendung erhält der Kunde per E-Mail eine Vertragsbestätigung mit dem Vertragsinhalt einschließlich dieser AGB und der Widerrufsbelehrung. Darüber hinaus speichert der Anbieter den Vertragstext nicht gesondert; die jeweils geltenden AGB sind jederzeit unter [www.basaltemperatur.online/agb](/agb) abrufbar und können gespeichert und ausgedruckt werden. Vertragssprache ist Deutsch.' },

    { type: 'h2', text: '§ 5 Widerrufsrecht' },
    { type: 'p', text: '(1) Verbrauchern steht beim Kauf der Analyse ein Widerrufsrecht zu. Einzelheiten regelt die [Widerrufsbelehrung](/widerruf). Der Widerruf kann jederzeit online unter [Vertrag widerrufen](/widerruf-ausueben) erklärt werden.' },
    { type: 'p', text: '(2) Die Widerrufsfrist beträgt vierzehn Tage ab Vertragsschluss und bleibt auch dann bestehen, wenn der Kunde die Analyse in dieser Zeit bereits nutzt. Hat der Kunde verlangt, dass die Freischaltung vor Ablauf der Widerrufsfrist beginnt, schuldet er bei einem Widerruf einen angemessenen Betrag für den bis dahin bereitgestellten Zeitraum (§ 357a Abs. 2 BGB).' },

    { type: 'h2', text: '§ 6 Pflichten des Kunden' },
    { type: 'p', text: '(1) Der Kunde verpflichtet sich,' },
    { type: 'ul', items: [
      'die App nur im Rahmen der geltenden Gesetze zu nutzen,',
      'keine rechtswidrigen oder schädlichen Inhalte einzustellen,',
      'die Sicherheit der App nicht zu gefährden und',
      'keine automatisierten Abfragen oder Bots einzusetzen.',
    ] },
    { type: 'p', text: '(2) Bei erheblichen Verstößen darf der Anbieter den Zugang nach vorheriger Abmahnung sperren; bei schwerwiegenden Verstößen auch ohne Abmahnung.' },

    { type: 'h2', text: '§ 7 Datenschutz' },
    { type: 'p', text: '(1) Der Anbieter verarbeitet personenbezogene Daten nach den gesetzlichen Bestimmungen. Einzelheiten stehen in der [Datenschutzerklärung](/datenschutz).' },
    { type: 'p', text: `(2) Die eingegebenen Gesundheitsdaten werden auf der derzeitigen Infrastruktur gespeichert (${infrastructure.webProvider} / ${infrastructure.dbProvider}; Datenstandort: ${infrastructure.webLocation} bzw. ${infrastructure.dbLocation}).` },

    { type: 'h2', text: '§ 8 Nutzungsrechte' },
    { type: 'p', text: '(1) Der Anbieter räumt dem Kunden ein einfaches, nicht übertragbares Recht zur persönlichen Nutzung der App ein.' },
    { type: 'p', text: '(2) Alle Rechte an der App, einschließlich Software, Design und Marken, verbleiben beim Anbieter. Der Kunde behält alle Rechte an seinen Einträgen und Daten.' },

    { type: 'h2', text: '§ 9 Gewährleistung' },
    { type: 'p', text: 'Es gelten die gesetzlichen Vorschriften über Mängel digitaler Produkte (§§ 327 ff. BGB), einschließlich der Pflicht zur Bereitstellung von Aktualisierungen.' },

    { type: 'h2', text: '§ 10 Haftung' },
    { type: 'p', text: '(1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.' },
    { type: 'p', text: '(2) Bei leichter Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher Vertragspflichten, also solcher Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung der Kunde vertrauen darf. In diesem Fall ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt.' },
    { type: 'p', text: '(3) Rückblickende Auswertungen und statistische Prognosen beruhen auf den Eingaben des Kunden; der Anbieter übernimmt keine Gewähr dafür, dass sie auf den individuellen Zyklus zutreffen (siehe § 2 Abs. 3). Absatz 1 bleibt unberührt.' },
    { type: 'p', text: '(4) Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der Erfüllungsgehilfen des Anbieters.' },

    { type: 'h2', text: '§ 11 Laufzeit, Kündigung und Konto-Löschung' },
    { type: 'p', text: `(1) Der Nutzungsvertrag läuft auf unbestimmte Zeit. Der Kunde kann ihn jederzeit ohne Frist beenden, indem er sein Konto in den Einstellungen löscht oder die Löschung per E-Mail an [${company.email}](mailto:${company.email}) verlangt.` },
    { type: 'p', text: '(2) Das Recht beider Seiten zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.' },
    { type: 'p', text: '(3) Bei der Konto-Löschung werden alle personenbezogenen Daten einschließlich der Gesundheitsdaten unwiderruflich gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen (etwa für Zahlungsbelege oder Widerrufserklärungen).' },
    { type: 'p', text: '(4) Mit der Löschung endet auch die Freischaltung. Eine Erstattung des Kaufpreises erfolgt nur im Rahmen des Widerrufsrechts oder gesetzlicher Ansprüche.' },

    { type: 'h2', text: '§ 12 Schlussbestimmungen' },
    { type: 'p', text: '(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit ihnen dadurch nicht der Schutz entzogen wird, den die zwingenden Bestimmungen des Staates ihres gewöhnlichen Aufenthalts gewähren.' },
    { type: 'p', text: '(2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.' },
    { type: 'p', text: '(3) Die frühere EU-Plattform zur Online-Streitbeilegung (OS-Plattform) wurde zum **20. Juli 2025** eingestellt (Verordnung (EU) 2024/3228). Der Anbieter ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.' },
  ]
}
