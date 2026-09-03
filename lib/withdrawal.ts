/**
 * Die elektronische Widerrufsfunktion nach § 356a BGB.
 *
 * Seit dem 19.06.2026 muss jeder Fernabsatzvertrag, der über eine
 * Online-Benutzeroberfläche mit Verbrauchern geschlossen wird, eine
 * Widerrufsfunktion anbieten: eine dauerhaft erreichbare, hervorgehoben
 * platzierte Schaltfläche „Vertrag widerrufen", ein Formular für Name,
 * Vertragsdaten und Kontaktdaten, eine Bestätigungsschaltfläche „Widerruf
 * bestätigen" und eine unverzügliche Eingangsbestaetigung auf einem dauerhaften
 * Datenträger, die INHALT, DATUM und UHRZEIT der Erklärung wiedergibt.
 *
 * Ohne sie verlängert sich die Widerrufsfrist auf zwölf Monate und 14 Tage
 * (§ 356 Abs. 4 BGB) und der Wertersatzanspruch entfällt — bei einem
 * Jahresabo also die volle Rückzahlung nach elf Monaten Nutzung.
 *
 * Bewusst ohne Importe: So laesst sich die Logik im blanken Node-Test-Runner
 * pruefen und unveraendert in die Schwesterprojekte uebernehmen.
 */

export type WithdrawalInput = {
  name: unknown;
  email: unknown;
  contractReference: unknown;
  contractDate: unknown;
  message: unknown;
};

export type WithdrawalDeclaration = {
  name: string;
  email: string;
  contractReference: string;
  contractDate: string | null;
  message: string | null;
};

export type WithdrawalField = keyof WithdrawalInput;

export type WithdrawalValidation =
  | { ok: true; declaration: WithdrawalDeclaration }
  | { ok: false; errors: Partial<Record<WithdrawalField, string>> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const WITHDRAWAL_LIMITS = Object.freeze({
  name: 120,
  email: 254,
  contractReference: 200,
  message: 2000,
});

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function multilineText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/[ \t]+/g, ' ') : '';
}

export function validateWithdrawal(input: WithdrawalInput): WithdrawalValidation {
  const errors: Partial<Record<WithdrawalField, string>> = {};

  const name = text(input.name);
  if (!name) errors.name = 'Bitte gib deinen Namen an.';
  else if (name.length > WITHDRAWAL_LIMITS.name) errors.name = 'Der Name ist zu lang.';

  const email = text(input.email).toLowerCase();
  if (!email) errors.email = 'Bitte gib deine E-Mail-Adresse an.';
  else if (!EMAIL_PATTERN.test(email) || email.length > WITHDRAWAL_LIMITS.email) {
    errors.email = 'Diese E-Mail-Adresse sieht nicht gültig aus.';
  }

  // § 356a Abs. 2 BGB verlangt Angaben zur Identifizierung des Vertrags. Die
  // Bestellnummer kennt nicht jeder auswendig; die beim Kauf verwendete
  // E-Mail-Adresse oder eine Beschreibung reicht deshalb ebenfalls aus.
  const contractReference = text(input.contractReference);
  if (!contractReference) errors.contractReference = 'Bitte gib an, welchen Vertrag du widerrufen möchtest.';
  else if (contractReference.length > WITHDRAWAL_LIMITS.contractReference) {
    errors.contractReference = 'Die Angabe ist zu lang.';
  }

  const rawDate = text(input.contractDate);
  let contractDate: string | null = null;
  if (rawDate) {
    if (!ISO_DATE_PATTERN.test(rawDate) || Number.isNaN(Date.parse(`${rawDate}T00:00:00Z`))) {
      errors.contractDate = 'Bitte gib das Datum im Format JJJJ-MM-TT an.';
    } else {
      contractDate = rawDate;
    }
  }

  const rawMessage = multilineText(input.message);
  let message: string | null = null;
  if (rawMessage) {
    if (rawMessage.length > WITHDRAWAL_LIMITS.message) errors.message = 'Die Nachricht ist zu lang.';
    else message = rawMessage;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, declaration: { name, email, contractReference, contractDate, message } };
}

/**
 * Zeitstempel in deutscher Ortszeit — mit Zeitzone im Klartext.
 *
 * Die Eingangsbestaetigung muss Datum UND Uhrzeit tragen. Eine Uhrzeit ohne
 * Zeitzone ist im Streitfall wertlos, wenn der Server in UTC laeuft und der
 * Widerruf um 23:40 Ortszeit eingeht.
 */
export function formatReceiptTimestamp(receivedAt: Date, timeZone = 'Europe/Berlin'): string {
  const date = new Intl.DateTimeFormat('de-DE', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(receivedAt);
  const time = new Intl.DateTimeFormat('de-DE', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(receivedAt);
  return `${date} um ${time} Uhr (${timeZone === 'Europe/Berlin' ? 'deutsche Zeit' : timeZone})`;
}

/**
 * Der Inhalt der Erklärung, so wie er in die Bestaetigung gehoert.
 *
 * § 356a Abs. 4 BGB verlangt die Wiedergabe des INHALTS — nicht nur eine
 * Empfangsquittung. Deshalb wird hier zurueckgespiegelt, was der Verbraucher
 * eingegeben hat, und nicht bloss "Ihr Widerruf ist eingegangen".
 */
export function formatDeclarationSummary(
  declaration: WithdrawalDeclaration,
  receivedAt: Date,
  timeZone = 'Europe/Berlin'
): string {
  const lines = [
    `Eingegangen am: ${formatReceiptTimestamp(receivedAt, timeZone)}`,
    `Name: ${declaration.name}`,
    `E-Mail: ${declaration.email}`,
    `Vertrag: ${declaration.contractReference}`,
  ];
  if (declaration.contractDate) lines.push(`Vertragsdatum: ${declaration.contractDate}`);
  if (declaration.message) lines.push(`Mitteilung: ${declaration.message}`);
  lines.push('Erklärung: Hiermit widerrufe ich den oben bezeichneten Vertrag.');
  return lines.join('\n');
}
