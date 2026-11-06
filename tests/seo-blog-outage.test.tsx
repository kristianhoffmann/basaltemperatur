import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const storage = vi.hoisted(() => ({ listPosts: vi.fn(), getPost: vi.fn() }))
vi.mock('@/lib/seo-autopilot/storage', () => storage)
vi.mock('next/cache', () => ({ unstable_cache: (read: () => unknown) => read }))

import { HomeArticleLinks } from '@/app/[locale]/blog/BlogDiscovery'
import About from '@/app/ueber-uns/page'
import Tool from '@/app/werkzeuge/temperatur-hilfslinie/page'
import Topic from '@/app/[locale]/blog/themen/[topic]/page'
import Author, { generateMetadata } from '@/app/[locale]/blog/autor/[name]/page'
import sitemap from '@/lib/seo-autopilot/sitemap'
import { GET as llms } from '@/app/llms.txt/route'
import { GET as sitemapResponse } from '@/app/sitemap.xml/route'
import { getCachedPosts } from '@/app/[locale]/blog/posts'

const authorParams = { params: Promise.resolve({ locale: 'de', name: 'testautor' }) }
const post = { id: 'test', slug: 'temperaturkurve', title: 'Temperaturkurve', locale: 'de',
  meta_description: 'Temperatur dokumentieren', tags: [], author: { name: 'Testautor' },
  published_at: '2026-11-01T12:00:00Z' }

beforeEach(() => {
  storage.listPosts.mockReset()
  storage.getPost.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

it.each(['Storage list error: fetch failed', 'Storage configuration: SEO_AUTOPILOT_SITE_ID is required.'])('keeps surrounding pages available on %s', async (message) => {
  storage.listPosts.mockRejectedValue(new Error(message))
  expect(await HomeArticleLinks()).toBeNull()
  expect(renderToStaticMarkup(await About())).toContain('Über Basaltemperatur')
  expect(renderToStaticMarkup(await Tool({ searchParams: Promise.resolve({}) }))).toContain('Temperatur-Hilfslinie berechnen')
  await expect(Topic({ params: Promise.resolve({ locale: 'de', topic: 'temperaturkurven' }) })).rejects.toThrow(message)
  await expect(Author(authorParams)).rejects.toThrow(message)
  await expect(generateMetadata(authorParams)).rejects.toThrow(message)
  expect(console.error).toHaveBeenCalled()
  // Article and blog routes still need to distinguish an outage from an empty index.
  await expect(getCachedPosts('de')).rejects.toThrow(message)
})

it('propagates failed biography reads', async () => {
  storage.listPosts.mockResolvedValue([post])
  storage.getPost.mockRejectedValue(new Error('Storage read error'))
  await expect(Author(authorParams)).rejects.toThrow('Storage read error')
  await expect(generateMetadata(authorParams)).rejects.toThrow('Storage read error')
})

it('fails discovery on outage and retries when storage recovers', async () => {
  storage.listPosts.mockRejectedValue(new Error('Storage list error'))
  await expect(sitemap()).rejects.toThrow('Storage list error')
  const response = await llms()
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
  expect(response.headers.get('cache-control')).toBe('no-store')
  const xml = await sitemapResponse()
  expect(xml.status).toBe(503)
  expect(xml.headers.get('retry-after')).toBe('60')
  expect(xml.headers.get('cache-control')).toBe('no-store')

  storage.listPosts.mockResolvedValue([post])
  expect((await sitemap()).some((entry) => entry.url.endsWith('/de/blog/temperaturkurve'))).toBe(true)
  const recoveredXml = await sitemapResponse()
  expect(recoveredXml.status).toBe(200)
  expect(await recoveredXml.text()).toContain('/de/blog/temperaturkurve</loc>')
  expect(await (await llms()).text()).toContain('/de/blog/temperaturkurve')
  expect(renderToStaticMarkup((await HomeArticleLinks())!)).toContain('/de/blog/temperaturkurve')
})
