import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
const fixturePosts: BlogPost[] = []
vi.mock('@/app/[locale]/blog/posts', async (original) => ({ ...await original<typeof import('@/app/[locale]/blog/posts')>(), getCachedPosts: async () => fixturePosts, getOptionalPosts: async () => fixturePosts, getCachedPost: async (_locale: string, slug: string) => fixturePosts.find((post) => post.slug === slug) }))
import Tool from '@/app/werkzeuge/temperatur-hilfslinie/page'
import { BlogArticleView } from '@/app/[locale]/blog/[slug]/BlogArticleView'
import type { BlogPost } from '@/app/[locale]/blog/posts'
const post = (slug: string): BlogPost => ({ id: slug, slug, title: 'Temperatur messen', locale: 'de', meta_description: 'Temperatur dokumentieren', hero_image_url: null, hero_image_alt: null, tags: [], author: { name: 'Testautor' }, published_at: '2026-11-01T12:00:00Z', updated_at: null, mdx_body: '', schema_jsonld: {}, internal_links: [] })
it('renders a useful calculation, example and direct attributed signup without login or JavaScript', async () => {
  const html = renderToStaticMarkup(await Tool({ searchParams: Promise.resolve({ from: 'messen', t1: '36.2', t2: '36.3', t3: '36.4', t4: '36.2', t5: '36.1', t6: '36.3' }) }))
  expect(html).toContain('36,40')
  expect(html).toContain('Beispiel')
  expect(html).toContain('href="/registrieren?from=messen"')
  expect(html).toContain('name="from"')
})
it('shows two contextual attributed article CTAs, including one between article paragraphs', () => {
  const article = { ...post('messen'), mdx_body: 'Erster Absatz.\n\nZweiter Absatz.' }
  const html = renderToStaticMarkup(<BlogArticleView post={article} locale="de" related={[]} />)
  const link = '/werkzeuge/temperatur-hilfslinie?from=messen'
  expect(html.split(link).length - 1).toBeGreaterThanOrEqual(2)
  expect(html.indexOf(link)).toBeGreaterThan(html.indexOf('Erster Absatz.'))
  expect(html.indexOf(link)).toBeLessThan(html.indexOf('Zweiter Absatz.'))
})
it('keeps temperature inputs out of URLs and server requests', async () => {
  const html = renderToStaticMarkup(await Tool({ searchParams: Promise.resolve({}) }))
  expect(/name="t[1-6]"/.test(html)).toBe(false)
  expect(html).toContain('nur in deinem Browser')
})

it('links a temperature article from three distinct server-rendered pages outside the blog index', async () => {
  fixturePosts.push(post('messen'))
  try {
    const { default: Topic } = await import('@/app/[locale]/blog/themen/[topic]/page')
    const { default: Author } = await import('@/app/[locale]/blog/autor/[name]/page')
    const pages = [
      await Tool({ searchParams: Promise.resolve({}) }),
      await Topic({ params: Promise.resolve({ locale: 'de', topic: 'temperaturkurven' }) }),
      await Author({ params: Promise.resolve({ locale: 'de', name: 'testautor' }) }),
    ]
    for (const page of pages) expect(renderToStaticMarkup(page).includes('href="/de/blog/messen"')).toBe(true)
  } finally { fixturePosts.length = 0 }
})
it('describes the public calculator as free software with its canonical URL', async () => {
  const html = renderToStaticMarkup(await Tool({ searchParams: Promise.resolve({}) }))
  expect(html).toContain('"@type":"SoftwareApplication"')
  expect(html).toContain('"price":"0"')
  expect(html).toContain('"url":"https://www.basaltemperatur.online/werkzeuge/temperatur-hilfslinie"')
})
