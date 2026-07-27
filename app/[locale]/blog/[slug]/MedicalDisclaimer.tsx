// app/[locale]/blog/[slug]/MedicalDisclaimer.tsx
//
// Zyklus-, Eisprung- und NFP-Inhalte sind YMYL-Themen. Der Hinweis stand bisher nur
// in /llms.txt, nicht auf den Artikelseiten selbst — die Formulierung ist von dort
// uebernommen, damit beide Quellen dieselbe Aussage treffen.

export function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Medizinischer Hinweis"
      className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6"
    >
      <p className="font-semibold">Medizinischer Hinweis</p>
      <p className="mt-1.5">
        Dieser Artikel dient der Information zur Zyklusbeobachtung und ersetzt keine
        medizinische Beratung, Diagnose oder Behandlung. Die Basaltemperatur-App ist kein
        zertifiziertes Verhütungsmittel und kein Medizinprodukt. Bei Kinderwunsch,
        Verhütungsfragen oder auffälligen Zyklusveränderungen wende dich bitte an deine
        Frauenärztin, deinen Frauenarzt oder eine zertifizierte NFP-Beratung.
      </p>
    </aside>
  )
}
