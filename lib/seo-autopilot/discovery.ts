import type { BlogPostSummary } from '@/app/[locale]/blog/posts'
import { blogPath } from '@/lib/blog-urls'

type TopicPost = { slug: string; title: string; tags: string[] | null }
type LinkedPost = TopicPost & { locale?: string; internal_links?: { targetSlug: string; anchorText: string }[] | null }

// Categories describe the existing product and blog; they make no clinical claims.
export const BLOG_TOPICS = [
  { slug: 'temperaturkurven', title: 'Basaltemperatur und Temperaturkurven', description: 'Artikel zum Messen, Dokumentieren und rückblickenden Lesen von Temperaturkurven.', pattern: /temperatur|messzeit|störfaktor|stoerfaktor|thermometer/i },
  { slug: 'zyklustagebuch', title: 'Zyklustagebuch und Periodenkalender', description: 'Artikel zur Dokumentation von Zyklus und Periode.', pattern: /zyklustagebuch|zyklusbeobachtung|perioden(?:kalender|tagebuch)|zyklus(?:tage|länge|laenge|dokumentation)/i },
  { slug: 'zyklus-apps', title: 'Zyklus-Apps und Datenschutz', description: 'Artikel zu Funktionen, Kosten und Datenschutz von Zyklus- und Perioden-Apps.', pattern: /(?:zyklus|perioden|temperatur|tracking|nfp)[ -]?app|app[ -]?(?:vergleich|zyklus)|cycle[ -]?track/i },
] as const

export function getPostTopics(post: TopicPost): string[] {
  // Title and slug determine relevance; generic tags must not promote unrelated articles.
  const text = `${post.title} ${post.slug.replace(/-/g, ' ')}`
  return BLOG_TOPICS.filter((topic) => topic.pattern.test(text)).map((topic) => topic.slug)
}

function tokens(post: TopicPost) {
  return new Set(`${post.title} ${(post.tags ?? []).join(' ')}`.toLocaleLowerCase('de-DE')
    .match(/[\p{L}\p{N}]{4,}/gu)?.filter((word) => !['eine', 'einen', 'deine', 'deinen', 'kostenlos', 'kostenlose', 'besten', 'vergleich', '2026'].includes(word)) ?? [])
}

export function topicPosts<T extends TopicPost>(posts: T[], topic: string): T[] {
  return posts.filter((post) => getPostTopics(post).includes(topic))
}

export function relatedPosts<T extends LinkedPost>(post: LinkedPost, posts: T[], limit = 3): T[] {
  const topics = getPostTopics(post)
  const words = tokens(post)
  const incoming = new Map<string, number>()
  for (const item of posts) {
    for (const target of new Set((item.internal_links ?? []).map((link) => link.targetSlug))) {
      incoming.set(target, (incoming.get(target) ?? 0) + 1)
    }
  }
  // Rotate ties per source so equal candidates do not concentrate on the same three URLs.
  const order = [...new Set([post.slug, ...posts.map((item) => item.slug)])].sort()
  const position = new Map(order.map((slug, index) => [slug, index]))
  const distance = (slug: string) => ((position.get(slug) ?? 0) - position.get(post.slug)! + order.length) % order.length
  return posts.filter((item) => item.slug !== post.slug && (!post.locale || item.locale === post.locale)
      && (!topics.length || getPostTopics(item).some((topic) => topics.includes(topic))))
    .map((item) => ({ item, score: getPostTopics(item).filter((topic) => topics.includes(topic)).length * 10
      + [...tokens(item)].filter((word) => words.has(word)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (incoming.get(a.item.slug) ?? 0) - (incoming.get(b.item.slug) ?? 0) || distance(a.item.slug) - distance(b.item.slug))
    .slice(0, limit).map(({ item }) => item)
}

export function resolveInternalLinks(post: LinkedPost, posts: BlogPostSummary[]) {
  const seen = new Set([post.slug])
  return (post.internal_links ?? []).flatMap((link) => {
    const target = posts.find((item) => item.slug === link.targetSlug && item.locale === post.locale)
    if (!target || seen.has(target.slug)) return []
    seen.add(target.slug)
    return [{ href: blogPath(target.locale, target.slug), label: link.anchorText.trim() || target.title }]
  })
}

export function featuredPosts<T extends LinkedPost>(posts: T[], limit = 6): T[] {
  const selected = new Map<string, T>()
  // Choose across topics, preferring less linked articles within each topic.
  for (let round = 0; round < limit; round++) {
    for (const topic of BLOG_TOPICS) {
      const candidates = topicPosts(posts, topic.slug).filter((post) => !selected.has(post.slug))
      const next = candidates.sort((a, b) => {
        const count = (slug: string) => posts.filter((post) => post.internal_links?.some((link) => link.targetSlug === slug)).length
        return count(a.slug) - count(b.slug) || a.slug.localeCompare(b.slug)
      })[0]
      if (next && selected.size < limit) selected.set(next.slug, next)
    }
  }
  return [...selected.values()]
}
