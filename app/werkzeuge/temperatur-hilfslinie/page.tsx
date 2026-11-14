import { TemperatureCalculator } from './TemperatureCalculator'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'
import type { Metadata } from 'next'
import Link from 'next/link'
import { calculateCoverLine } from '@/lib/ovulation'
import { normalizeFrom, withFrom } from '@/lib/seo-autopilot/source'
import { BlogHeader, BlogFooter } from '@/app/[locale]/blog/BlogChrome'
import { getOptionalPosts } from '@/app/[locale]/blog/posts'
import { getPostTopics } from '@/lib/seo-autopilot/discovery'
import { blogPath } from '@/lib/blog-urls'

export const metadata: Metadata = {
  title: { absolute: 'Hilfslinie der Basaltemperaturkurve berechnen – ohne Anmeldung' },
  description: 'Berechne die Hilfslinie deiner Temperaturkurve aus sechs Messwerten – kostenlos, ohne Konto, direkt im Browser. Mit Methodik und Rechenbeispiel.',
  alternates: { canonical: '/werkzeuge/temperatur-hilfslinie' },
  openGraph: {
    title: 'Hilfslinie der Basaltemperaturkurve berechnen',
    description: 'Sechs Messwerte eingeben, Hilfslinie ablesen. Kostenlos, ohne Konto; die Werte verlassen deinen Browser nicht.',
    url: '/werkzeuge/temperatur-hilfslinie',
    type: 'website',
  },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const example = [36.2, 36.3, 36.4, 36.2, 36.1, 36.3]
const format = (value: number) => value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function TemperatureTool({ searchParams }: Props) {
  const params = await searchParams
  const from = normalizeFrom(params.from)
  const articles = (await getOptionalPosts('de')).filter((post) => getPostTopics(post).length > 0)
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Temperatur-Hilfslinie',
      url: `${getSeoSiteUrl()}/werkzeuge/temperatur-hilfslinie`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    }) }} />
    <BlogHeader locale="de" from={from} current="tool" />
    <main id="inhalt" className="mx-auto max-w-3xl space-y-10 px-4 py-12 leading-relaxed text-[var(--text-secondary)] sm:px-6 sm:py-16 [&_h2]:text-[var(--text)]">
      <p className="eyebrow">Werkzeug · kostenlos, ohne Konto</p>
      <h1 className="font-display !mt-3 text-4xl text-[var(--text)] sm:text-5xl">Temperatur-Hilfslinie berechnen</h1>
      <p className="text-lg">Die Hilfslinie ist hier der höchste Wert aus sechs Temperaturmessungen. Du kannst diese Grundlage der Kurvendarstellung ohne Anmeldung berechnen.</p>
      <TemperatureCalculator example={example} from={from} />
      <section className="space-y-3" id="methodik">
        <h2 className="text-2xl font-semibold">Methodik und Beispiel</h2>
        <p>Die App verwendet für die Hilfslinie den höchsten der sechs vorhergehenden auswertbaren Temperaturwerte und rundet auf zwei Nachkommastellen. Als gestört markierte oder von der Analyse ausgeschlossene Messungen werden in der Analyse nicht berücksichtigt.</p>
        <p>Fiktives Rechenbeispiel, keine Messdaten einer Person: {example.map(format).join('; ')} °C. Der höchste Wert und damit die Hilfslinie beträgt {format(calculateCoverLine(example)!)} °C.</p>
        <p>Diese Rechnung zeigt weder einen Eisprung noch fruchtbare Tage an. Die App ist ein persönliches Zyklustagebuch, kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug und ersetzt keine ärztliche Beratung.</p>
      </section>
      <section className="space-y-3" id="analyse">
        <h2 className="text-2xl font-semibold">Was die optionale Analyse macht</h2>
        <p>Temperatur und Periodentage kannst du kostenlos im Konto erfassen. Die Analyse für einmalig 9,99 € ergänzt Kurven, Zyklusvergleiche, eine statistische Schätzung des nächsten Periodenbeginns und PDF-Export.</p>
        <p>Für rückblickende Temperaturmuster vergleicht die App aufeinanderfolgende auswertbare Werte mit der Hilfslinie. Datenlücken und Störfaktoren können eine Auswertung verhindern. Das Ergebnis ist keine medizinische Bestätigung.</p>
        <p>Zyklusstatistiken beruhen auf den Abständen dokumentierter Periodenstarts. Fiktives Beispiel: Bei Abständen von 28, 30 und 29 Tagen ist der gerundete Mittelwert (28 + 30 + 29) / 3 = 29 Tage. Eine daraus abgeleitete Schätzung des nächsten Periodenbeginns ist eine Statistik und kann vom tatsächlichen Verlauf abweichen. PDF-Exporte dokumentieren die erfassten Daten.</p>
      </section>
      <Link href={withFrom('/registrieren', from)} className="btn btn-primary btn-lg !whitespace-normal text-center">Eigene Temperatur und Periode kostenlos dokumentieren</Link>
      {articles.length > 0 && <nav aria-label="Artikel zu Temperaturkurven"><h2 className="text-2xl font-semibold">Weiterlesen zu Temperatur und Zyklustagebuch</h2><ul className="mt-4 space-y-3">{articles.map((post) => <li key={post.id}><Link className="link-quiet" href={blogPath(post.locale, post.slug)}>{post.title}</Link></li>)}</ul></nav>}
    </main><BlogFooter />
  </div>
}
