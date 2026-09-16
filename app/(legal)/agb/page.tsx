import { Metadata } from 'next';
import { LegalDataWarning } from '@/app/(legal)/LegalDataWarning';
import { LegalBlocks } from '@/components/legal/LegalBlocks';
import { agbBlocks } from '@/lib/legal/agb';
import {
  getLegalCompany,
  getLegalInfrastructure,
  getMissingCompanyFields,
  LEGAL_LAST_UPDATED,
} from '@/lib/legal/config';

// ============================================================================
// ALLGEMEINE GESCHÄFTSBEDINGUNGEN
// Wortlaut in lib/legal/agb.ts — dieselbe Quelle geht mit jeder Kaufbestätigung raus.
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
  const missingFields = getMissingCompanyFields(company);

  return (
    <>
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <LegalDataWarning missingFields={missingFields} />
      <LegalBlocks blocks={agbBlocks(company, getLegalInfrastructure())} />
      <hr className="my-8" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Stand: {LEGAL_LAST_UPDATED}
      </p>
    </>
  );
}
