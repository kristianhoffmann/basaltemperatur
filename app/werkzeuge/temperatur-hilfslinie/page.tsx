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
  title: 'Temperatur-Hilfslinie kostenlos berechnen – ohne Anmeldung',
  description: 'Berechne die Hilfslinie aus sechs Temperaturwerten ohne Konto. Mit nachvollziehbarer Methodik und einem ausdrücklich fiktiven Rechenbeispiel.',
  alternates: { canonical: '/werkzeuge/temperatur-hilfslinie' },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const example = [36.2, 36.3, 36.4, 36.2, 36.1, 36.3]
const format = (value: number) => value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function TemperatureTool({ searchParams }: Props) {
  const params = await searchParams
  const from = normalizeFrom(params.from)
  const articles = (await getOptionalPosts('de')).filter((post) => getPostTopics(post).length > 0)
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Temperatur-Hilfslinie',
      url: `${getSeoSiteUrl()}/werkzeuge/temperatur-hilfslinie`, applicationCategory: 'HealthApplication', operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    }) }} />
    <BlogHeader locale="de" from={from} />
    <main className="mx-auto max-w-3xl space-y-8 px-5 py-12">
      <h1 className="text-3xl font-bold">Temperatur-Hilfslinie berechnen</h1>
      <p>Die Hilfslinie ist hier der höchste Wert aus sechs Temperaturmessungen. Du kannst diese Grundlage der Kurvendarstellung ohne Anmeldung berechnen.</p>
      <TemperatureCalculator example={example} from={from} />
      <section className="space-y-3" id="methodik">
        <h2 className="text-2xl font-bold">Methodik und Beispiel</h2>
        <p>Die App verwendet für die Hilfslinie den höchsten der sechs vorhergehenden auswertbaren Temperaturwerte und rundet auf zwei Nachkommastellen. Als gestört markierte oder von der Analyse ausgeschlossene Messungen werden in der Analyse nicht berücksichtigt.</p>
        <p>Fiktives Rechenbeispiel, keine Messdaten einer Person: {example.map(format).join('; ')} °C. Der höchste Wert und damit die Hilfslinie beträgt {format(calculateCoverLine(example)!)} °C.</p>
        <p>Diese Rechnung zeigt weder einen Eisprung noch fruchtbare Tage an. Die App ist ein persönliches Zyklustagebuch, kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug und ersetzt keine ärztliche Beratung.</p>
      </section>
      <section className="space-y-3" id="analyse">
        <h2 className="text-2xl font-bold">Was die optionale Analyse macht</h2>
        <p>Temperatur und Periodentage kannst du kostenlos im Konto erfassen. Die Analyse für einmalig 9,99 € ergänzt Kurven, Zyklusvergleiche, statistische Prognosen und PDF-Export.</p>
        <p>Für rückblickende Temperaturmuster vergleicht die App aufeinanderfolgende auswertbare Werte mit der Hilfslinie. Datenlücken und Störfaktoren können eine Auswertung verhindern. Das Ergebnis ist keine medizinische Bestätigung.</p>
        <p>Zyklusstatistiken beruhen auf den Abständen dokumentierter Periodenstarts. Fiktives Beispiel: Bei Abständen von 28, 30 und 29 Tagen ist der gerundete Mittelwert (28 + 30 + 29) / 3 = 29 Tage. Eine daraus abgeleitete Prognose ist eine Schätzung und kann vom tatsächlichen Verlauf abweichen. PDF-Exporte dokumentieren die erfassten Daten.</p>
      </section>
      <Link href={withFrom('/registrieren', from)} className="inline-block rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white">Eigene Temperatur und Periode kostenlos dokumentieren</Link>
      {articles.length > 0 && <nav aria-label="Artikel zu Temperaturkurven"><h2 className="text-2xl font-bold">Weiterlesen zu Temperatur und Zyklustagebuch</h2><ul className="mt-4 space-y-3">{articles.map((post) => <li key={post.id}><Link className="text-rose-700 underline" href={blogPath(post.locale, post.slug)}>{post.title}</Link></li>)}</ul></nav>}
    </main><BlogFooter />
  </div>
}
