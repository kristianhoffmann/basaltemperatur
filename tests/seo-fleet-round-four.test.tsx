import { beforeEach, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { BlogPost } from '@/app/[locale]/blog/posts'

const posts: BlogPost[] = []
vi.mock('@/app/[locale]/blog/posts', async (original) => ({
  ...await original<typeof import('@/app/[locale]/blog/posts')>(),
  getCachedPosts: async () => posts,
  getOptionalPosts: async () => posts,
  getCachedPost: async (_locale: string, slug: string) => posts.find((post) => post.slug === slug),
}))

import Author, { generateMetadata } from '@/app/[locale]/blog/autor/[name]/page'
import Topic from '@/app/[locale]/blog/themen/[topic]/page'
import Article from '@/app/[locale]/blog/[slug]/page'
import About from '@/app/ueber-uns/page'
import Tool from '@/app/werkzeuge/temperatur-hilfslinie/page'
import { metadata as withdrawalMetadata } from '@/app/(legal)/widerruf-ausueben/page'
import sitemap from '@/lib/seo-autopilot/sitemap'

function post(slug: string, title = 'Basaltemperatur messen'): BlogPost {
  return { id: slug, slug, title, locale: 'de', meta_description: 'Temperatur und Zyklus dokumentieren.',
    hero_image_url: null, hero_image_alt: null, tags: null, author: { name: 'Kristian Hoffmann' },
    published_at: '2026-11-01T12:00:00Z', updated_at: null, mdx_body: 'Alter Artikel ohne gespeichertes Schema.',
    schema_jsonld: null, internal_links: [] }
}

beforeEach(() => { posts.length = 0 })

it('uses a directly resolvable author slug consistently in sitemap, profile and canonical', async () => {
  posts.push(post('messen'))
  const params = Promise.resolve({ locale: 'de', name: 'kristian-hoffmann' })
  const profile = renderToStaticMarkup(await Author({ params }))
  expect(profile).toContain('Kristian Hoffmann')
  expect(profile).toContain('href="/de/blog/messen"')
  expect((await generateMetadata({ params })).alternates?.canonical).toBe('https://www.basaltemperatur.online/de/blog/autor/kristian-hoffmann')
  const urls = (await sitemap()).map((entry) => entry.url)
  expect(urls).toContain('https://www.basaltemperatur.online/de/blog/autor/kristian-hoffmann')
  expect(urls.some((url) => /%20|\s/.test(url))).toBe(false)
})

it('omits empty topic hubs from the sitemap and gives withdrawal its own canonical', async () => {
  posts.push(post('messen'))
  const urls = (await sitemap()).map((entry) => entry.url)
  expect(urls).toContain('https://www.basaltemperatur.online/de/blog/themen/temperaturkurven')
  expect(urls).not.toContain('https://www.basaltemperatur.online/de/blog/themen/zyklustagebuch')
  expect(withdrawalMetadata.alternates?.canonical).toBe('/widerruf-ausueben')
})

it('gives every article three distinct rendered incoming links even with missing tags and unmatched topics', async () => {
  posts.push(...Array.from({ length: 36 }, (_, index) => post(`temperatur-${index}`)),
    post('ist-flo-kostenlos-gratis-premium-check', 'Ist Flo kostenlos?'),
    post('kostenlose-e-mail-adresse-erstellen-2', 'Kostenlose E-Mail-Adresse erstellen'),
    post('dsgvo-einfach-erklaert-zyklusdaten', 'DSGVO einfach erklärt: Zyklusdaten'))
  const inbound = new Map(posts.map((item) => [item.slug, new Set<string>()]))
  for (const source of posts) {
    const html = renderToStaticMarkup(await Article({ params: Promise.resolve({ locale: 'de', slug: source.slug }) }))
    for (const target of posts) {
      if (target.slug !== source.slug && html.includes(`href="/de/blog/${target.slug}"`)) inbound.get(target.slug)!.add(source.slug)
    }
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]))
    const graph = schemas.flatMap((schema) => schema['@graph'] ?? [schema])
    expect(graph).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'BlogPosting', author: expect.objectContaining({ '@type': 'Person', name: 'Kristian Hoffmann' }) }),
      expect.objectContaining({ '@type': 'BreadcrumbList' }),
    ]))
  }
  expect([...inbound].filter(([, sources]) => sources.size < 3)).toEqual([])
})

it.each(['topic', 'author'])('loads the first available %s hub image eagerly and keeps later cards lazy', async (kind) => {
  posts.push(post('ohne-bild'), { ...post('mit-bild'), hero_image_url: '/first.jpg' }, { ...post('spaeter'), hero_image_url: '/later.jpg' })
  const page = kind === 'topic'
    ? await Topic({ params: Promise.resolve({ locale: 'de', topic: 'temperaturkurven' }) })
    : await Author({ params: Promise.resolve({ locale: 'de', name: 'kristian-hoffmann' }) })
  const main = renderToStaticMarkup(page).split('<main')[1].split('</main>')[0]
  const images = main.match(/<img[^>]*>/g) ?? []
  expect(images[0]).toContain('loading="eager"')
  expect(images[0]).toContain('fetchPriority="high"')
  expect(images[1]).toContain('loading="lazy"')
})

it('keeps about and tool pages free of unnecessary content images and reuses an eager small logo', async () => {
  for (const page of [await About(), await Tool({ searchParams: Promise.resolve({}) })]) {
    const html = renderToStaticMarkup(page)
    expect(html.split('<main')[1].split('</main>')[0]).not.toContain('<img')
    expect(html.split('<footer')[1].match(/<img[^>]*>/)?.[0]).toContain('loading="eager"')
  }
})
