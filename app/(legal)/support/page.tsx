import { Metadata } from 'next'
import Link from 'next/link'
import { getLegalCompany } from '@/lib/legal/config'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Support und Kontakt für Basaltemperatur.',
  alternates: {
    canonical: '/support',
  },
}

export default function SupportPage() {
  const company = getLegalCompany()

  return (
    <>
      <h1>Support</h1>

      <p>
        Wenn Sie Hilfe zu Konto, Einträgen, der Freischaltung der Analyse, dem Datenexport oder
        dem Datenschutz brauchen, erreichen Sie uns per E-Mail.
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>

      <h2>Kauf widerrufen</h2>
      <p>
        Einen Kauf können Sie innerhalb von vierzehn Tagen ohne Angabe von Gründen widerrufen —
        am einfachsten online unter <Link href="/widerruf-ausueben">Vertrag widerrufen</Link>.
        Einzelheiten stehen in der <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>

      <h2>Wichtiger Hinweis</h2>
      <p>
        Basaltemperatur ist ein persönliches Zyklustagebuch mit rückblickender
        Temperaturauswertung und statistischen Prognosen. Die App ist kein
        Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug.
      </p>
    </>
  )
}
