// lib/blog-locales.ts
// Einzige Quelle der Wahrheit für gültige Blog-Locales.
//
// Wichtig: Die Prüfung muss in generateMetadata() passieren, nicht erst in der
// Page-Komponente. Next.js streamt die Antwort — sobald die Shell rausgeht, steht
// der Status-Code fest und ein späteres notFound() liefert noch 200.

export const BLOG_LOCALES = ['de'] as const

export type BlogLocale = (typeof BLOG_LOCALES)[number]

export function isBlogLocale(locale: string): locale is BlogLocale {
  return (BLOG_LOCALES as readonly string[]).includes(locale)
}
