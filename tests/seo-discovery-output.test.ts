import { expect, it, vi } from 'vitest'
import { renderLlms } from '@/lib/seo-autopilot/llms'
import type { BlogPostSummary } from '@/app/[locale]/blog/posts'
const posts: BlogPostSummary[] = [{ id: 'test', locale: 'de', slug: 'temperaturkurve', title: 'Temperaturkurve',
  meta_description: 'Temperatur dokumentieren', hero_image_url: null, hero_image_alt: null,
  tags: [], author: { name: 'Testautor' }, published_at: '2026-10-31T12:00:00Z', updated_at: '2026-11-01T12:00:00Z' }]
vi.mock('@/app/[locale]/blog/posts', () => ({ getCachedPosts: async () => posts }))
import sitemap from '@/lib/seo-autopilot/sitemap'
it('includes all published articles, topics and authors in llms.txt', () => {
  const text = renderLlms(posts)
  expect(text).toContain('https://www.basaltemperatur.online/de/blog/temperaturkurve')
  expect(text).toContain('/themen/temperaturkurven')
  expect(text).toContain('/autor/testautor')
})
it('uses real article revision dates and omits invented static lastmods', async () => {
  const entries = await sitemap()
  expect(entries.find((entry) => entry.url.endsWith('/temperaturkurve'))?.lastModified).toBe(posts[0].updated_at)
  expect(entries.find((entry) => entry.url.endsWith('/impressum'))?.lastModified).toBeUndefined()
})
it('includes the public tool and about page in discovery documents', async () => {
  const entries = await sitemap()
  expect(entries.some((entry) => entry.url.endsWith('/werkzeuge/temperatur-hilfslinie'))).toBe(true)
  expect(entries.some((entry) => entry.url.endsWith('/ueber-uns'))).toBe(true)
  expect(renderLlms(posts)).toContain('/werkzeuge/temperatur-hilfslinie')
})
