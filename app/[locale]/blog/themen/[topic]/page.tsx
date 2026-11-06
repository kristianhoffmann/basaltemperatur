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
  return { title: entry.title, description: entry.description, alternates: { canonical: `${getSeoSiteUrl()}${topicPath(entry.slug, locale)}` } }
}
export default async function TopicPage({ params }: Props) {
  const { locale, entry } = await getTopic(params)
  const posts = topicPosts(await getCachedPosts(locale), entry.slug)
  return <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
    <BlogHeader locale={locale} /><main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">{entry.title}</h1><p className="my-6 text-lg">{entry.description}</p>
      <BlogTopicsNav locale={locale} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} />)}</div>
      {!posts.length && <p className="mt-8">Zu diesem Thema sind noch keine Artikel veröffentlicht.</p>}
    </main><BlogFooter />
  </div>
}
