export const LEGAL_LAST_UPDATED = '06. März 2026';

export type LegalCompany = {
  name: string;
  street: string;
  city: string;
  country: string;
  email: string;
  phone: string;
};

export type LegalInfrastructure = {
  webProvider: string;
  webLocation: string;
  dbProvider: string;
  dbLocation: string;
};

const COMPANY_FALLBACKS: LegalCompany = {
  name: '[Dein vollständiger Name]',
  street: '[Straße Hausnummer]',
  city: '[PLZ Stadt]',
  country: 'Deutschland',
  email: 'info@kristianhoffmann.de',
  phone: '',
};

const MISSING_COMPANY_FIELD_LABELS: Record<keyof Pick<LegalCompany, 'name' | 'street' | 'city' | 'email'>, string> = {
  name: 'Unternehmensname',
  street: 'Straße/Hausnummer',
  city: 'PLZ/Ort',
  email: 'E-Mail',
};

const isMissingLegalValue = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length === 0 || (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

export function getLegalCompany(): LegalCompany {
  return {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME?.trim() || COMPANY_FALLBACKS.name,
    street: process.env.NEXT_PUBLIC_COMPANY_STREET?.trim() || COMPANY_FALLBACKS.street,
    city: process.env.NEXT_PUBLIC_COMPANY_CITY?.trim() || COMPANY_FALLBACKS.city,
    country: process.env.NEXT_PUBLIC_COMPANY_COUNTRY?.trim() || COMPANY_FALLBACKS.country,
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL?.trim() || COMPANY_FALLBACKS.email,
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() || COMPANY_FALLBACKS.phone,
  };
}

export function getMissingCompanyFields(company: LegalCompany): string[] {
  const requiredFields: Array<keyof typeof MISSING_COMPANY_FIELD_LABELS> = ['name', 'street', 'city', 'email'];
  return requiredFields
    .filter((field) => isMissingLegalValue(company[field]))
    .map((field) => MISSING_COMPANY_FIELD_LABELS[field]);
}

export function getLegalInfrastructure(): LegalInfrastructure {
  return {
    webProvider: process.env.NEXT_PUBLIC_WEB_HOSTING_PROVIDER?.trim() || 'Strato AG',
    webLocation: process.env.NEXT_PUBLIC_WEB_HOSTING_LOCATION?.trim() || 'Deutschland',
    dbProvider: process.env.NEXT_PUBLIC_DB_PROVIDER?.trim() || 'Supabase',
    dbLocation: process.env.NEXT_PUBLIC_DB_LOCATION?.trim() || 'Frankfurt am Main, Deutschland',
  };
}
