import type { BlogPostSummary } from '@/app/[locale]/blog/posts'
import { authorPath, blogUrl, topicPath } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BLOG_TOPICS } from './discovery'

const line = (value: string) => value.replace(/[\r\n\[\]<>]/g, ' ').trim()

export function renderLlms(posts: BlogPostSummary[]) {
  const site = getSeoSiteUrl()
  const authors = [...new Set(posts.flatMap((post) => post.author?.name ? [post.author.name] : []))]
  return `# Basaltemperatur
> Persönliches Zyklustagebuch zur Selbstbeobachtung. Basaltemperatur und Periode kostenlos erfassen; Analyse einmalig für 9,99 € (kein Abo).

## Produkt
- [Startseite](${site}/): Temperaturkurven, Periodenkalender, Zyklusstatistiken und PDF-Export.
- [Blog](${blogUrl()}): Veröffentlichte Artikel.
- [Support](${site}/support): Hilfe und Kontakt.

## Werkzeuge
- [Temperatur-Hilfslinie](${site}/werkzeuge/temperatur-hilfslinie): Ohne Konto nutzbare Berechnung mit Methodik und fiktivem Beispiel der Analyse.
- [Über uns](${site}/ueber-uns): Produktzweck, Betreiber und Autorenprofile.

## Themen
${BLOG_TOPICS.map((topic) => `- [${topic.title}](${site}${topicPath(topic.slug)})`).join('\n')}

## Autoren
${authors.map((name) => `- [${line(name)}](${site}${authorPath(name)})`).join('\n')}

## Artikel
${posts.map((post) => `- [${line(post.title)}](${blogUrl(post.locale, post.slug)}): ${line(post.meta_description)}`).join('\n')}

## Rechtliches
- [Datenschutz](${site}/datenschutz)
- [Impressum](${site}/impressum)
- [AGB](${site}/agb)
- [Widerruf](${site}/widerruf)

## Hinweise
Die App ist kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug, bestimmt keine fruchtbaren Tage und ersetzt keine ärztliche Beratung. Auswertungen und Prognosen sind statistische Schätzungen.
`
}
