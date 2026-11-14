import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogHeader, BlogFooter } from '@/app/[locale]/blog/BlogChrome'
import { getOptionalPosts } from '@/app/[locale]/blog/posts'
import { authorPath } from '@/lib/blog-urls'
import { getLegalCompany } from '@/lib/legal/config'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'

export const revalidate = 60

const TITLE = 'Über Basaltemperatur: Zweck, Betreiber und Arbeitsweise'
const DESCRIPTION =
  'Wer Basaltemperatur betreibt, wofür das Zyklustagebuch gedacht ist, wofür nicht, wo die Daten liegen und wie die Ratgeber-Artikel entstehen.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/ueber-uns' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/ueber-uns', type: 'website' },
}

export default async function AboutPage() {
  const company = getLegalCompany()
  const site = getSeoSiteUrl()
  const authors = [...new Set((await getOptionalPosts('de')).flatMap((post) => post.author?.name ? [post.author.name] : []))]
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${site}/ueber-uns#page`,
    url: `${site}/ueber-uns`,
    name: TITLE,
    inLanguage: 'de-DE',
    about: { '@id': `${site}/#organization` },
  }

  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><BlogHeader locale="de" current="about" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
    <main id="inhalt" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="eyebrow">Über uns</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">Über Basaltemperatur</h1>

      <div className="mt-8 space-y-5 text-lg leading-relaxed text-[var(--text-secondary)]">
        <p>Basaltemperatur ist ein persönliches Zyklustagebuch. Du kannst Temperatur und Periodentage kostenlos erfassen und bei Bedarf die Analyse einmalig freischalten.</p>
        <p>Die App ist kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug. Sie bestimmt keine fruchtbaren Tage, sagt keinen Eisprung voraus und ersetzt keine ärztliche Beratung. Die Schätzung des nächsten Periodenbeginns ist eine Statistik aus deinen bisherigen Zykluslängen.</p>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Warum es die App gibt</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-[var(--text-secondary)]">
        <p>Viele Zyklus-Apps verlangen ein Abo, zeigen Werbung oder werten Daten für Dritte aus. Basaltemperatur macht absichtlich weniger: Werte eintragen, Kurve ansehen, Daten behalten. Das Eintragen kostet nichts; die Analyse kostet einmalig 9,99&nbsp;€.</p>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Deine Daten</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-[var(--text-secondary)]">
        <li>Gespeichert wird auf einem Server in Deutschland.</li>
        <li>Zyklusdaten sind Gesundheitsdaten. Wir verarbeiten sie nur mit deiner ausdrücklichen Einwilligung, die du jederzeit widerrufen kannst.</li>
        <li>Es gibt keine Werbung in der App. Daten werden nicht verkauft und nicht an Werbepartner weitergegeben.</li>
        <li>Dein Konto löschst du selbst in den Einstellungen; dabei werden deine Einträge unwiderruflich entfernt.</li>
        <li>Besuchsstatistik läuft nur, wenn du ihr zustimmst. Einzelheiten stehen in der <Link className="link-quiet" href="/datenschutz">Datenschutzerklärung</Link>.</li>
      </ul>

      <h2 className="mt-12 text-2xl font-semibold">Betreiber und Kontakt</h2>
      <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
        Basaltemperatur wird von {company.name} in Hannover entwickelt und betrieben. Du erreichst uns per E-Mail unter{' '}
        <a className="link-quiet" href={`mailto:${company.email}`}>{company.email}</a>. Die vollständigen Anbieterangaben stehen im{' '}
        <Link className="link-quiet" href="/impressum">Impressum</Link>.
      </p>

      <h2 className="mt-12 text-2xl font-semibold">Wie die Ratgeber-Artikel entstehen</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-[var(--text-secondary)]">
        <p>Die Artikel im <Link className="link-quiet" href="/de/blog">Ratgeber</Link> werden mit Unterstützung von KI-Werkzeugen erstellt. Redaktionell verantwortlich ist {company.name}. Die Texte geben allgemeine Informationen wieder, nennen ihre Quellen und sind keine medizinische Beratung.</p>
        <p>Fehler gefunden? Schreib uns – wir korrigieren Artikel und vermerken das Datum der Aktualisierung.</p>
      </div>
      {authors.length > 0 && <>
        <h3 className="mt-8 text-lg font-semibold">Autoren im Blog</h3>
        <p className="mt-2 text-[var(--text-secondary)]">Die Profile zeigen die bei den veröffentlichten Artikeln hinterlegten Autorenangaben.</p>
        <ul className="mt-3 space-y-2">{authors.map((name) => <li key={name}><Link className="link-quiet" href={authorPath(name)}>{name}</Link></li>)}</ul>
      </>}

      <p className="mt-12">
        <Link className="link-quiet font-medium" href="/werkzeuge/temperatur-hilfslinie">Hilfslinie ohne Konto ausprobieren</Link>
      </p>
    </main><BlogFooter />
  </div>
}
