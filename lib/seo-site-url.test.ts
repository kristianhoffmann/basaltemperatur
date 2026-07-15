import { afterEach, describe, expect, it } from 'vitest'
import { getSeoSiteUrl } from './seo-site-url'

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
})

describe('getSeoSiteUrl', () => {
  it('uses the production www host even when the configured app URL is the redirecting apex', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://basaltemperatur.online'
    expect(getSeoSiteUrl()).toBe('https://www.basaltemperatur.online')
  })

  it('falls back to the same canonical host for unrelated configuration', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    expect(getSeoSiteUrl()).toBe('https://www.basaltemperatur.online')
  })
})
