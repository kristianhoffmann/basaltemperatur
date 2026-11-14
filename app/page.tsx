// app/page.tsx
// Start page. Design language "Kurvenblatt": paper, ink, one accent.
//
// Wording is part of the product's intended purpose (MDR): the app is a diary.
// Do not add claims about fertile days, ovulation prediction, contraception or
// conception here.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { HomeArticleLinks } from '@/app/[locale]/blog/BlogDiscovery'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'

export const revalidate = 60

const PAGE_TITLE = 'Basaltemperatur App: Temperaturkurve & Zyklustagebuch ohne Abo'
const PAGE_DESCRIPTION =
  'Basaltemperatur und Periode kostenlos eintragen. Temperaturkurve, Zyklusstatistik und PDF-Export einmalig für 9,99 € – ohne Abo, Server in Deutschland.'

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: '/',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Basaltemperatur – Zyklustagebuch mit Temperaturkurve' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['/twitter-image'],
  },
}

// ── Example chart (clearly labelled as example data) ──────────────────────────

const EXAMPLE_TEMPS = [
  36.52, 36.48, 36.44, 36.41, 36.38, 36.42, 36.36, 36.4, 36.34, 36.38, 36.42, 36.36, 36.33, 36.4,
  36.38, 36.62, 36.74, 36.8, 36.77, 36.83, 36.79, 36.85, 36.8, 36.76, 36.82, 36.78, 36.7, 36.58,
]
const RISE_INDEX = 15
const CHART = { width: 640, height: 300, left: 46, right: 18, top: 22, bottom: 40, min: 36.2, max: 37.0 }

const chartX = (index: number) =>
  CHART.left + (index * (CHART.width - CHART.left - CHART.right)) / (EXAMPLE_TEMPS.length - 1)
const chartY = (temp: number) =>
  CHART.top + ((CHART.max - temp) / (CHART.max - CHART.min)) * (CHART.height - CHART.top - CHART.bottom)
const formatTemp = (value: number) => value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

function ExampleChart() {
  // Same rule as the app: the highest of the six readings before the rise.
  const guideLine = Math.max(...EXAMPLE_TEMPS.slice(RISE_INDEX - 6, RISE_INDEX))
  const points = EXAMPLE_TEMPS.map((temp, index) => `${chartX(index).toFixed(1)},${chartY(temp).toFixed(1)}`).join(' ')
  const ticks = [36.2, 36.4, 36.6, 36.8, 37.0]
  const dayStep = chartX(1) - chartX(0)

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Beispiel einer Temperaturkurve über 28 Tage: fünf Periodentage, Tieflage um 36,4 Grad, Anstieg an Tag 16 und Hochlage um 36,8 Grad. Eine gestrichelte Hilfslinie liegt bei 36,42 Grad."
    >
      <rect
        x={chartX(0) - dayStep / 2}
        y={CHART.top}
        width={dayStep * 5}
        height={CHART.height - CHART.top - CHART.bottom}
        rx="6"
        fill="var(--period)"
        opacity="0.1"
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={CHART.left} x2={CHART.width - CHART.right} y1={chartY(tick)} y2={chartY(tick)} stroke="var(--text)" strokeOpacity="0.08" />
          <text x={CHART.left - 10} y={chartY(tick) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">{formatTemp(tick)}</text>
        </g>
      ))}
      {[1, 7, 14, 21, 28].map((day) => (
        <text key={day} x={chartX(day - 1)} y={CHART.height - 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          {day}
        </text>
      ))}
      <text x={chartX(2)} y={CHART.top + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--period)">Periode</text>

      <line
        x1={CHART.left}
        x2={CHART.width - CHART.right}
        y1={chartY(guideLine)}
        y2={chartY(guideLine)}
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeDasharray="6 5"
      />
      <text x={CHART.width - CHART.right} y={chartY(guideLine) + 15} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--gold)">
        Hilfslinie {formatTemp(guideLine)} °C
      </text>

      <polyline points={points} fill="none" stroke="var(--rose)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      {EXAMPLE_TEMPS.map((temp, index) => (
        <circle
          key={index}
          cx={chartX(index)}
          cy={chartY(temp)}
          r={index === RISE_INDEX ? 5.5 : 3.25}
          fill={index === RISE_INDEX ? 'var(--violet)' : '#fff'}
          stroke={index === RISE_INDEX ? '#fff' : 'var(--rose)'}
          strokeWidth="2"
        />
      ))}
      <text x={chartX(RISE_INDEX) - 10} y={chartY(EXAMPLE_TEMPS[RISE_INDEX]) - 2} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--violet)">
        Anstieg
      </text>
    </svg>
  )
}

