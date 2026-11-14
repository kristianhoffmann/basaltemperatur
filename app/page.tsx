// app/page.tsx
// Start page. Design language "Thermo": colour is temperature, the curve is the hero.
//
// Wording is part of the product's intended purpose (MDR): the app is a diary.
// Do not add claims about fertile days, ovulation prediction, contraception or
// conception here.

import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Minus, Plus } from 'lucide-react'
import { HomeArticleLinks } from '@/app/[locale]/blog/BlogDiscovery'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { CycleStory, type StoryStep } from '@/components/marketing/CycleStory'
import { HeroStage } from '@/components/marketing/HeroStage'
import { EXAMPLE_GUIDE_LINE, EXAMPLE_TEMPS, formatTemp } from '@/components/marketing/example-cycle'
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

const storySteps: StoryStep[] = [
  {
    label: 'Kostenlos',
    title: 'Morgens: ein Wert, zehn Sekunden',
    body: (
      <p>
        Wert eintippen, fertig. Messzeit und Schlafdauer kannst du ergänzen. War die Messung
        gestört – krank, kurze Nacht, Alkohol –, markierst du sie, damit sie die Auswertung
        nicht verfälscht.
      </p>
    ),
  },
  {
    label: 'Kostenlos',
    title: 'Die Periode steht im Kalender',
    body: (
      <p>
        Periodentage markierst du mit einem Tipp, auf Wunsch mit Blutungsstärke. Der Kalender
        zeigt, an welchen Tagen du gemessen hast und wann deine Periode war.
      </p>
    ),
  },
  {
    label: 'Analyse, einmalig 9,99 €',
    title: 'Aus Punkten wird eine Kurve',
    body: (
      <p>
        Die Analyse zeichnet deine Kurve mit Hilfslinie und markiert Temperaturanstiege
        rückblickend. Dazu kommen Zykluslängen, der Vergleich mehrerer Zyklen, eine statistische
        Schätzung des nächsten Periodenbeginns und der PDF-Export – zum Beispiel für den
        nächsten Arzttermin.
      </p>
    ),
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
        {/* ── Hero: the stage is a thermometer ─────────────── */}
        <HeroStage
          headline={
            <h1 className="font-display text-[clamp(2.7rem,6.2vw,5.4rem)] text-[var(--text)] 2xl:text-[6.2rem] min-[1900px]:text-[7.3rem] min-[2400px]:text-[8.4rem]">
              <span className="line-mask"><span style={{ '--i': 0 } as CSSProperties}>Basaltemperatur eintragen.</span></span>
              <span className="line-mask"><span style={{ '--i': 1 } as CSSProperties}>Kurve sehen. Mehr nicht.</span></span>
            </h1>
          }
        >
          <p className="rise-in max-w-xl text-lg leading-relaxed text-[var(--text)] sm:text-xl 2xl:max-w-2xl 2xl:text-2xl 2xl:leading-relaxed" style={{ '--i': 3 } as CSSProperties}>
            Ein privates Tagebuch für Temperatur und Periode. Das Eintragen ist kostenlos. Kurve,
            Statistik und PDF-Export schaltest du einmalig für 9,99&nbsp;€ frei – ohne Abo und ohne
            Werbung.
          </p>
          <div className="rise-in mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" style={{ '--i': 4 } as CSSProperties}>
            <Link href="/registrieren" className="btn btn-ink btn-xl">
              Kostenlos starten
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="/werkzeuge/temperatur-hilfslinie" className="text-[15px] font-semibold text-[var(--text)] underline decoration-[var(--ink)]/40 decoration-2 underline-offset-4 hover:decoration-[var(--ink)]">
              Hilfslinie ohne Konto berechnen
            </Link>
          </div>
          <ul className="rise-in mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--text)]" style={{ '--i': 5 } as CSSProperties}>
            {facts.map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <Check className="h-4 w-4" aria-hidden />
                {fact}
              </li>
            ))}
          </ul>
        </HeroStage>

        {/* ── Ticker: a diary filling up ───────────────────── */}
        <div className="overflow-hidden bg-[var(--ink)] py-4" aria-hidden>
          <div className="ticker">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-baseline gap-8 pr-8 font-display text-2xl tabular-nums sm:text-3xl">
                {EXAMPLE_TEMPS.map((temp, index) => (
                  <li key={index} className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white/40">Tag {index + 1}</span>
                    <span style={{ color: temp > EXAMPLE_GUIDE_LINE ? '#FF9E8F' : '#C9D4FF' }}>{formatTemp(temp)}°</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ── Story: one cycle, built while you scroll ─────── */}
        <section id="features" aria-labelledby="funktionen" className="bg-[var(--ink)] pb-10 pt-20 lg:pt-28">
          <div className="wrap px-4 sm:px-6 lg:px-8">
            <h2 id="funktionen" className="font-display max-w-4xl text-5xl text-white sm:text-7xl 2xl:max-w-6xl 2xl:text-8xl min-[1900px]:text-9xl">
              Ein Zyklus, Punkt für Punkt.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 2xl:max-w-2xl 2xl:text-xl">
              Scroll weiter und sieh zu, wie aus 28 Morgenwerten eine Kurve wird. Kühle Farben
              stehen für niedrige Werte, warme für hohe.
            </p>
          </div>
          <div className="mt-8 lg:mt-4">
            <CycleStory steps={storySteps} />
          </div>
        </section>

        {/* ── Purpose ──────────────────────────────────────── */}
        <section aria-labelledby="zweck" className="bg-[var(--cool)]">
          <div className="wrap px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <h2 id="zweck" className="font-display text-[clamp(2.8rem,9vw,7rem)] text-[var(--text)] 2xl:text-[8.5rem] min-[1900px]:text-[10rem]">
              Ein Tagebuch.
              <br />
              Kein Orakel.
            </h2>
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr_1fr] lg:gap-12 2xl:mt-14 2xl:text-lg">
              <p className="text-lg leading-relaxed text-[var(--text)] 2xl:text-xl">
                Basaltemperatur hält fest, was du misst, und zeigt es dir übersichtlich. Was die
                Werte für dich bedeuten, entscheidest du – oder besprichst es mit deiner Ärztin
                oder deinem Arzt.
              </p>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Das macht die App</h3>
                <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--text)]">
                  {purposeDoes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Das macht sie bewusst nicht</h3>
                <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--text)]">
                  {purposeDoesNot.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <section id="pricing" aria-labelledby="preis" className="wrap px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <h2 id="preis" className="font-display max-w-3xl text-5xl text-[var(--text)] sm:text-7xl 2xl:max-w-5xl 2xl:text-8xl min-[1900px]:text-9xl">Einmal zahlen statt Abo.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
            Das Eintragen bleibt kostenlos. Die Analyse kaufst du einmal – wenn du sie brauchst.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col rounded-[28px] bg-[var(--cool)] p-7 sm:p-9">
              <h3 className="text-lg font-bold text-[var(--text)]">Eintragen</h3>
              <p className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-7xl tabular-nums text-[var(--text)] sm:text-8xl">0&nbsp;€</span>
                <span className="text-sm font-medium text-[var(--text)]">dauerhaft</span>
              </p>
              <ul className="mt-7 space-y-3 text-[15px] text-[var(--text)]">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-9">
                <Link href="/registrieren" className="btn btn-lg w-full bg-white text-[var(--text)] hover:-translate-y-0.5">Kostenlos starten</Link>
              </div>
            </div>

            <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-[var(--ink)] p-7 text-white sm:p-9">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,158,143,0.55) 0%, rgba(255,158,143,0) 68%)' }} />
              <h3 className="relative text-lg font-bold text-white">Analyse</h3>
              <p className="relative mt-2 flex items-baseline gap-3">
                <span className="font-display text-7xl tabular-nums sm:text-8xl">9,99&nbsp;€</span>
                <span className="text-sm font-medium text-white/70">einmalig</span>
              </p>
              <ul className="relative mt-7 grid gap-3 text-[15px] text-white/85 sm:grid-cols-2">
                {paidFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9E8F]" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-9">
                <Link href="/registrieren" className="btn btn-lg w-full bg-[#FF9E8F] text-[var(--ink)] hover:-translate-y-0.5 hover:bg-[#FFB1A5]">
                  Konto anlegen und später freischalten
                </Link>
                <p className="mt-4 text-xs leading-relaxed text-white/60">
                  Endpreis; gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Kein Abo, keine
                  Folgekosten. Du kaufst im Konto und kannst den Kauf 14 Tage lang{' '}
                  <Link href="/widerruf" className="underline underline-offset-2">widerrufen</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Steps (a real sequence, hence the numbers) ───── */}
        <section aria-labelledby="start" className="bg-[var(--bg-secondary)]">
          <div className="wrap px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <h2 id="start" className="font-display text-5xl text-[var(--text)] sm:text-6xl 2xl:text-7xl">So fängst du an</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="font-display text-8xl tabular-nums text-[var(--rose)]">{index + 1}</span>
                  <h3 className="mt-2 text-xl font-bold text-[var(--text)]">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="pt-20 lg:pt-24">
          <HomeArticleLinks />
        </div>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="fragen" className="wrap px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 id="fragen" className="font-display text-5xl text-[var(--text)] sm:text-6xl 2xl:text-7xl">Häufige Fragen</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-[var(--text-secondary)]">
                Etwas fehlt? Schreib uns über die <Link href="/support" className="link-quiet">Support-Seite</Link>.
              </p>
            </div>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <details key={item.question} open={index === 0} className="faq-item group rounded-2xl bg-white px-5 py-1 ring-1 ring-[var(--card-border)] open:ring-2 open:ring-[var(--ink)] sm:px-7">
                  <summary className="flex items-center justify-between gap-4 py-4 text-lg font-bold text-[var(--text)]">
                    {item.question}
                    <span className="faq-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cool)] text-[var(--text)]">
                      <Plus className="h-5 w-5" aria-hidden />
                    </span>
                  </summary>
                  <p className="faq-answer pb-5 leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────── */}
        <section aria-labelledby="schluss" className="relative isolate overflow-hidden bg-[#FF9E8F]">
          <div aria-hidden className="pointer-events-none absolute -bottom-[55%] left-1/2 -z-10 aspect-square w-[90%] -translate-x-1/2 rounded-full sm:w-[60%]" style={{ background: 'radial-gradient(circle, #FFF3D6 0%, rgba(255,214,170,0.9) 38%, rgba(255,158,143,0) 70%)' }} />
          <div className="wrap px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
            <h2 id="schluss" className="font-display mx-auto max-w-4xl text-[clamp(2.6rem,8.5vw,6.5rem)] text-[var(--text)] 2xl:max-w-6xl 2xl:text-[8rem] min-[1900px]:text-[9.5rem]">
              Morgen früh der erste Punkt.
            </h2>
            <p className="mt-6 text-lg font-medium text-[var(--text)]">Kostenlos, ohne Zahlungsdaten.</p>
            <Link href="/registrieren" className="btn btn-ink btn-xl mt-9">
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
