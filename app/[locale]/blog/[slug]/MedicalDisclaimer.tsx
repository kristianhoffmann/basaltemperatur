// app/[locale]/blog/[slug]/MedicalDisclaimer.tsx
//
// Zyklus-, Eisprung- und NFP-Inhalte sind YMYL-Themen. Der Hinweis stand bisher nur
// in /llms.txt, nicht auf den Artikelseiten selbst — die Formulierung ist von dort
// uebernommen, damit beide Quellen dieselbe Aussage treffen.

import Link from 'next/link'

export function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Medizinischer Hinweis"
      className="mt-12 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-5 py-4 text-sm leading-6 text-[var(--text-secondary)] sm:px-6"
    >
      <p className="font-semibold text-[var(--text)]">Medizinischer Hinweis</p>
      <p className="mt-1.5">
        Dieser Artikel dient der Information zur Zyklusbeobachtung und ersetzt keine
        medizinische Beratung, Diagnose oder Behandlung. Die Basaltemperatur-App ist kein
        Verhütungsmittel und kein Medizinprodukt; sie bestimmt keine fruchtbaren Tage. Bei Kinderwunsch,
        Verhütungsfragen oder auffälligen Zyklusveränderungen wende dich bitte an deine
        Frauenärztin, deinen Frauenarzt oder eine zertifizierte NFP-Beratung.
      </p>
      {/* Transparency about how the text was produced (Art. 50 KI-VO; also an honest E-E-A-T signal). */}
      <p className="mt-2">
        Dieser Artikel wurde mit Unterstützung von KI-Werkzeugen erstellt und nennt seine Quellen.
        Redaktionell verantwortlich ist der im <Link href="/impressum" className="underline underline-offset-2">Impressum</Link> genannte Betreiber.
      </p>
    </aside>
  )
}
