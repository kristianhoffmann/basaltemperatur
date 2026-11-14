import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOG_TOPICS, topicPosts } from '@/lib/seo-autopilot/discovery'
import { topicPath } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
import { isBlogLocale } from '@/lib/blog-locales'
import { getCachedPosts } from '../../posts'
import { BlogHeader, BlogFooter } from '../../BlogChrome'
import { BlogTopicsNav } from '../../BlogDiscovery'
import { BlogPostCard } from '../../BlogPostCard'

type Props = { params: Promise<{ locale: string; topic: string }> }
async function getTopic(params: Props['params']) {
  const { locale, topic } = await params
  const entry = BLOG_TOPICS.find((item) => item.slug === topic)
  if (!isBlogLocale(locale) || !entry) notFound()
  return { locale, entry }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, entry } = await getTopic(params)
  const url = `${getSeoSiteUrl()}${topicPath(entry.slug, locale)}`
  // A hub without articles is thin content: keep it reachable, but out of the index.
  const empty = topicPosts(await getCachedPosts(locale), entry.slug).length === 0
  return {
    title: entry.title, description: entry.description, alternates: { canonical: url },
    openGraph: { title: entry.title, description: entry.description, url, type: 'website' },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  }
}
export default async function TopicPage({ params }: Props) {
  const { locale, entry } = await getTopic(params)
  const posts = topicPosts(await getCachedPosts(locale), entry.slug)
  const firstImage = posts.find((post) => post.hero_image_url)
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <BlogHeader locale={locale} /><main id="inhalt" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="eyebrow">Ratgeber · Thema</p>
      <h1 className="font-display mt-3 text-4xl text-[var(--text)] sm:text-5xl">{entry.title}</h1><p className="my-6 max-w-2xl text-lg text-[var(--text-secondary)]">{entry.description}</p>
      <BlogTopicsNav locale={locale} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} priority={post === firstImage} />)}</div>
      {!posts.length && <p className="mt-8">Zu diesem Thema sind noch keine Artikel veröffentlicht.</p>}
    </main><BlogFooter />
  </div>
}
