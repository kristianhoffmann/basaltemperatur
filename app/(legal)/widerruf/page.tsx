import { Metadata } from 'next';
import Link from 'next/link';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { getLegalCompany, getMissingCompanyFields, LEGAL_LAST_UPDATED } from '@/app/(legal)/legalConfig';

// ============================================================================
// WIDERRUFSBELEHRUNG
// Pflicht nach § 312d BGB für Fernabsatzverträge
// Inkl. Muster-Widerrufsformular (Anlage 2 zu Art. 246a § 1 Abs. 2 EGBGB)
// ============================================================================

export const metadata: Metadata = {
    title: 'Widerrufsbelehrung – Basaltemperatur',
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

            <h2>Widerrufsrecht</h2>
            <p>
                Sie haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von Gründen
                diesen Vertrag zu widerrufen.
            </p>
            <p>
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p>
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
            </p>
            <p>
                {company.name}<br />
                {company.street}<br />
                {company.city}<br />
                E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
            <p>
                mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief
                oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
                Sie können dafür das nachfolgende Muster-Widerrufsformular verwenden, das jedoch
                nicht vorgeschrieben ist.
            </p>
            <p>
                Sie können Ihr Widerrufsrecht auch online unter{' '}
                <Link href="/widerruf-ausueben">www.basaltemperatur.online/widerruf-ausueben</Link>{' '}
                ausüben. Wir bestätigen den Eingang unverzüglich auf einem dauerhaften Datenträger.
            </p>
            <p>
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
                Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>

            <h2>Folgen des Widerrufs</h2>
            <p>
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
                Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
                zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
                eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das
                Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
                wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen
                dieser Rückzahlung Entgelte berechnet.
            </p>

            <h2>Vorzeitiger Beginn und Wertersatz</h2>
            <p>
                Wir stellen Ihnen laufend einen Zugang bereit, in dem Sie Ihre Zyklusdaten
                speichern und auswerten. Rechtlich ist das eine digitale Dienstleistung. Bei
                Dienstleistungen erlischt das Widerrufsrecht nach § 356 Abs. 5 BGB erst mit der{' '}
                <strong>vollständigen Erbringung</strong> der Leistung — bei einem dauerhaften
                Zugang tritt das innerhalb der vierzehn Tage nicht ein.
            </p>
            <p>
                <strong>
                    Ihr Widerrufsrecht bleibt deshalb für die vollen vierzehn Tage bestehen — auch
                    dann, wenn Sie die App in dieser Zeit bereits genutzt haben.
                </strong>
            </p>
            <p>
                Haben Sie beim Kauf ausdrücklich verlangt, dass wir vor Ablauf der Widerrufsfrist
                mit der Leistung beginnen, so schulden Sie uns bei einem Widerruf einen anteiligen
                Betrag für den bis dahin bereitgestellten Zeitraum (§ 357a BGB). Den Rest erstatten
                wir Ihnen.
            </p>

            <hr className="my-8" />

            <h2>Muster-Widerrufsformular</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular
                aus und senden Sie es zurück.)
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 my-4">
                <p>An:</p>
                <p>
                    {company.name}<br />
                    {company.street}<br />
                    {company.city}<br />
                    E-Mail: {company.email}
                </p>
                <br />
                <p>
                    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
                    über die Erbringung der folgenden Dienstleistung:
                </p>
                <br />
                <p><strong>Basaltemperatur App – Lifetime-Zugang</strong></p>
                <br />
                <p>Bestellt am (*) / erhalten am (*):</p>
                <p>_______________________________________________</p>
                <br />
                <p>Name des/der Verbraucher(s):</p>
                <p>_______________________________________________</p>
                <br />
                <p>Anschrift des/der Verbraucher(s):</p>
                <p>_______________________________________________</p>
                <br />
                <p>Datum:</p>
                <p>_______________________________________________</p>
                <br />
                <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
                <p>_______________________________________________</p>
                <br />
                <p className="text-sm text-gray-600 dark:text-gray-300">(*) Unzutreffendes streichen.</p>
            </div>

            <hr className="my-8" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Stand: {LEGAL_LAST_UPDATED}
            </p>
        </>
    );
}
