import { afterEach, expect, it, vi } from 'vitest'
import { notifyIndexNow } from './indexnow'
const original = process.env.SEO_AUTOPILOT_INDEXNOW_KEY
afterEach(() => {
  vi.unstubAllGlobals()
  if (original === undefined) delete process.env.SEO_AUTOPILOT_INDEXNOW_KEY
  else process.env.SEO_AUTOPILOT_INDEXNOW_KEY = original
})
it('does not contact IndexNow without a configured key', async () => {
  delete process.env.SEO_AUTOPILOT_INDEXNOW_KEY
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  await notifyIndexNow('de', 'kurve')
  expect(fetch).not.toHaveBeenCalled()
})
it('submits canonical URLs and tolerates network failures', async () => {
  process.env.SEO_AUTOPILOT_INDEXNOW_KEY = 'local-test-key'
  const fetch = vi.fn().mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error('offline'))
  vi.stubGlobal('fetch', fetch)
  await notifyIndexNow('de', 'kurve')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ host: 'www.basaltemperatur.online',
    keyLocation: 'https://www.basaltemperatur.online/local-test-key.txt', urlList: ['https://www.basaltemperatur.online/de/blog/kurve'] })
  await expect(notifyIndexNow('de', 'kurve')).resolves.toBeUndefined()
})
