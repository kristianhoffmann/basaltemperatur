type MetadataValues = { title: string; description: string };
type EditorialCorrection = {
  locale: string;
  slug: string;
  expected: { title: string; meta_description: string };
  proposed: { title?: string; meta_description?: string };
};

// Reviewed editorial corrections from the 2026-10-05 crawl. They are metadata-only;
// a changed published headline or summary invalidates the old correction.
const CORRECTIONS: EditorialCorrection[] = [
  {
    "locale": "de",
    "slug": "nfp-app-kostenlos-vergleich",
    "expected": {
      "title": "Zyklus-App kostenlos nutzen: Worauf du beim Vergleich achten solltest",
      "meta_description": "Zyklus-App kostenlos finden: Erfahre, welche Grundfunktionen gratis sind, welche kostenpflichtig werden – und wie du die richtige App für deine Zyklusbeobachtung wählst."
    },
    "proposed": {
      "title": "Kostenlose Zyklus-App: Kriterien für den Vergleich",
      "meta_description": "Kostenlose Zyklus-Apps vergleichen: Welche Grundfunktionen sind gratis, welche kostenpflichtig und worauf kommt es bei der Zyklusbeobachtung an?"
    }
  },
  {
    "locale": "de",
    "slug": "kostenlose-periode-tracking-app-48-monats-check",
    "expected": {
      "title": "Kostenlose Periode-Tracking-App: Der 48-Monats-Check vor dem Download",
      "meta_description": "Kostenlose Periode-Tracking-App prüfen: Vier Gratis-Modelle, 48-Monats-Rechnung, 20-Minuten-Check und 90-Tage-Test – plus die Stellen, an denen Gratis teuer wird."
    },
    "proposed": {
      "title": "Kostenlose Periode-Tracking-App: Der 48-Monats-Check",
      "meta_description": "Periode-Tracking-Apps prüfen: Vier Gratis-Modelle, Langzeitkosten über 48 Monate und praktische Tests vor dem Download und im Alltag vergleichen."
    }
  },
  {
    "locale": "de",
    "slug": "zyklus-app-vergleich-kriterien",
    "expected": {
      "title": "Zyklus-App Vergleich: Kriterien statt Rangliste",
      "meta_description": "Zyklus-Apps unterscheiden sich in Messmethode, Datenschutz und Auswertungstiefe. Erfahre, welche Kriterien beim Vergleich zählen und wie du die richtige App wählst."
    },
    "proposed": {
      "meta_description": "Zyklus-Apps nach Messmethode, Datenschutz und Auswertung vergleichen: Welche Kriterien helfen bei der Auswahl für deine Zyklusbeobachtung?"
    }
  },
  {
    "locale": "de",
    "slug": "ein-preis-fur-immer-zyklustracking",
    "expected": {
      "title": "Ein Preis für immer: Transparente Preisgestaltung beim Zyklustracking",
      "meta_description": "Einmalzahlung statt Abo: Wie transparente Preismodelle beim Zyklustracking funktionieren und wie Sie Langzeitkosten vergleichen."
    },
    "proposed": {
      "title": "Zyklustracking: Einmalzahlung und Langzeitkosten vergleichen"
    }
  }
];

export function resolveBlogMetadata(locale: string, slug: string, title: string, description: string): MetadataValues {
  const correction = CORRECTIONS.find((entry) => entry.locale === locale && entry.slug === slug);
  if (!correction || correction.expected.title !== title || correction.expected.meta_description !== description) {
    return { title, description };
  }
  return { title: correction.proposed.title ?? title, description: correction.proposed.meta_description ?? description };
}
