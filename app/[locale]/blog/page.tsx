import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'
import { BlogIndexView } from './BlogIndexView'
import { getCachedPosts } from './posts'

interface Props {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return BLOG_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  // Vor dem ersten Flush pruefen, sonst bleibt die Antwort auf 200 stehen und
  // /<beliebig>/blog waere eine unbegrenzte, indexierbare URL-Flaeche.
  if (!isBlogLocale(locale)) notFound()

  return {
    // absolute: sonst haengt das Root-Layout ein zweites " | Basaltemperatur" an.
    title: { absolute: 'Zyklus und Temperaturkurven | Basaltemperatur' },
    description: 'Ratgeber zur Zyklusbeobachtung: Basaltemperatur messen, Temperaturkurven verstehen und Zyklus-Apps nach Funktionen, Kosten und Datenschutz vergleichen.',
    alternates: {
      canonical: `${getSeoSiteUrl()}/${locale}/blog`,
    },
  }
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params

  if (!isBlogLocale(locale)) notFound()

  const posts = await getCachedPosts(locale)
  return <BlogIndexView locale={locale} posts={posts} />
}
