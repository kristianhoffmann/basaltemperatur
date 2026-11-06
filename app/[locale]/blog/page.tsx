import { BLOG_PAGE_SIZE, blogPage } from '@/lib/blog-pagination'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { blogUrl } from '@/lib/blog-urls'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'
import { BlogIndexView } from './BlogIndexView'
import { getCachedPosts } from './posts'

// Read at request time so an unavailable blog database cannot fail the build.
// The proxy returns a retryable 503 for runtime outages before streaming starts.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ page?: string | string[] }>
}

export function generateStaticParams() {
  return BLOG_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params

  // Vor dem ersten Flush pruefen, sonst bleibt die Antwort auf 200 stehen und
  // /<beliebig>/blog waere eine unbegrenzte, indexierbare URL-Flaeche.
  if (!isBlogLocale(locale)) notFound()

  const page = blogPage((await searchParams)?.page)
  const posts = await getCachedPosts(locale)
  if (!page || page > Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE))) notFound()
  return {
    // absolute: sonst haengt das Root-Layout ein zweites " | Basaltemperatur" an.
    title: { absolute: 'Zyklus und Temperaturkurven | Basaltemperatur' },
    description: 'Ratgeber zur Zyklusbeobachtung: Basaltemperatur messen, Temperaturkurven verstehen und Zyklus-Apps nach Funktionen, Kosten und Datenschutz vergleichen.',
    alternates: {
      canonical: `${blogUrl(locale)}${page > 1 ? `?page=${page}` : ''}`,
    },
  }
}

export default async function BlogIndexPage({ params, searchParams }: Props) {
  const { locale } = await params

  if (!isBlogLocale(locale)) notFound()

  const posts = await getCachedPosts(locale)
  const page = blogPage((await searchParams)?.page)
  if (!page || page > Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE))) notFound()
  return <BlogIndexView locale={locale} posts={posts} page={page} />
}
