import { Metadata } from 'next';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { LegalBlocks } from '@/components/legal/LegalBlocks';
import { getLegalCompany, getMissingCompanyFields, LEGAL_LAST_UPDATED } from '@/lib/legal/config';
import {
  musterWiderrufsformularBlocks,
  widerrufErlaeuterungBlocks,
  widerrufsbelehrungBlocks,
} from '@/lib/legal/widerruf';

// ============================================================================
// WIDERRUFSBELEHRUNG
// Pflicht nach § 312d BGB für Fernabsatzverträge. Wortlaut in lib/legal/widerruf.ts —
// dieselbe Quelle geht mit jeder Kaufbestätigung raus.
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

            <LegalBlocks
                blocks={[
                    ...widerrufsbelehrungBlocks(company),
                    { type: 'hr' },
                    ...widerrufErlaeuterungBlocks(),
                    { type: 'hr' },
                    ...musterWiderrufsformularBlocks(company),
                ]}
            />

            <hr className="my-8" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Stand: {LEGAL_LAST_UPDATED}
            </p>
        </>
    );
}
