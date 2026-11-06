import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasStorageCredentials, getPost, listPosts } from './storage'

const storageEnvironmentNames = [
  'SEO_AUTOPILOT_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SEO_AUTOPILOT_SITE_ID',
] as const

const originalEnvironment = Object.fromEntries(
  storageEnvironmentNames.map((name) => [name, process.env[name]]),
)

afterEach(() => {
  for (const name of storageEnvironmentNames) {
    const value = originalEnvironment[name]
    if (value === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = value
    }
  }
})

describe('hasStorageCredentials', () => {
  it('rejects missing and blank credentials during secret-free builds', () => {
    for (const name of storageEnvironmentNames) {
      delete process.env[name]
    }

    process.env.NEXT_PUBLIC_SUPABASE_URL = '   '
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''

    expect(hasStorageCredentials()).toBe(false)
  })

  it('accepts either the dedicated or application Supabase credential pair', () => {
    for (const name of storageEnvironmentNames) {
      delete process.env[name]
    }

    process.env.SEO_AUTOPILOT_SUPABASE_URL = 'https://seo.example.test'
    process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(hasStorageCredentials()).toBe(true)

    delete process.env.SEO_AUTOPILOT_SUPABASE_URL
    delete process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://app.example.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    expect(hasStorageCredentials()).toBe(true)
  })
})


const query = vi.hoisted(() => ({ result: { data: null as unknown, error: null as unknown }, ranges: [] as number[][] }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => {
    const chain = { from: () => chain, select: () => chain, eq: () => chain,
      order: () => chain, range: (start: number, end: number) => {
        query.ranges.push([start, end])
        return Promise.resolve({ ...query.result, data: Array.isArray(query.result.data) ? query.result.data.slice(start, end + 1) : query.result.data })
      }, then: (resolve: (result: unknown) => unknown) => Promise.resolve({ ...query.result, data: Array.isArray(query.result.data) ? query.result.data.slice(0, 1000) : query.result.data }).then(resolve), maybeSingle: () => Promise.resolve(query.result),
      single: () => Promise.resolve(query.result) }
    return chain
  },
}))

describe('read error handling', () => {
  it('distinguishes missing article from a database error', async () => {
    process.env.SEO_AUTOPILOT_SUPABASE_URL = 'https://example.test'
    process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY = 'test-only'
    process.env.SEO_AUTOPILOT_SITE_ID = 'test-site'
    query.result = { data: null, error: null }
    expect(await getPost('de', 'missing')).toBeNull()
    query.result = { data: null, error: { message: 'offline' } }
    await expect(getPost('de', 'missing')).rejects.toThrow('Storage')
    await expect(listPosts('de')).rejects.toThrow('Storage')
    delete process.env.SEO_AUTOPILOT_SITE_ID
  })
})

it('reads every storage page beyond the default Supabase row limit', async () => {
  process.env.SEO_AUTOPILOT_SUPABASE_URL = 'https://example.test'
  process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY = 'test-only'
  process.env.SEO_AUTOPILOT_SITE_ID = 'test-site'
  query.ranges = []
  query.result = { data: Array.from({ length: 1201 }, (_, index) => ({ slug: `artikel-${index}` })), error: null }
  expect(await listPosts('de')).toHaveLength(1201)
  expect(query.ranges).toEqual([[0, 499], [500, 999], [1000, 1499]])
})
