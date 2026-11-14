// app/werkzeuge/basaltemperaturkurve/page.tsx
// Public, account-free tool for the search intent "Basaltemperaturkurve erstellen /
// Vorlage / Temperaturkurve Zyklus". Until 11/2026 the site had only app marketing
// and a coverline calculator for these queries (GSC: "basaltemperatur kurve" pos. 53,
// "basaltemperaturkurve" pos. 92, "temperaturkurve zyklus" pos. 60).
//
// Wording is part of the product's intended purpose (MDR): the tool draws what was
// typed in. No fertile days, no ovulation, no contraception, no evaluation of a rise.

import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogFooter, BlogHeader } from '@/app/[locale]/blog/BlogChrome'
import { getOptionalPosts } from '@/app/[locale]/blog/posts'
import { CurveSheet } from '@/components/curve/CurveSheet'
import { EXAMPLE_TEMPS, formatTemp } from '@/components/marketing/example-cycle'
import { blogPath } from '@/lib/blog-urls'
import { SHEET_DEFAULT_DAYS } from '@/lib/curve-sheet'
import { topicPosts } from '@/lib/seo-autopilot/discovery'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'
import { CurveBuilder, PrintSheetButton } from './CurveBuilder'

export const revalidate = 3600

const PATH = '/werkzeuge/basaltemperaturkurve'
const TITLE = 'Basaltemperaturkurve erstellen: online oder als Vorlage'
const DESCRIPTION = 'Basaltemperaturkurve kostenlos online zeichnen oder als leere Vorlage drucken – ohne Konto, die Werte bleiben im Browser. Mit Anleitung zum Eintragen und Lesen.'
const SOURCE_MEASURE = 'https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/wie-messe-ich-meine-koerpertemperatur/'
const SOURCE_METHODS = 'https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/fruchtbare-tage-selbst-bestimmen-methoden/'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: 'website' },
}

const EXAMPLE_TEXT = EXAMPLE_TEMPS.map((value) => formatTemp(value)).join('\n')

const faq = [
  {
    question: 'Was ist eine Basaltemperaturkurve?',
    answer: 'Eine Basaltemperaturkurve ist die Aufzeichnung deiner Aufwachtemperatur über einen Zyklus: auf der waagerechten Achse die Zyklustage, auf der senkrechten Achse die Temperatur in Schritten von 0,05 °C. Jeder Morgen ergibt einen Punkt, die verbundenen Punkte ergeben die Kurve.',
  },
  {
    question: 'Welcher Temperaturbereich gehört auf die Vorlage?',
    answer: 'Die Vorlage beginnt bei 36,0 °C und endet bei 37,2 °C. Liegen deine Werte darunter oder darüber, erweitert das Online-Werkzeug den Bereich automatisch in Zehntelschritten.',
  },
  {
    question: 'Muss ich jeden Tag zur gleichen Uhrzeit messen?',
    answer: 'Nein. Laut Frauenärzte im Netz ist eine tägliche gleiche Uhrzeit nicht erforderlich; gemessen wird direkt nach dem Aufwachen und vor dem Aufstehen, nach mindestens einer Stunde Schlaf oder Ruhe. Die Messzeit notierst du in der Zeile „Messzeit“.',
  },
  {
    question: 'Wertet das Werkzeug meine Kurve aus?',
    answer: 'Nein. Es zeichnet nur, was du eingibst, und nennt den niedrigsten und höchsten Wert. Es bestimmt keine fruchtbaren Tage und keinen Eisprung. Fragen zu deinem Zyklus besprichst du mit deiner Frauenärztin oder deinem Frauenarzt.',
  },
]

