import { Metadata } from 'next';

// ============================================================================
// WIDERRUFSBELEHRUNG
// Pflicht nach § 312d BGB für Fernabsatzverträge
// Inkl. Muster-Widerrufsformular (Anlage 2 zu Art. 246a § 1 Abs. 2 EGBGB)
// ============================================================================

export const metadata: Metadata = {
    title: 'Widerrufsbelehrung – Basaltemperatur',
    description: 'Widerrufsbelehrung und Muster-Widerrufsformular',
};

export default function WiderrufPage() {
    const company = {
        name: process.env.NEXT_PUBLIC_COMPANY_NAME || '[Dein vollständiger Name]',
        street: process.env.NEXT_PUBLIC_COMPANY_STREET || '[Straße Hausnummer]',
        city: process.env.NEXT_PUBLIC_COMPANY_CITY || '[PLZ Stadt]',
        email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '[kontakt@basaltemperatur.app]',
    };

    return (
        <>
            <h1>Widerrufsbelehrung</h1>

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

            <h2>Besonderer Hinweis zum vorzeitigen Erlöschen des Widerrufsrechts</h2>
            <p>
                Das Widerrufsrecht erlischt bei einem Vertrag über die Lieferung von nicht auf
                einem körperlichen Datenträger befindlichen digitalen Inhalten, wenn der Anbieter
                mit der Ausführung des Vertrags begonnen hat, nachdem der Verbraucher
            </p>
            <ul>
                <li>
                    ausdrücklich zugestimmt hat, dass der Anbieter mit der Ausführung des Vertrags
                    vor Ablauf der Widerrufsfrist beginnt, und
                </li>
                <li>
                    seine Kenntnis davon bestätigt hat, dass er durch seine Zustimmung mit Beginn
                    der Ausführung des Vertrags sein Widerrufsrecht verliert.
                </li>
            </ul>

            <hr className="my-8" />

            <h2>Muster-Widerrufsformular</h2>
            <p className="text-sm text-gray-500 italic">
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
                <p className="text-sm text-gray-500">(*) Unzutreffendes streichen.</p>
            </div>

            <hr className="my-8" />
            <p className="text-sm text-gray-500">
                Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </p>
        </>
    );
}
