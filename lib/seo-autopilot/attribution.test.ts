import { describe, expect, it } from 'vitest'
import { buildConversionPayload } from './attribution'

describe('buildConversionPayload', () => {
  it('uses the canonical purchase event name and a full ISO occurrence timestamp', () => {
    const occurredAt = new Date('2026-07-14T20:30:00.000Z')
    const payload = buildConversionPayload(
      '16802323-34a0-4eaa-9836-61f53596c916',
      { eventName: 'purchase', revenue: 9.99, idempotencyKey: 'stripe:purchase:cs_123' },
      { slug: 'basaltemperatur-richtig-messen', locale: 'de' },
      occurredAt,
    )

    expect(payload.eventName).toBe('purchase')
    expect(payload.occurredOn).toBe('2026-07-14T20:30:00.000Z')
    expect(payload.idempotencyKey).toBe('stripe:purchase:cs_123')
  })
})

import { afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { trackConversion, shouldTrackAccount } from './attribution'
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers() })
it('signs the exact transmitted bytes and sends no user identity', async () => {
  vi.stubEnv('SEO_AUTOPILOT_SITE_ID', '16802323-34a0-4eaa-9836-61f53596c916')
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'test-secret')
  const send = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', send)
  await trackConversion({ eventName: 'signup', idempotencyKey: 'signup:u1' }, { slug: 'messen' })
  const [url, init] = send.mock.calls[0]
  expect(url).toBe('https://www.seoautopilot.cloud/api/conversions/track')
  const timestamp = init.headers['x-autopilot-timestamp']
  expect(init.headers['x-autopilot-signature']).toBe(createHmac('sha256', 'test-secret').update(`${timestamp}.${init.body}`).digest('hex'))
  expect(JSON.parse(init.body)).toMatchObject({ slug: 'messen', idempotencyKey: 'signup:u1', siteId: '16802323-34a0-4eaa-9836-61f53596c916' })
  expect(init.signal).toBeInstanceOf(AbortSignal)
})
it('missing secret and failed requests never throw', async () => {
  vi.stubEnv('SEO_AUTOPILOT_SITE_ID', 'site')
  vi.stubEnv('SEO_AUTOPILOT_SECRET', '')
  vi.stubEnv('SEO_AUTOPILOT_WEBHOOK_SECRET', '')
  const send = vi.fn().mockRejectedValue(new Error('offline'))
  vi.stubGlobal('fetch', send)
  await expect(trackConversion({ eventName: 'signup', idempotencyKey: 'signup:u' }, {})).resolves.toBeUndefined()
  expect(send).not.toHaveBeenCalled()
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'secret')
  await expect(trackConversion({ eventName: 'signup', idempotencyKey: 'signup:u' }, {})).resolves.toBeUndefined()
})
it('excludes configured admins, marked tests and synthetic addresses', () => {
  expect(shouldTrackAccount({ email: 'kristian.hoffmann@me.com' })).toBe(false)
  expect(shouldTrackAccount({ email: 'qa@example.com' })).toBe(false)
  expect(shouldTrackAccount({ email: 'person@real.de', app_metadata: { role: 'admin' } })).toBe(false)
  expect(shouldTrackAccount({ email: 'person@real.de', app_metadata: { is_test: true } })).toBe(false)
  expect(shouldTrackAccount({ email: 'person@real.de' })).toBe(true)
})
it('aborts a stalled sender within the configured timeout', async () => {
  vi.useFakeTimers()
  vi.stubEnv('SEO_AUTOPILOT_SITE_ID', 'site')
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'secret')
  vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')))
  })))
  const pending = trackConversion({ eventName: 'signup', idempotencyKey: 'signup:u' }, {})
  await vi.advanceTimersByTimeAsync(2500)
  await expect(pending).resolves.toBeUndefined()
})
