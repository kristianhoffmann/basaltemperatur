import { describe, expect, it } from 'vitest'
import { featuredPosts, getPostTopics, relatedPosts, resolveInternalLinks, topicPosts } from './discovery'
import { blogPath, blogUrl } from '@/lib/blog-urls'
import { articleSchema } from './structured-data'
import type { BlogPost } from '@/app/[locale]/blog/posts'

export function post(slug: string, title = 'Basaltemperatur messen'): BlogPost {
  return { id: slug, slug, title, locale: 'de', meta_description: '', hero_image_url: null,
    hero_image_alt: null, tags: [], author: { name: 'Kristian Hoffmann', bio: 'Testbiografie' },
    published_at: '2026-10-31T12:00:00Z', updated_at: '2026-11-01T12:00:00Z',
    mdx_body: 'Testtext', schema_jsonld: { datePublished: '2026-10-26', author: { name: 'Falsch' } }, internal_links: [] }
}

describe('article discovery', () => {
  it('builds canonical article URLs centrally', () => {
    expect(blogPath('de', 'kurve')).toBe('/de/blog/kurve')
    expect(blogUrl('de', 'kurve')).toBe('https://www.basaltemperatur.online/de/blog/kurve')
  })
  it('groups temperature and diary content without promoting generic privacy or email articles', () => {
    expect(getPostTopics(post('messen'))).toContain('temperaturkurven')
    expect(getPostTopics(post('email', 'Kostenlose E-Mail-Adresse erstellen'))).toEqual([])
    expect(getPostTopics(post('behoerde', 'Berliner Datenschutzbehörde'))).toEqual([])
    expect(topicPosts([post('kurve'), post('email', 'E-Mail')], 'temperaturkurven')).toHaveLength(1)
  })
  it('prefers topic relevance and distributes ties by existing incoming links, not latest date', () => {
    const current = post('start')
    const popular = post('popular')
    const weak = post('weak')
    const other = { ...post('other', 'Zyklus-App Vergleich'), internal_links: [{ targetSlug: 'popular', anchorText: 'Kurve' }] }
    expect(relatedPosts(current, [current, popular, weak, other], 1)[0]?.slug).toBe('weak')
  })
  it('renders only existing, local, deduplicated stored article targets', () => {
    const current = { ...post('start'), internal_links: [
      { targetSlug: 'kurve', anchorText: 'Temperaturkurve' },
      { targetSlug: 'kurve', anchorText: 'Doppelt' },
      { targetSlug: 'start', anchorText: 'Selbst' },
      { targetSlug: 'https://example.test', anchorText: 'Extern' },
      { targetSlug: 'missing', anchorText: 'Fehlt' },
    ] }
    expect(resolveInternalLinks(current, [current, post('kurve')])).toEqual([
      { href: '/de/blog/kurve', label: 'Temperaturkurve' },
    ])
  })
  it('rebuilds schema author, dates and URL from displayed data and escapes script closers', () => {
    const article = post('kurve')
    const schema = articleSchema(article)
    const graph = schema['@graph'] as Record<string, unknown>[]
    expect(graph[0]).toMatchObject({ '@type': 'BlogPosting', datePublished: article.published_at,
      dateModified: article.updated_at, url: blogUrl('de', 'kurve'),
      author: { '@type': 'Person', name: 'Kristian Hoffmann', url: expect.stringContaining('/autor/') } })
    expect(JSON.stringify(schema)).not.toContain('2026-10-26')
  })
})

it('distributes equally relevant recommendations across source articles', () => {
  const posts = Array.from({ length: 8 }, (_, index) => post(`kurve-${index}`))
  const incoming = new Map(posts.map((item) => [item.slug, 0]))
  for (const source of posts) {
    for (const target of relatedPosts(source, posts)) incoming.set(target.slug, incoming.get(target.slug)! + 1)
  }
  expect([...incoming.values()]).toEqual(Array(8).fill(3))
})
it('selects homepage articles from product topics and leaves unrelated posts out', () => {
  const posts = [post('messen'), post('tagebuch', 'Zyklustagebuch führen'), post('app', 'Zyklus-App Vergleich'), post('email', 'E-Mail erstellen')]
  expect(featuredPosts(posts).map((item) => item.slug)).toEqual(['messen', 'tagebuch', 'app'])
})

it('does not recommend an unrelated article just because generic words overlap', () => {
  const current = post('app', 'Zyklus-App Datenschutz')
  const unrelated = post('behoerde', 'Berliner Datenschutzbehörde Datenschutz')
  expect(relatedPosts(current, [current, unrelated])).toEqual([])
})
it('provides the shared Organization and WebSite identities for the root layout', async () => {
  const { siteSchema } = await import('./structured-data')
  expect(siteSchema()['@graph'].map((item) => item['@type'])).toEqual(['Organization', 'WebSite'])
})