// ── Content ───────────────────────────────────────────────────────────────────

const facts = ['Kein Abo', 'Server in Deutschland', 'Keine Werbung', 'Konto jederzeit löschbar']

const purposeDoes = [
  'Temperatur, Messzeit, Schlafdauer und Störfaktoren festhalten',
  'Periodentage, Blutungsstärke und eigene Beobachtungen notieren',
  'Deine Werte als Kurve mit Hilfslinie zeigen',
  'Zykluslängen und Temperaturverläufe rückblickend auswerten',
]

const purposeDoesNot = [
  'Keine Bestimmung fruchtbarer Tage, keine Vorhersage eines Eisprungs',
  'Kein Verhütungsmittel und keine Hilfe zur Familienplanung',
  'Kein Medizinprodukt, keine Diagnose, kein Ersatz für ärztlichen Rat',
  'Kein Verkauf deiner Daten, keine Werbung in der App',
]

const freeFeatures = [
  'Basaltemperatur mit Messzeit, Schlafdauer und Störfaktoren',
  'Periodentage mit Blutungsstärke',
  'Eigene Beobachtungen und Notizen',
  'Kalender mit allen Einträgen',
  'Am Handy und am Computer, im Browser',
]

const paidFeatures = [
  'Temperaturkurve mit Hilfslinie',
  'Rückblickende Markierung von Temperaturanstiegen',
  'Zyklusstatistik: Längen, Durchschnitte, Verlauf',
  'Vergleich mehrerer Zyklen',
  'Statistische Schätzung des nächsten Periodenbeginns',
  'PDF-Export deiner Kurve',
  'Künftige Updates inklusive',
]

const steps = [
  {
    title: 'Konto anlegen',
    text: 'Name, E-Mail-Adresse, Passwort. Keine Zahlungsdaten, keine Testphase, die abläuft.',
  },
  {
    title: 'Morgens messen und eintragen',
    text: 'Vor dem Aufstehen messen, Wert eintragen, bei Bedarf eine gestörte Messung markieren.',
  },
  {
    title: 'Kurve ansehen',
    text: 'Nach einigen Wochen zeigt die Analyse deine Kurve, die Hilfslinie und deine Zykluslängen.',
  },
]

const faqItems = [
  {
    question: 'Was ist die Basaltemperatur?',
    answer:
      'Die Basaltemperatur ist die Körpertemperatur direkt nach dem Aufwachen, noch vor dem Aufstehen. Im Lauf eines Zyklus liegt sie in der zweiten Zyklushälfte meist einige Zehntelgrad höher als in der ersten. Wer täglich misst und die Werte notiert, erhält daraus eine Temperaturkurve.',
  },
  {
    question: 'Was kann ich kostenlos nutzen?',
    answer:
      'Das Eintragen ist dauerhaft kostenlos: Basaltemperatur mit Messzeit und Störfaktoren, Periodentage, Notizen und der Kalender. Es gibt keine Testphase, die abläuft.',
  },
  {
    question: 'Was kostet die Analyse?',
    answer:
      'Einmalig 9,99 €. Das ist der Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Es gibt kein Abo und keine Folgekosten. Enthalten sind die Temperaturkurve mit Hilfslinie, Zyklusstatistik, Zyklusvergleich, eine statistische Schätzung des nächsten Periodenbeginns und der PDF-Export.',
  },
  {
    question: 'Kann ich mit der App verhüten oder fruchtbare Tage bestimmen?',
    answer:
      'Nein. Basaltemperatur ist ein Tagebuch, kein Medizinprodukt und kein Verhütungsmittel. Die App bestimmt keine fruchtbaren Tage und sagt keinen Eisprung voraus. Bei Fragen zu Verhütung, Kinderwunsch oder auffälligen Zyklusveränderungen wende dich an deine Frauenärztin oder deinen Frauenarzt.',
  },
  {
    question: 'Wo liegen meine Daten?',
    answer:
      'Auf einem Server in Deutschland. Deine Zyklusdaten sind Gesundheitsdaten: Wir verarbeiten sie nur mit deiner ausdrücklichen Einwilligung, verkaufen sie nicht und geben sie nicht an Werbepartner weiter. Die Einzelheiten stehen in der Datenschutzerklärung.',
  },
  {
    question: 'Kann ich meine Daten löschen oder mitnehmen?',
    answer:
      'Ja. Dein Konto löschst du selbst in den Einstellungen; dabei werden deine Einträge unwiderruflich entfernt. Eine Kopie deiner Daten erhältst du auf Anfrage kostenlos per E-Mail. Der PDF-Export der Kurve gehört zur Analyse.',
  },
  {
    question: 'Gibt es eine App für das iPhone?',
    answer:
      'Basaltemperatur läuft als Web-App im Browser – auf dem iPhone, auf Android und am Computer – und lässt sich zum Startbildschirm hinzufügen. Eine eigene iOS-App ist in Arbeit, aber noch nicht im App Store erhältlich.',
  },
  {
    question: 'Kann ich den Kauf widerrufen?',
    answer:
      'Ja. Du kannst den Kauf der Analyse 14 Tage lang ohne Angabe von Gründen widerrufen, am einfachsten online über „Vertrag widerrufen“ im Seitenfuß.',
  },
]

