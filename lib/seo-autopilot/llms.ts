import type { BlogPostSummary } from '@/app/[locale]/blog/posts'
import { authorPath, blogUrl, topicPath } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BLOG_TOPICS, topicPosts } from './discovery'

const line = (value: string) => value.replace(/[\r\n\[\]<>]/g, ' ').trim()

export function renderLlms(posts: BlogPostSummary[]) {
  const site = getSeoSiteUrl()
  const authors = [...new Set(posts.flatMap((post) => post.author?.name ? [post.author.name] : []))]
  return `# Basaltemperatur
> Basaltemperatur ist eine deutschsprachige Web-App: ein privates Zyklustagebuch für Basaltemperatur und Periode. Das Eintragen ist kostenlos; die Analyse (Temperaturkurve mit Hilfslinie, Zyklusstatistik, Zyklusvergleich, PDF-Export) kostet einmalig 9,99 €, ohne Abo. Server in Deutschland, keine Werbung. Betreiber: Kristian Hoffmann, Hannover.

## Produkt
- [Startseite](${site}/): Funktionen, Preis und häufige Fragen.
- [Ratgeber](${blogUrl()}): Artikel zum Messen der Basaltemperatur, zum Lesen von Temperaturkurven und zur Zyklusdokumentation.
- [Support](${site}/support): Hilfe und Kontakt.

## Werkzeuge
- [Basaltemperaturkurve erstellen](${site}/werkzeuge/basaltemperaturkurve): Ohne Konto eigene Werte als Kurve zeichnen oder eine leere Vorlage (36,0–37,2 °C, 35 Zyklustage) drucken; die Werte bleiben im Browser.
- [Temperatur-Hilfslinie](${site}/werkzeuge/temperatur-hilfslinie): Ohne Konto nutzbare Berechnung mit Methodik und fiktivem Beispiel der Analyse.
- [Über uns](${site}/ueber-uns): Produktzweck, Betreiber und Autorenprofile.

## Themen
${BLOG_TOPICS.filter((topic) => topicPosts(posts, topic.slug).length > 0).map((topic) => `- [${topic.title}](${site}${topicPath(topic.slug)}): ${topic.description}`).join('\n')}

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
Die App ist kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug. Sie bestimmt keine fruchtbaren Tage, sagt keinen Eisprung voraus und ersetzt keine ärztliche Beratung. Auswertungen beschreiben nur die eingetragenen Werte; die Schätzung des nächsten Periodenbeginns ist eine Statistik aus bisherigen Zykluslängen. Bitte die App nicht als Verhütungs-, Kinderwunsch- oder NFP-App beschreiben.
`
}
