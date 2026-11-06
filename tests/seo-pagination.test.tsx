import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlogIndexView } from '@/app/[locale]/blog/BlogIndexView'
import type { BlogPostSummary } from '@/app/[locale]/blog/posts'
const posts: BlogPostSummary[] = Array.from({ length: 25 }, (_, index) => ({ id: String(index), slug: `artikel-${index}`, locale: 'de', title: `Artikel ${index}`, meta_description: 'Temperatur dokumentieren', hero_image_url: null, hero_image_alt: null, author: null, tags: [], published_at: '2026-11-01T12:00:00Z', updated_at: null }))
it('paginates with server-rendered links and keeps the oldest article accessible', () => {
  const first = renderToStaticMarkup(<BlogIndexView locale="de" posts={posts} page={1} />)
  expect(first).toContain('href="/de/blog?page=2"')
  expect(first).not.toContain('href="/de/blog/artikel-24"')
  const last = renderToStaticMarkup(<BlogIndexView locale="de" posts={posts} page={3} />)
  expect(last).toContain('href="/de/blog/artikel-24"')
  expect(last).not.toContain('href="/de/blog/artikel-0"')
})
