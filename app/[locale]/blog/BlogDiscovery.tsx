import Link from 'next/link'
import { BLOG_TOPICS, featuredPosts } from '@/lib/seo-autopilot/discovery'
import { topicPath } from '@/lib/blog-urls'
import { getOptionalPosts } from './posts'
import { BlogPostCard } from './BlogPostCard'

export function BlogTopicsNav({ locale = 'de' }: { locale?: string }) {
  return <nav aria-label="Blogthemen" className="flex flex-wrap gap-3">
    {BLOG_TOPICS.map((topic) => <Link key={topic.slug} href={topicPath(topic.slug, locale)} className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700">{topic.title}</Link>)}
  </nav>
}

export async function HomeArticleLinks() {
  const posts = featuredPosts(await getOptionalPosts('de'))
  if (!posts.length) return null
  return <section aria-labelledby="ratgeber" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
    <h2 id="ratgeber" className="mb-6 text-3xl font-extrabold">Basaltemperatur und Zyklus dokumentieren</h2>
    <BlogTopicsNav />
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} headingLevel="h3" />)}</div>
  </section>
}
