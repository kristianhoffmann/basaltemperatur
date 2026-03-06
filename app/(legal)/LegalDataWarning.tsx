type LegalDataWarningProps = {
  missingFields: string[];
};

export function LegalDataWarning({ missingFields }: LegalDataWarningProps) {
  if (missingFields.length === 0) {
    return null;
  }

  return (
    <div className="my-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <strong>Rechtlicher Hinweis:</strong> Pflichtangaben sind noch unvollständig (
      {missingFields.join(', ')}). Bitte die `NEXT_PUBLIC_COMPANY_*` Variablen vor dem Livegang setzen.
    </div>
  );
}