export default function LandingPage() {
  const siteUrl = getSeoSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#app`,
        name: 'Basaltemperatur',
        url: siteUrl,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Aktueller Browser mit JavaScript',
        inLanguage: 'de-DE',
        description:
          'Privates Zyklustagebuch: Basaltemperatur und Periode eintragen, Temperaturkurve und Zyklusstatistik ansehen. Kein Medizinprodukt und kein Verhütungsmittel.',
        publisher: { '@id': `${siteUrl}/#organization` },
        offers: [
          {
            '@type': 'Offer',
            name: 'Eintragen (kostenlos)',
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: 'Analyse (einmalig)',
            price: '9.99',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <SiteHeader current="home" />

      <main id="inhalt">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
            <div>
              <p className="eyebrow">Basaltemperatur-App · Zyklustagebuch im Browser</p>
              <h1 className="font-display mt-4 text-[2.6rem] text-[var(--text)] sm:text-6xl lg:text-[4.1rem]">
                Basaltemperatur eintragen. Kurve sehen. Mehr nicht.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Ein privates Tagebuch für Temperatur und Periode. Das Eintragen ist kostenlos.
                Kurve, Statistik und PDF-Export schaltest du einmalig für 9,99&nbsp;€ frei –
                ohne Abo und ohne Werbung.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <Link href="/registrieren" className="btn btn-primary btn-xl">
                  Kostenlos starten
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                <Link href="/werkzeuge/temperatur-hilfslinie" className="link-quiet text-[15px] font-medium">
                  Hilfslinie ohne Konto berechnen
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
                {facts.map((fact) => (
                  <li key={fact} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[var(--emerald)]" aria-hidden />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            <figure className="relative">
              <div className="paper-grid rounded-2xl border border-[var(--card-border)] p-4 shadow-strong sm:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-semibold text-[var(--text)]">Zyklus 4</p>
                  <p className="text-xs text-[var(--text-muted)]">28 Tage · Beispieldaten</p>
                </div>
                <div className="mt-2">
                  <ExampleChart />
                </div>
                <dl className="mt-3 grid grid-cols-3 divide-x divide-[var(--card-border)] rounded-xl border border-[var(--card-border)] bg-white/85 text-center">
                  {[
                    ['Heute', '36,58 °C'],
                    ['Ø Zykluslänge', '29 Tage'],
                    ['Hochlage', '+0,39 °C'],
                  ].map(([label, value]) => (
                    <div key={label} className="px-2 py-3">
                      <dt className="text-[11px] text-[var(--text-muted)]">{label}</dt>
                      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--text)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <figcaption className="mt-3 text-xs text-[var(--text-muted)]">
                So sieht die Kurve in der Analyse aus. Die Werte sind ein erfundenes Beispiel.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Purpose ──────────────────────────────────────── */}
        <section aria-labelledby="zweck" className="border-y border-[var(--card-border)] bg-[var(--bg-secondary)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <h2 id="zweck" className="font-display text-4xl text-[var(--text)] sm:text-5xl">
                  Ein Tagebuch. Kein Orakel.
                </h2>
                <p className="mt-5 max-w-md leading-relaxed text-[var(--text-secondary)]">
                  Basaltemperatur hält fest, was du misst, und zeigt es dir übersichtlich. Was die
                  Werte für dich bedeuten, entscheidest du – oder besprichst es mit deiner Ärztin
                  oder deinem Arzt.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Das macht die App</h3>
                  <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--text-secondary)]">
                    {purposeDoes.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Das macht sie bewusst nicht</h3>
                  <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--text-secondary)]">
                    {purposeDoesNot.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" aria-labelledby="funktionen" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 id="funktionen" className="font-display max-w-2xl text-4xl text-[var(--text)] sm:text-5xl">
            Drei Dinge, ordentlich gemacht
          </h2>

          <div className="mt-12 space-y-14 lg:mt-16 lg:space-y-20">
            {/* 1 — Eintragen */}
            <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="eyebrow">Kostenlos</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Eintragen in zehn Sekunden</h3>
                <p className="mt-3 max-w-md leading-relaxed text-[var(--text-secondary)]">
                  Wert eintippen, fertig. Messzeit und Schlafdauer kannst du ergänzen. War die
                  Messung gestört – krank, kurze Nacht, Alkohol –, markierst du sie, damit sie die
                  Auswertung nicht verfälscht.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-card sm:p-6" aria-hidden>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-[var(--text)]">Eintrag · Donnerstag, 12. November</p>
                  <p className="text-xs text-[var(--text-muted)]">Beispiel</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ['Temperatur', '36,45 °C'],
                    ['Messzeit', '06:40'],
                    ['Schlaf', '7,5 h'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2.5">
                      <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
                      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--text)]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-[var(--text-secondary)]">Messung gestört: nein</span>
                  <span className="rounded-md bg-rose-100 px-2.5 py-1.5 font-medium text-rose-800">Periode: leicht</span>
                  <span className="rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-[var(--text-secondary)]">Notiz: spät ins Bett</span>
                </div>
              </div>
            </article>

            {/* 2 — Kalender */}
            <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="lg:order-2">
                <p className="eyebrow">Kostenlos</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Periode im Kalender</h3>
                <p className="mt-3 max-w-md leading-relaxed text-[var(--text-secondary)]">
                  Periodentage markierst du mit einem Tipp, auf Wunsch mit Blutungsstärke. Der
                  Kalender zeigt, an welchen Tagen du gemessen hast und wann deine Periode war.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-card sm:p-6 lg:order-1" aria-hidden>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-[var(--text)]">November</p>
                  <p className="text-xs text-[var(--text-muted)]">Beispiel</p>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs tabular-nums">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <span key={day} className="pb-1 text-[11px] text-[var(--text-muted)]">{day}</span>
                  ))}
                  {Array.from({ length: 28 }, (_, index) => index + 2).map((day) => {
                    const isPeriod = day >= 3 && day <= 7
                    const measured = !isPeriod && day <= 20 && day !== 14
                    return (
                      <span
                        key={day}
                        className={`flex aspect-square items-center justify-center rounded-lg border ${
                          isPeriod
                            ? 'border-rose-300 bg-rose-100 font-semibold text-rose-800'
                            : measured
                              ? 'border-[var(--card-border)] bg-[var(--bg)] text-[var(--text)]'
                              : 'border-transparent text-[var(--text-muted)]'
                        } ${day === 20 ? 'ring-2 ring-[var(--text)] ring-offset-1' : ''}`}
                      >
                        {day}
                      </span>
                    )
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-rose-300 bg-rose-100" />Periode</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-[var(--card-border)] bg-[var(--bg)]" />Temperatur eingetragen</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-[var(--text)]" />Heute</span>
                </div>
              </div>
            </article>

            {/* 3 — Analyse */}
            <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="eyebrow">Analyse · einmalig 9,99&nbsp;€</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Kurve, Statistik, PDF</h3>
                <p className="mt-3 max-w-md leading-relaxed text-[var(--text-secondary)]">
                  Die Analyse zeichnet deine Kurve mit Hilfslinie und markiert Temperaturanstiege
                  rückblickend. Dazu kommen Zykluslängen, der Vergleich mehrerer Zyklen, eine
                  statistische Schätzung des nächsten Periodenbeginns und der PDF-Export – zum
                  Beispiel für den nächsten Arzttermin.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-card sm:p-6" aria-hidden>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-[var(--text)]">Zykluslängen</p>
                  <p className="text-xs text-[var(--text-muted)]">Beispiel</p>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm tabular-nums">
                  {[
                    ['Juli', 28],
                    ['August', 31],
                    ['September', 29],
                    ['Oktober', 28],
                  ].map(([month, days]) => (
                    <li key={month} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
                      <span className="text-[var(--text-secondary)]">{month}</span>
                      <span className="h-2.5 rounded-full bg-[var(--bg-secondary)]">
                        <span className="block h-2.5 rounded-full bg-[var(--rose)]" style={{ width: `${(Number(days) / 34) * 100}%` }} />
                      </span>
                      <span className="text-right font-semibold text-[var(--text)]">{days} Tage</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--card-border)] pt-4 text-sm">
                  <div>
                    <dt className="text-[11px] text-[var(--text-muted)]">Durchschnitt</dt>
                    <dd className="font-semibold tabular-nums text-[var(--text)]">29 Tage</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[var(--text-muted)]">Nächste Periode (Schätzung)</dt>
                    <dd className="font-semibold tabular-nums text-[var(--text)]">um den 1. Dezember</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <section id="pricing" aria-labelledby="preis" className="border-y border-[var(--card-border)] bg-[var(--bg-secondary)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <h2 id="preis" className="font-display text-4xl text-[var(--text)] sm:text-5xl">Einmal zahlen statt Abo</h2>
              <p className="mt-5 leading-relaxed text-[var(--text-secondary)]">
                Das Eintragen bleibt kostenlos. Die Analyse kaufst du einmal – wenn du sie brauchst.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-[var(--card-border)] bg-white p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-[var(--text)]">Eintragen</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl tabular-nums text-[var(--text)]">0&nbsp;€</span>
                  <span className="text-sm text-[var(--text-muted)]">dauerhaft</span>
                </p>
                <ul className="mt-6 space-y-3 text-[15px] text-[var(--text-secondary)]">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link href="/registrieren" className="btn btn-secondary btn-lg w-full">Kostenlos starten</Link>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border-2 border-[var(--text)] bg-white p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-[var(--text)]">Analyse</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl tabular-nums text-[var(--text)]">9,99&nbsp;€</span>
                  <span className="text-sm text-[var(--text-muted)]">einmalig</span>
                </p>
                <ul className="mt-6 space-y-3 text-[15px] text-[var(--text-secondary)]">
                  {paidFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link href="/registrieren" className="btn btn-primary btn-lg w-full">
                    Konto anlegen und später freischalten
                  </Link>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                    Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Kein Abo, keine
                    Folgekosten. Du kaufst im Konto und kannst den Kauf 14 Tage lang{' '}
                    <Link href="/widerruf" className="underline underline-offset-2">widerrufen</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Steps ────────────────────────────────────────── */}
        <section aria-labelledby="start" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 id="start" className="font-display text-4xl text-[var(--text)] sm:text-5xl">So fängst du an</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-[var(--text)] pt-5">
                <span className="font-display text-4xl tabular-nums text-[var(--rose)]">{index + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <HomeArticleLinks />

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="fragen" className="border-t border-[var(--card-border)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <h2 id="fragen" className="font-display text-4xl text-[var(--text)] sm:text-5xl">Häufige Fragen</h2>
                <p className="mt-5 max-w-sm leading-relaxed text-[var(--text-secondary)]">
                  Etwas fehlt? Schreib uns über die <Link href="/support" className="link-quiet">Support-Seite</Link>.
                </p>
              </div>
              <dl className="divide-y divide-[var(--card-border)] border-y border-[var(--card-border)]">
                {faqItems.map((item) => (
                  <div key={item.question} className="py-6">
                    <dt className="text-lg font-semibold text-[var(--text)]">{item.question}</dt>
                    <dd className="mt-2 leading-relaxed text-[var(--text-secondary)]">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────── */}
        <section aria-labelledby="schluss" className="border-t border-[var(--card-border)] bg-[var(--bg-secondary)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h2 id="schluss" className="font-display text-3xl text-[var(--text)] sm:text-4xl">Morgen früh den ersten Wert eintragen.</h2>
              <p className="mt-2 text-[var(--text-secondary)]">Kostenlos, ohne Zahlungsdaten.</p>
            </div>
            <Link href="/registrieren" className="btn btn-primary btn-xl shrink-0">
              Kostenlos starten
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
