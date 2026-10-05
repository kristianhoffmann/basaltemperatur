import { expect, test } from "vitest";
import { resolveBlogMetadata } from "./metadata-overrides";

const original: { locale: string; slug: string; expected: { title: string; meta_description: string }; proposed: { title?: string; meta_description?: string } } = {"locale":"de","slug":"nfp-app-kostenlos-vergleich","expected":{"title":"Zyklus-App kostenlos nutzen: Worauf du beim Vergleich achten solltest","meta_description":"Zyklus-App kostenlos finden: Erfahre, welche Grundfunktionen gratis sind, welche kostenpflichtig werden – und wie du die richtige App für deine Zyklusbeobachtung wählst."},"proposed":{"title":"Kostenlose Zyklus-App: Kriterien für den Vergleich","meta_description":"Kostenlose Zyklus-Apps vergleichen: Welche Grundfunktionen sind gratis, welche kostenpflichtig und worauf kommt es bei der Zyklusbeobachtung an?"}};
test("reviewed metadata is applied only to the unchanged article", () => {
  const result = resolveBlogMetadata(original.locale, original.slug, original.expected.title, original.expected.meta_description);
  expect(result).toEqual({ title: original.proposed.title ?? original.expected.title, description: original.proposed.meta_description ?? original.expected.meta_description });
});
test("new editorial content and unknown articles are preserved", () => {
  for (const [locale, slug, title, description] of [
    [original.locale, original.slug, "Revised headline", original.expected.meta_description],
    [original.locale, original.slug, original.expected.title, "Revised description"],
    ["other-locale", original.slug, original.expected.title, original.expected.meta_description],
    [original.locale, "unknown-article", original.expected.title, original.expected.meta_description],
  ]) {
    const result = resolveBlogMetadata(locale, slug, title, description);
    expect(result).toEqual( { title, description });
  }
});
