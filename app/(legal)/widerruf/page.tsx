import { Metadata } from 'next';
import Link from 'next/link';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { getLegalCompany, getMissingCompanyFields, LEGAL_LAST_UPDATED } from '@/app/(legal)/legalConfig';

// ============================================================================
// WIDERRUFSBELEHRUNG
// Pflicht nach § 312d BGB für Fernabsatzverträge
// Wortlaut nach Anlage 1 zu Art. 246a § 1 Abs. 2 S. 2 EGBGB (Dienstleistung, mit
// elektronischer Widerrufsfunktion) — nicht umformulieren, sonst entfällt die
// Gesetzlichkeitsfiktion. Erläuterungen gehören unter die Belehrung.
// Muster-Widerrufsformular nach Anlage 2.
// ============================================================================

export const metadata: Metadata = {
    title: 'Widerrufsbelehrung',
    description: 'Widerrufsbelehrung und Muster-Widerrufsformular',
    alternates: {
        canonical: '/widerruf',
    },
};

export default function WiderrufPage() {
    const company = getLegalCompany();
    const missingFields = getMissingCompanyFields(company);

    return (
        <>
            <h1>Widerrufsbelehrung</h1>
            <LegalDataWarning missingFields={missingFields} />

            <p className="text-sm">
                Diese Belehrung gilt für den Kauf der Analyse in der Webanwendung unter
                www.basaltemperatur.online. Käufe in der iOS-App werden über Apple abgewickelt;
                dafür gelten die Widerrufs- und Erstattungsregeln von Apple.
            </p>

            <h2>Widerrufsrecht</h2>
            <p>
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag
                zu widerrufen.
            </p>
            <p>
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
            </p>
            <p>
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({company.name}, {company.street},{' '}
                {company.city}
                {company.phone && <>, Telefon: {company.phone}</>}, E-Mail:{' '}
                <a href={`mailto:${company.email}`}>{company.email}</a>) mittels einer eindeutigen
                Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren
                Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das
                beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
            </p>
            <p>
                Sie können Ihr Widerrufsrecht auch online unter{' '}
                <Link href="/widerruf-ausueben">www.basaltemperatur.online/widerruf-ausueben</Link>{' '}
                ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem
                dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine
                Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem
                Datum und der Uhrzeit ihres Eingangs.
            </p>
            <p>
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
                Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>

            <h2>Folgen des Widerrufs</h2>
            <p>
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
                Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der
                zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der
                Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben),
                unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem
                die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für
                diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
                ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
                ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
                Rückzahlung Entgelte berechnet.
            </p>
            <p>
                Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen
                soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis
                zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich
                dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum
                Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
            <p className="text-sm italic">Ende der Widerrufsbelehrung</p>

            <hr className="my-8" />

            <h2>Erläuterungen (nicht Teil der Belehrung)</h2>
            <p>
                Mit dem Kauf schalten wir die Analyse-Funktionen dauerhaft in Ihrem Konto frei.
                Rechtlich ist das eine digitale Dienstleistung. Bei Dienstleistungen erlischt das
                Widerrufsrecht nach § 356 Abs. 5 BGB erst mit ihrer vollständigen Erbringung — bei
                einem dauerhaften Zugang tritt das innerhalb der vierzehn Tage nicht ein.{' '}
                <strong>
                    Ihr Widerrufsrecht bleibt deshalb für die vollen vierzehn Tage bestehen, auch
                    wenn Sie die Analyse in dieser Zeit schon nutzen.
                </strong>
            </p>
            <p>
                Beim Kauf bestätigen Sie, dass die Freischaltung sofort beginnen soll. Widerrufen
                Sie, erstatten wir den Kaufpreis abzüglich des anteiligen Betrags für die Zeit, in
                der die Analyse bereits freigeschaltet war.
            </p>

            <hr className="my-8" />

            <h2>Muster-Widerrufsformular</h2>
            <p className="text-sm italic">
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus
                und senden Sie es zurück.)
            </p>

            <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <p>
                    An {company.name}, {company.street}, {company.city}, E-Mail: {company.email}:
                </p>
                <p>
                    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
                    über die Erbringung der folgenden Dienstleistung (*):
                    <br />
                    Basaltemperatur – Freischaltung der Analyse (Lifetime-Zugang)
                </p>
                <p>Bestellt am (*)/erhalten am (*): _______________________</p>
                <p>Name des/der Verbraucher(s): _______________________</p>
                <p>Anschrift des/der Verbraucher(s): _______________________</p>
                <p>
                    Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
                    _______________________
                </p>
                <p>Datum: _______________________</p>
                <p className="text-sm">(*) Unzutreffendes streichen.</p>
            </div>

            <hr className="my-8" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Stand: {LEGAL_LAST_UPDATED}
            </p>
        </>
    );
}
