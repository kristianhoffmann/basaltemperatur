import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogHeader, BlogFooter } from '@/app/[locale]/blog/BlogChrome'
import { getOptionalPosts } from '@/app/[locale]/blog/posts'
import { authorPath } from '@/lib/blog-urls'
import { getLegalCompany } from '@/lib/legal/config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Über Basaltemperatur',
  description: 'Produktzweck, Betreiber und Autoren von Basaltemperatur, dem persönlichen Tagebuch für Temperatur und Periode.',
  alternates: { canonical: '/ueber-uns' },
}
export default async function AboutPage() {
  const company = getLegalCompany()
  const authors = [...new Set((await getOptionalPosts('de')).flatMap((post) => post.author?.name ? [post.author.name] : []))]
  return <div className="min-h-screen bg-slate-50 text-slate-900"><BlogHeader locale="de" />
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-12">
      <h1 className="text-3xl font-bold">Über Basaltemperatur</h1>
      <p>Basaltemperatur ist ein persönliches Zyklustagebuch. Du kannst Temperatur und Periodentage kostenlos erfassen und bei Bedarf die Analyse einmalig freischalten.</p>
      <p>Die App ist kein Medizinprodukt, kein Verhütungsmittel und kein Diagnosewerkzeug. Sie bestimmt keine fruchtbaren Tage und ersetzt keine ärztliche Beratung. Prognosen sind statistische Schätzungen.</p>
      <h2 className="text-2xl font-bold">Betreiber und Kontakt</h2>
      <p>{company.name}. Die vollständigen Anbieterangaben und Kontaktmöglichkeiten stehen im <Link className="text-rose-700 underline" href="/impressum">Impressum</Link>.</p>
      <h2 className="text-2xl font-bold">Autoren im Blog</h2>
      <p>Die Profile zeigen die bei den veröffentlichten Artikeln hinterlegten Autorenangaben.</p>
      <ul className="space-y-3">{authors.map((name) => <li key={name}><Link className="text-rose-700 underline" href={authorPath(name)}>{name}</Link></li>)}</ul>
      <Link className="text-rose-700 underline" href="/werkzeuge/temperatur-hilfslinie">Hilfslinie ohne Konto ausprobieren</Link>
    </main><BlogFooter />
  </div>
}
