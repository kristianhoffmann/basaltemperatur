import { afterEach, describe, expect, it } from 'vitest'
import { hasStorageCredentials } from './storage'

const storageEnvironmentNames = [
  'SEO_AUTOPILOT_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
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
