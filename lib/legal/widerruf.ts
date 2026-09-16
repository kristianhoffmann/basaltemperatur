import type { LegalBlock } from './blocks'
import type { LegalCompany } from './config'

// Wording of Anlage 1 zu Art. 246a § 1 Abs. 2 S. 2 EGBGB (service contract with an
// online withdrawal function). Do not paraphrase: the statutory presumption of a
// correct notice only holds for the model text.
export function widerrufsbelehrungBlocks(company: LegalCompany): LegalBlock[] {
  const phone = company.phone ? `, Telefon: ${company.phone}` : ''
  return [
    { type: 'h2', text: 'Widerrufsrecht' },
    { type: 'p', text: 'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.' },
    { type: 'p', text: 'Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.' },
    { type: 'p', text: `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${company.name}, ${company.street}, ${company.city}${phone}, E-Mail: [${company.email}](mailto:${company.email})) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.` },
    { type: 'p', text: 'Sie können Ihr Widerrufsrecht auch online unter [www.basaltemperatur.online/widerruf-ausueben](/widerruf-ausueben) ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.' },
    { type: 'p', text: 'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.' },
    { type: 'h2', text: 'Folgen des Widerrufs' },
    { type: 'p', text: 'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.' },
    { type: 'p', text: 'Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.' },
    { type: 'p', tone: 'note', text: 'Ende der Widerrufsbelehrung' },
  ]
}

export function widerrufErlaeuterungBlocks(): LegalBlock[] {
  return [
    { type: 'h2', text: 'Erläuterungen (nicht Teil der Belehrung)' },
    { type: 'p', text: 'Mit dem Kauf schalten wir die Analyse-Funktionen dauerhaft in Ihrem Konto frei. Rechtlich ist das eine digitale Dienstleistung. Bei Dienstleistungen erlischt das Widerrufsrecht nach § 356 Abs. 5 BGB erst mit ihrer vollständigen Erbringung — bei einem dauerhaften Zugang tritt das innerhalb der vierzehn Tage nicht ein. **Ihr Widerrufsrecht bleibt deshalb für die vollen vierzehn Tage bestehen, auch wenn Sie die Analyse in dieser Zeit schon nutzen.**' },
    { type: 'p', text: 'Beim Kauf bestätigen Sie, dass die Freischaltung sofort beginnen soll. Widerrufen Sie, erstatten wir den Kaufpreis abzüglich des anteiligen Betrags für die Zeit, in der die Analyse bereits freigeschaltet war.' },
  ]
}

// Anlage 2 zu Art. 246a § 1 Abs. 2 S. 1 Nr. 1 EGBGB
export function musterWiderrufsformularBlocks(company: LegalCompany): LegalBlock[] {
  return [
    { type: 'h2', text: 'Muster-Widerrufsformular' },
    { type: 'p', tone: 'note', text: '(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)' },
    { type: 'form', lines: [
      `An ${company.name}, ${company.street}, ${company.city}, E-Mail: ${company.email}:`,
      'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*): Basaltemperatur – Freischaltung der Analyse (Lifetime-Zugang)',
      'Bestellt am (*)/erhalten am (*): _______________________',
      'Name des/der Verbraucher(s): _______________________',
      'Anschrift des/der Verbraucher(s): _______________________',
      'Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _______________________',
      'Datum: _______________________',
      '(*) Unzutreffendes streichen.',
    ] },
  ]
}
