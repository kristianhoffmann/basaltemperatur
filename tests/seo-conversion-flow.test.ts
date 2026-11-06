import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ signUp: vi.fn(), getUser: vi.fn(), updateUser: vi.fn(), exchange: vi.fn(), track: vi.fn(), oauth: vi.fn(), checkout: vi.fn(), after: [] as (() => Promise<unknown>)[] }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
vi.mock('next/server', async (original) => ({ ...await original<typeof import('next/server')>(), after: (fn: () => Promise<unknown>) => mocks.after.push(fn) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signUp: mocks.signUp, getUser: mocks.getUser, updateUser: mocks.updateUser, exchangeCodeForSession: mocks.exchange, signInWithOAuth: mocks.oauth },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { onboarding_completed: true, sensitive_data_consent_at: 'yes' } }), single: async () => ({ data: { has_lifetime_access: false } }) }) }) }) }),
  createAdminClient: vi.fn(),
}))
vi.mock('@/lib/seo-autopilot/attribution', async (original) => ({ ...await original<typeof import('@/lib/seo-autopilot/attribution')>(), trackConversion: mocks.track }))
vi.mock('stripe', () => ({ default: class { checkout = { sessions: { create: mocks.checkout } } } }))
import { signUp, signInWithGoogle } from '@/lib/actions/auth'
import { GET } from '@/app/(auth)/auth/callback/route'

const user = { id: 'user-real', email: 'person@real.de', identities: [{ provider: 'email' }], user_metadata: { seo_from: 'messen' }, app_metadata: {}, created_at: new Date().toISOString() }
beforeEach(() => {
  vi.clearAllMocks(); mocks.after.length = 0
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.basaltemperatur.online')
  mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null })
  mocks.getUser.mockResolvedValue({ data: { user } })
  mocks.updateUser.mockResolvedValue({ error: null })
  mocks.exchange.mockResolvedValue({ error: null })
})
function form() {
  const fd = new FormData()
  Object.entries({ email: 'person@real.de', password: 'Password12', ownerName: 'Test', termsAccepted: 'true', sensitiveDataConsent: 'true', from: 'messen' }).forEach(([key, value]) => fd.set(key, value))
  return fd
}
it('stores a validated form source in account metadata and schedules an idempotent signup after the response', async () => {
  await signUp(null, form())
  expect(mocks.signUp.mock.calls[0][0].options.data.seo_from).toBe('messen')
  expect(mocks.track).not.toHaveBeenCalled()
  await Promise.all(mocks.after.map((fn) => fn()))
  expect(mocks.track).toHaveBeenCalledWith(expect.objectContaining({ eventName: 'signup', idempotencyKey: 'signup:user-real' }), { slug: 'messen' })
})
it('does not count obfuscated duplicate signup results or admins', async () => {
  mocks.signUp.mockResolvedValueOnce({ data: { user: { ...user, identities: [] }, session: null }, error: null })
  await signUp(null, form())
  mocks.signUp.mockResolvedValueOnce({ data: { user: { ...user, email: 'kristian.hoffmann@me.com' }, session: null }, error: null })
  await signUp(null, form())
  expect(mocks.after).toHaveLength(0)
})
it('carries from in the server-created OAuth redirect', async () => {
  mocks.oauth.mockResolvedValue({ data: {}, error: null })
  await signInWithGoogle('messen')
  expect(mocks.oauth.mock.calls[0][0].options.redirectTo).toBe('https://www.basaltemperatur.online/auth/callback?from=messen')
})
it('persists a new OAuth account source server-side and counts only the first Google login', async () => {
  const oauthUser = { ...user, identities: [{ provider: 'google' }], user_metadata: {}, last_sign_in_at: user.created_at }
  mocks.getUser.mockResolvedValue({ data: { user: oauthUser } })
  await GET(new Request('https://www.basaltemperatur.online/auth/callback?code=local&from=messen'))
  expect(mocks.updateUser).toHaveBeenCalledWith({ data: { seo_from: 'messen' } })
  await Promise.all(mocks.after.map((fn) => fn()))
  expect(mocks.track).toHaveBeenCalledWith(expect.objectContaining({ eventName: 'signup', idempotencyKey: 'signup:user-real' }), { slug: 'messen' })
  mocks.after.length = 0
  mocks.getUser.mockResolvedValue({ data: { user: { ...oauthUser, created_at: '2020-01-01T00:00:00Z' } } })
  await GET(new Request('https://www.basaltemperatur.online/auth/callback?code=local&from=messen'))
  expect(mocks.after).toHaveLength(0)
})
it('transfers saved source to Stripe metadata and reports checkout only after response', async () => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_local_fixture')
  vi.stubEnv('STRIPE_PRICE_ID', 'price_fixture')
  mocks.checkout.mockResolvedValue({ id: 'cs_local', url: 'https://checkout.stripe.com/local' })
  const { POST } = await import('@/app/api/checkout/route')
  const response = await POST(new Request('https://www.basaltemperatur.online/api/checkout', { method: 'POST', body: JSON.stringify({ earlyStartRequested: true }) }))
  expect(response.status).toBe(200)
  expect(mocks.checkout.mock.calls[0][0].metadata.seo_slug).toBe('messen')
  expect(mocks.track).not.toHaveBeenCalled()
  await Promise.all(mocks.after.map((fn) => fn()))
  expect(mocks.track).toHaveBeenCalledWith(expect.objectContaining({ eventName: 'checkout_started', idempotencyKey: 'checkout:cs_local' }), { slug: 'messen' })
})
it('remembers the source server-side when an existing user logs in from an article', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { ...user, user_metadata: {} } } })
  const { rememberArticleSource } = await import('@/lib/actions/auth')
  await rememberArticleSource('messen')
  expect(mocks.updateUser).toHaveBeenCalledWith({ data: { seo_from: 'messen' } })
  mocks.updateUser.mockClear()
  await rememberArticleSource('../unsafe')
  expect(mocks.updateUser).not.toHaveBeenCalled()
})
it('retires the cookie-writing endpoint without setting a browser identifier', async () => {
  const { POST } = await import('@/app/api/seo-autopilot/attribution/route')
  const response = await POST()
  expect(response.status).toBe(410)
  expect(response.headers.get('set-cookie')).toBeNull()
})
it('returns Retry-After when checkout authentication fails technically', async () => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_local_fixture')
  vi.stubEnv('STRIPE_PRICE_ID', 'price_fixture')
  mocks.getUser.mockRejectedValueOnce(new Error('local auth outage'))
  const { POST } = await import('@/app/api/checkout/route')
  const response = await POST(new Request('https://www.basaltemperatur.online/api/checkout', { method: 'POST', body: JSON.stringify({ earlyStartRequested: true }) }))
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
})
it('returns Retry-After when the OAuth callback cannot access authentication', async () => {
  mocks.exchange.mockRejectedValueOnce(new Error('local auth outage'))
  const response = await GET(new Request('https://www.basaltemperatur.online/auth/callback?code=local'))
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
})
it.each(['/\\evil.test/path', '/\n/evil.test', '//evil.test', 'https://evil.test'])('rejects external callback next=%s', async (next) => {
  const response = await GET(new Request(`https://www.basaltemperatur.online/auth/callback?code=local&next=${encodeURIComponent(next)}`))
  expect(response.headers.get('location')).toBe('https://www.basaltemperatur.online/dashboard')
})
