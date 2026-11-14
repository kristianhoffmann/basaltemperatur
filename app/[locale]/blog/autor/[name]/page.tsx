import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { authorPath, authorSlug } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { isBlogLocale } from '@/lib/blog-locales'
import { getCachedPosts, getCachedPost } from '../../posts'
import { BlogHeader, BlogFooter } from '../../BlogChrome'
import { BlogPostCard } from '../../BlogPostCard'
import { serializeJsonLd } from '@/lib/seo-autopilot/structured-data'

type Props = { params: Promise<{ locale: string; name: string }> }
async function authorData(params: Props['params']) {
  const { locale, name } = await params
  if (!isBlogLocale(locale)) notFound()
  const posts = (await getCachedPosts(locale)).filter((post) => post.author?.name && authorSlug(post.author.name) === name)
  // Use the stored author data from an actual article, never inferred credentials.
  if (!posts.length) notFound()
  const article = await getCachedPost(locale, posts[0].slug)
  if (!article?.author?.name) notFound()
  return { locale, posts, author: article.author }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, author } = await authorData(params)
  if (!author) return { title: 'Autoren im Blog' }
  const url = `${getSeoSiteUrl()}${authorPath(author.name!, locale)}`
  const description = `Ratgeber-Artikel von ${author.name} zu Basaltemperatur, Temperaturkurven und Zyklusdokumentation.`
  return { title: `Artikel von ${author.name}`, description, alternates: { canonical: url },
    openGraph: { title: `Artikel von ${author.name}`, description, url, type: 'profile' } }
}
export default async function AuthorPage({ params }: Props) {
  const { locale, posts, author } = await authorData(params)
  const firstImage = posts.find((post) => post.hero_image_url)
  const site = getSeoSiteUrl()
  const url = `${site}${authorPath(author.name!, locale)}`
  // Only stored author data; no invented credentials.
  const schema = { '@context': 'https://schema.org', '@type': 'ProfilePage', '@id': `${url}#page`, url, inLanguage: 'de-DE',
    mainEntity: { '@type': 'Person', '@id': `${url}#person`, name: author.name, url,
      ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}), ...(author.bio ? { description: author.bio } : {}),
      worksFor: { '@id': `${site}/#organization` } } }
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><BlogHeader locale={locale} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
    <main id="inhalt" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><p className="eyebrow">Ratgeber · Autor</p><h1 className="font-display mt-3 text-4xl text-[var(--text)] sm:text-5xl">{author?.name ?? 'Autoren im Blog'}</h1>
      {author?.jobTitle && <p className="mt-4 text-lg text-[var(--text-secondary)]">{author.jobTitle}</p>}
      {author?.bio && <p className="mt-4 max-w-3xl leading-8 text-[var(--text-secondary)]">{author.bio}</p>}
      <h2 className="mt-12 text-2xl font-semibold">Veröffentlichte Artikel</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} headingLevel="h3" priority={post === firstImage} />)}</div>
    </main><BlogFooter /></div>
}
