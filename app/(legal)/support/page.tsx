import { Metadata } from 'next'
import { getLegalCompany } from '@/app/(legal)/legalConfig'

export const metadata: Metadata = {
  title: 'Support – Basaltemperatur',
  description: 'Support und Kontakt fuer Basaltemperatur.',
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
        Wenn Sie Hilfe zu Konto, Eintraegen, Premium-Freischaltung, Datenexport oder
        Datenschutz brauchen, erreichen Sie uns per E-Mail.
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${company.email}`}>{company.email}</a>
      </p>

      <h2>Wichtiger Hinweis</h2>
      <p>
        Basaltemperatur ist ein persoenliches Zyklustagebuch mit rueckblickender
        Temperaturauswertung und statistischen Prognosen. Die App ist kein
        Medizinprodukt, kein Verhuetungsmittel und kein Diagnosewerkzeug.
      </p>
    </>
  )
}
