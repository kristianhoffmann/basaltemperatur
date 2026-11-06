import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import payloads from './fixtures/autopilot-publish-real.json'
import { signPayload } from '@/lib/seo-autopilot/hmac'
import { articleSchema } from '@/lib/seo-autopilot/structured-data'
import type { BlogPost } from '@/app/[locale]/blog/posts'

const db = vi.hoisted(() => ({ writes: [] as { table: string; row: Record<string, unknown> }[] }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (table: string) => {
  const query = { select: () => query, eq: () => query, order: () => query,
    range: async () => ({ data: [], error: null }),
    upsert: async (row: Record<string, unknown>) => { db.writes.push({ table, row }); return { error: null } },
  }
  return query
} }) }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
vi.mock('next/server', async (original) => ({ ...await original<typeof import('next/server')>(), after: vi.fn() }))
import { POST } from '@/app/api/seo-autopilot/publish/route'

beforeEach(() => {
  db.writes.length = 0
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'offline-contract-secret')
  vi.stubEnv('SEO_AUTOPILOT_SITE_ID', payloads[0].siteId)
  vi.stubEnv('SEO_AUTOPILOT_SUPABASE_URL', 'https://offline.test')
  vi.stubEnv('SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY', 'offline-only')
})
afterEach(() => vi.unstubAllEnvs())

async function deliver(payload: unknown) {
  const body = JSON.stringify(payload)
  const timestamp = String(Math.floor(Date.now() / 1000))
  return POST(new NextRequest('https://offline.test/api/seo-autopilot/publish', { method: 'POST', body,
    headers: { 'x-autopilot-timestamp': timestamp, 'x-autopilot-signature': signPayload(timestamp, body) } }))
}
it.each(payloads)('accepts and persists the real delivery $slug including author and schema', async (payload) => {
  const response = await deliver(payload)
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ ok: true, published: true })
  expect(db.writes).toHaveLength(1)
  expect(db.writes[0].table).toBe('seo_autopilot_posts')
  expect(db.writes[0].row).toMatchObject({ author: payload.author, schema_jsonld: payload.schemaJsonLd, mdx_body: payload.mdxBody })
})
it.each([null, [], 'untrusted schema', 42, undefined].map((schemaJsonLd) => ({ schemaJsonLd })))('never rejects a delivery because of schemaJsonLd=$schemaJsonLd', async ({ schemaJsonLd }) => {
  const response = await deliver({ ...payloads[0], schemaJsonLd })
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ published: true })
  expect(db.writes).toHaveLength(1)
})
it('builds public structured data from the article rather than incoming schema', () => {
  const payload = payloads[0]
  const schema = articleSchema({ id: payload.postId, mdx_body: payload.mdxBody, hero_image_url: payload.heroImageUrl, hero_image_alt: payload.heroImageAlt, tags: payload.tags, locale: payload.locale, slug: payload.slug, title: payload.title,
    meta_description: payload.metaDescription, published_at: payload.publishedAt, updated_at: payload.updatedAt,
    author: payload.author, schema_jsonld: { '@type': 'Wrong', url: 'https://unrelated.test' } } as BlogPost)
  expect(schema['@graph'][0]).toMatchObject({ '@type': 'BlogPosting', headline: payload.title, author: { name: payload.author.name } })
  expect(JSON.stringify(schema)).not.toContain('unrelated.test')
})
