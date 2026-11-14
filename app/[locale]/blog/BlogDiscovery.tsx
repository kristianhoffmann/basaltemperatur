import Link from 'next/link'
import { BLOG_TOPICS, featuredPosts, topicPosts } from '@/lib/seo-autopilot/discovery'
import { topicPath } from '@/lib/blog-urls'
import { getOptionalPosts, type BlogPostSummary } from './posts'
import { BlogPostCard } from './BlogPostCard'

// Pass `posts` to list only topics that have articles; an empty hub is a dead end.
export function BlogTopicsNav({ locale = 'de', posts }: { locale?: string; posts?: BlogPostSummary[] }) {
  const topics = posts ? BLOG_TOPICS.filter((topic) => topicPosts(posts, topic.slug).length > 0) : BLOG_TOPICS
  if (!topics.length) return null
  return <nav aria-label="Themen im Ratgeber" className="flex flex-wrap gap-3">
    {topics.map((topic) => <Link key={topic.slug} href={topicPath(topic.slug, locale)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--card-border)] transition-transform hover:-translate-y-0.5">{topic.title}</Link>)}
  </nav>
}

export async function HomeArticleLinks() {
  const allPosts = await getOptionalPosts('de')
  const posts = featuredPosts(allPosts)
  if (!posts.length) return null
  const firstImage = posts.find((post) => post.hero_image_url)
  return <section aria-labelledby="ratgeber" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="ratgeber" className="font-display text-5xl text-[var(--text)] sm:text-6xl">Aus dem Ratgeber</h2>
        <p className="mt-3 max-w-xl text-[var(--text-secondary)]">Basaltemperatur richtig messen, Kurven lesen, Zyklus dokumentieren.</p>
      </div>
      <Link href="/de/blog" className="link-quiet shrink-0 text-[15px] font-medium">Alle Artikel</Link>
    </div>
    <BlogTopicsNav posts={allPosts} />
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogPostCard key={post.id} post={post} headingLevel="h3" priority={post === firstImage} />)}</div>
  </section>
}
