import type { Metadata } from 'next';
import Link from 'next/link';
import { WithdrawalForm } from './WithdrawalForm';

export const metadata: Metadata = {
  title: 'Vertrag widerrufen',
  description:
    'Elektronische Widerrufsfunktion nach § 356a BGB: Vertrag online widerrufen und sofort eine Eingangsbestätigung erhalten.',
};

/**
 * Die Widerrufsfunktion muss waehrend der gesamten Frist erreichbar sein und
 * darf keinen Login voraussetzen (§ 356a Abs. 1 BGB). Sie liegt deshalb im
 * oeffentlichen (legal)-Bereich, nicht im Dashboard.
 */
export default function WiderrufAusuebenPage() {
  return (
    <>
      <h1>Vertrag widerrufen</h1>
      <p>
        Hier kannst du einen kostenpflichtigen Vertrag widerrufen — ohne Angabe von Gründen und ohne
        Login. Fülle das Formular aus und bestätige den Widerruf. Du erhältst eine
        Eingangsbestätigung mit Datum und Uhrzeit.
      </p>
      <p>
        Die Frist beträgt vierzehn Tage ab Vertragsabschluss. Zur Wahrung der Frist genügt es, dass
        du den Widerruf vor Fristablauf absendest. Einzelheiten stehen in der{' '}
        <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>
      <div className="mt-8 not-prose">
        <WithdrawalForm />
      </div>
    </>
  );
}
