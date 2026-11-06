import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PublishPayload } from '@/lib/seo-autopilot/schema'

const state = vi.hoisted(() => ({
  upsert: vi.fn(), list: vi.fn(), invalidate: vi.fn(), after: vi.fn(),
}))
vi.mock('@/lib/seo-autopilot/hmac', () => ({ verifySignature: () => ({ ok: true }) }))
vi.mock('@/lib/seo-autopilot/storage', () => ({ upsertPost: state.upsert, listPosts: state.list }))
vi.mock('next/cache', () => ({ revalidateTag: state.invalidate }))
vi.mock('next/server', async (original) => ({ ...await original<typeof import('next/server')>(), after: state.after }))
import { POST } from '@/app/api/seo-autopilot/publish/route'
import { WITHDRAWN_SLUGS } from '@/lib/blog-urls'

const payload: PublishPayload = {
  siteId: '11111111-1111-4111-8111-111111111111', postId: '22222222-2222-4222-8222-222222222222',
  locale: 'de', slug: 'basaltemperatur-messen', title: 'Basaltemperatur messen', metaDescription: '',
  mdxBody: 'Das Tagebuch dokumentiert die Temperatur. Die Kurve zeigt die eingetragenen Werte.', heroImageUrl: null, heroImageAlt: null,
  schemaJsonLd: {}, internalLinks: [], tags: [], author: { name: 'Testautor', jobTitle: null, bio: null },
  publishedAt: '2026-11-01T12:00:00Z', updatedAt: '2026-11-01T12:00:00Z', isRefresh: false,
}
const previousSiteId = process.env.SEO_AUTOPILOT_SITE_ID
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'local-fixture-only')
  state.list.mockResolvedValue([]); state.upsert.mockResolvedValue(undefined)
  process.env.SEO_AUTOPILOT_SITE_ID = payload.siteId
})
afterEach(() => {
  vi.unstubAllEnvs()
  if (previousSiteId === undefined) delete process.env.SEO_AUTOPILOT_SITE_ID
  else process.env.SEO_AUTOPILOT_SITE_ID = previousSiteId
})
function request(body = payload) {
  return new NextRequest('https://example.test/api/seo-autopilot/publish', { method: 'POST',
    headers: { 'x-autopilot-signature': 'test', 'x-autopilot-timestamp': 'test' }, body: JSON.stringify(body) })
}
it.each([false, true])('publishes valid deliveries immediately, isRefresh=%s', async (isRefresh) => {
  const response = await POST(request({ ...payload, isRefresh }))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ published: true, url: 'https://www.basaltemperatur.online/de/blog/basaltemperatur-messen' })
  expect(state.upsert).toHaveBeenCalledOnce()
  expect(state.upsert.mock.calls[0][0]).toMatchObject({ isRefresh })
  expect(state.invalidate).toHaveBeenCalledTimes(3)
  expect(state.after).toHaveBeenCalledOnce()
})
it('publishes with content and topic-overlap warnings', async () => {
  state.list.mockResolvedValue([{ slug: 'andere-kurve', title: payload.title, tags: [] }])
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const response = await POST(request({ ...payload, mdxBody: 'Die Temperatur steigt um 0,2 °C.' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({ published: true, warnings: { overlappingSlugs: ['andere-kurve'] } })
    expect(body.warnings.contentIssues.length).toBeGreaterThan(0)
    expect(warn).toHaveBeenCalled()
    expect(state.upsert).toHaveBeenCalledOnce()
  } finally { warn.mockRestore() }
})
it('publishes off-topic submissions', async () => {
  const response = await POST(request({ ...payload, slug: 'email', title: 'E-Mail erstellen', mdxBody: 'E-Mail' }))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ published: true })
  expect(state.upsert).toHaveBeenCalledOnce()
})
it('publishes even if the optional editorial lookup fails', async () => {
  state.list.mockRejectedValue(new Error('test lookup outage'))
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ published: true })
  expect(state.upsert).toHaveBeenCalledOnce()
})
it.each([...WITHDRAWN_SLUGS])('does not reject a valid delivery for slug %s', async (slug) => {
  const response = await POST(request({ ...payload, slug }))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ published: true })
  expect(state.upsert).toHaveBeenCalledOnce()
})
it('returns retryable failure if publication storage fails', async () => {
  state.upsert.mockRejectedValue(new Error('test storage outage'))
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
  expect(state.invalidate).not.toHaveBeenCalled()
  expect(state.after).not.toHaveBeenCalled()
})
it.each(['signing', 'site'])('returns retryable failure for missing %s configuration', async (configuration) => {
  if (configuration === 'signing') {
    vi.stubEnv('SEO_AUTOPILOT_SECRET', '')
    vi.stubEnv('SEO_AUTOPILOT_WEBHOOK_SECRET', '')
  } else vi.stubEnv('SEO_AUTOPILOT_SITE_ID', '')
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
  expect(state.upsert).not.toHaveBeenCalled()
})
it('rejects deliveries for a different site', async () => {
  process.env.SEO_AUTOPILOT_SITE_ID = 'different-site'
  expect((await POST(request())).status).toBe(403)
  expect(state.upsert).not.toHaveBeenCalled()
})