export default async function CurveToolPage() {
  const site = getSeoSiteUrl()
  const posts = await getOptionalPosts('de')
  const articles = topicPosts(posts, 'temperaturkurven')
  // Link a guide article only while it is published; otherwise name it as plain text.
  const guide = (slug: string, label: string) => posts.some((post) => post.slug === slug)
    ? <Link className="link-quiet underline" href={blogPath('de', slug)}>{label}</Link>
    : <>{label} im Ratgeber</>
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication', '@id': `${site}${PATH}#tool`, name: 'Basaltemperaturkurve erstellen',
            url: `${site}${PATH}`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'de-DE',
            description: DESCRIPTION, isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            publisher: { '@id': `${site}/#organization` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Startseite', item: `${site}/` },
              { '@type': 'ListItem', position: 2, name: 'Basaltemperaturkurve erstellen', item: `${site}${PATH}` },
            ],
          },
        ],
      }) }} />
      <BlogHeader locale="de" current="curve" />
      <main id="inhalt" className="mx-auto max-w-4xl space-y-12 px-4 py-12 leading-relaxed text-[var(--text-secondary)] sm:px-6 sm:py-16 [&_h2]:text-[var(--text)] [&_h3]:text-[var(--text)]">
        <header className="space-y-4">
          <p className="eyebrow">Werkzeug · kostenlos, ohne Konto</p>
          <h1 className="font-display text-4xl text-[var(--text)] sm:text-5xl">Basaltemperaturkurve erstellen – online oder als Vorlage zum Ausdrucken</h1>
          <p className="text-lg">
            Eine Basaltemperaturkurve zeigt deine Aufwachtemperatur Tag für Tag über einen Zyklus. Hier trägst du deine Werte ein und siehst sofort die Kurve, oder du druckst die leere Vorlage und führst sie auf Papier. Beides geht ohne Anmeldung, und deine Werte verlassen den Browser nicht.
          </p>
          <p>
            Die Basaltemperatur ist laut <a className="link-quiet underline" href={SOURCE_MEASURE} rel="noopener" target="_blank">Frauenärzte im Netz</a>, dem Portal des Berufsverbands der Frauenärzte, die Körpertemperatur in Ruhe unmittelbar nach dem Aufwachen. Gemessen wird vor dem Aufstehen; vorher solltest du mindestens eine Stunde geschlafen oder geruht haben.
          </p>
        </header>

        <section className="space-y-4" aria-labelledby="online">
          <h2 id="online" className="text-2xl font-semibold">Kurve online zeichnen</h2>
          <p>Ersetze die Beispielwerte durch deine eigenen. Jede Zeile ist ein Zyklustag, beginnend mit dem ersten Tag der Periode. Fehlt eine Messung, schreibst du „-“, damit die folgenden Tage an ihrer Stelle bleiben.</p>
          <CurveBuilder example={EXAMPLE_TEXT} />
        </section>

        <section className="space-y-4" aria-labelledby="vorlage-titel">
          <h2 id="vorlage-titel" className="text-2xl font-semibold">Leere Vorlage zum Ausdrucken</h2>
          <p>
            Die Vorlage hat {SHEET_DEFAULT_DAYS} Zyklustage, eine Skala von 36,0 bis 37,2 °C in Schritten von 0,05 °C und vier Zeilen für Datum, Messzeit, Periode und Störung. Drucke sie am besten im Querformat; ohne JavaScript nutzt du einfach die Druckfunktion deines Browsers.
          </p>
          <div className="flex flex-wrap gap-3"><PrintSheetButton target="vorlage" label="Leere Vorlage drucken" /></div>
          <div id="vorlage" className="print-sheet overflow-x-auto rounded-xl border border-[var(--card-border)] bg-white p-2">
            <p className="px-2 pt-1 text-sm font-semibold text-[var(--text)]">Basaltemperaturkurve · Zyklus Nr. ____ · Beginn am ____________ · Messort: ☐ Mund ☐ Scheide ☐ Darm</p>
            <div className="min-w-[640px]"><CurveSheet days={SHEET_DEFAULT_DAYS} low={36.0} high={37.2} title="Leere Vorlage für eine Basaltemperaturkurve mit 35 Zyklustagen" /></div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="eintragen">
          <h2 id="eintragen" className="text-2xl font-semibold">So trägst du die Werte richtig ein</h2>
          <ol className="list-decimal space-y-3 pl-6">
            <li><strong className="text-[var(--text)]">Zyklustag 1 ist der erste Tag der Periode.</strong> Trage in der Zeile „Periode“ die Blutungstage ein, dann siehst du später, wo ein neuer Zyklus beginnt.</li>
            <li><strong className="text-[var(--text)]">Gleich nach dem Aufwachen messen, vor dem Aufstehen.</strong> Laut Frauenärzte im Netz muss die Uhrzeit nicht jeden Tag gleich sein. Notiere sie aber in der Zeile „Messzeit“.</li>
            <li><strong className="text-[var(--text)]">Messort und Thermometer nicht wechseln.</strong> Die Kurve einer Messung im Mund verläuft laut derselben Quelle im Durchschnitt etwa 0,2 °C unter der rektalen. Ein Wechsel mitten im Zyklus erzeugt also einen Sprung, der nichts mit deinem Körper zu tun hat. Geeignet sind digitale Thermometer, die 0,05 °C anzeigen; Infrarot-Ohrthermometer gelten als ungeeignet.</li>
            <li><strong className="text-[var(--text)]">Störungen sofort notieren.</strong> Kurze Nacht, Alkohol, Infekt, Medikamente oder Reise gehören in die Zeile „Störung“. Erkrankungen und Medikamente können die Messung beeinflussen, schreibt Frauenärzte im Netz.</li>
            <li><strong className="text-[var(--text)]">Punkte verbinden, Lücken offen lassen.</strong> Fehlt ein Tag, ziehst du die Linie nicht durch. So bleibt sichtbar, wo eine Messung fehlt.</li>
          </ol>
          <p>Ausführlich mit Fehlerprotokoll: {guide('basaltemperatur-messen-anleitung', 'Basaltemperatur messen: Anleitung in 7 Schritten')}.</p>
        </section>

        <section className="space-y-4" aria-labelledby="lesen">
          <h2 id="lesen" className="text-2xl font-semibold">Wie eine Temperaturkurve im Zyklus aussieht</h2>
          <p>
            In vielen Zyklen liegen die Werte zuerst auf einer tieferen Lage, dann folgt ein hormonell bedingter Anstieg, und die Werte bleiben eine Weile höher. Frauenärzte im Netz beziffert diesen Anstieg auf <a className="link-quiet underline" href={SOURCE_METHODS} rel="noopener" target="_blank">etwa 0,2 bis 0,4 °C</a>. Das ist wenig: Ein einzelner Störwert nach einer kurzen Nacht kann genauso groß ausfallen. Aussagekräftig ist deshalb nie ein einzelner Punkt, sondern der Verlauf über mehrere Tage.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-[var(--card-border)] text-[var(--text)]"><th className="py-2 pr-4">Was du siehst</th><th className="py-2 pr-4">Was du zuerst prüfst</th></tr></thead>
              <tbody>
                <tr className="border-b border-[var(--card-border)]"><td className="py-2 pr-4">Tiefe Lage, dann ein klarer Sprung auf eine höhere Lage</td><td className="py-2 pr-4">Nichts Besonderes: So sehen die meisten Beispielkurven aus.</td></tr>
                <tr className="border-b border-[var(--card-border)]"><td className="py-2 pr-4">Ein einzelner Wert springt hoch, die nächsten fallen zurück</td><td className="py-2 pr-4">Schlaf, Alkohol, Infekt, späte Messung</td></tr>
                <tr className="border-b border-[var(--card-border)]"><td className="py-2 pr-4">Werte springen täglich auf und ab</td><td className="py-2 pr-4">Messort, Thermometer, Messdauer</td></tr>
                <tr><td className="py-2 pr-4">Kein erkennbarer Wechsel über den ganzen Zyklus</td><td className="py-2 pr-4">Fehlende Tage und Störungen; tritt das wiederholt auf, frag in der Frauenarztpraxis nach.</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Mehr Muster mit einer durchgerechneten Beispieltabelle: {guide('basaltemperatur-kurve-lesen', 'Basaltemperatur-Kurve lesen')}. Die waagerechte Hilfslinie aus sechs Werten berechnest du mit dem <Link className="link-quiet underline" href="/werkzeuge/temperatur-hilfslinie">Hilfslinien-Rechner</Link>.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-7" aria-labelledby="grenzen">
          <h2 id="grenzen" className="text-2xl font-semibold">Was dieses Werkzeug nicht tut</h2>
          <p>Das Werkzeug zeichnet deine Werte und nennt den niedrigsten und den höchsten. Es erkennt keinen Anstieg, bestimmt keine fruchtbaren Tage und keinen Eisprung. Es ist kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug und ersetzt keine ärztliche Beratung.</p>
        </section>

        <section className="space-y-4" aria-labelledby="app">
          <h2 id="app" className="text-2xl font-semibold">Wenn du nicht jeden Monat neu zeichnen willst</h2>
          <p>
            In der Basaltemperatur-App trägst du Temperatur, Messzeit, Schlafdauer, Störungen und Periodentage kostenlos ein. Die Kurve mit Hilfslinie, der Vergleich mehrerer Zyklen und der PDF-Export gehören zur Analyse, die du einmalig für 9,99 € freischaltest, ohne Abo.
          </p>
          <Link href="/registrieren?from=basaltemperaturkurve" className="btn btn-primary btn-lg !whitespace-normal text-center">Werte kostenlos im Tagebuch speichern</Link>
        </section>

        <section className="space-y-5" aria-labelledby="fragen">
          <h2 id="fragen" className="text-2xl font-semibold">Häufige Fragen</h2>
          {faq.map((item) => (
            <div key={item.question} className="space-y-1">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>

        {articles.length > 0 && (
          <nav aria-label="Artikel zu Temperaturkurven" className="space-y-3">
            <h2 className="text-2xl font-semibold">Weiterlesen zu Basaltemperatur und Kurve</h2>
            <ul className="space-y-2">{articles.map((post) => <li key={post.id}><Link className="link-quiet" href={blogPath(post.locale, post.slug)}>{post.title}</Link></li>)}</ul>
          </nav>
        )}
      </main>
      <BlogFooter />
    </div>
  )
}
