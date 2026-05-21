import { describe, expect, it } from 'vitest'
import {
  getReferrerHost,
  normalizePath,
  parseUserAgent,
  sanitizeQueryString,
  sanitizeUrl,
} from './traffic'

describe('traffic helpers', () => {
  it('redacts sensitive query values from stored URLs', () => {
    const sanitized = sanitizeUrl('https://example.com/auth/callback?code=secret-code&next=/dashboard&email=a@b.test#token')

    expect(sanitized).toBe('https://example.com/auth/callback?code=%5Bredacted%5D&next=%2Fdashboard&email=%5Bredacted%5D')
  })

  it('redacts sensitive query values from raw query strings', () => {
    expect(sanitizeQueryString('utm_source=newsletter&token=abc&password=secret')).toBe(
      'utm_source=newsletter&token=%5Bredacted%5D&password=%5Bredacted%5D',
    )
  })

  it('normalizes path-like and absolute URLs', () => {
    expect(normalizePath('https://example.com/dashboard?code=secret')).toBe('/dashboard')
    expect(normalizePath('not a url')).toBe('/')
  })

  it('parses basic user-agent classifications', () => {
    expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toMatchObject({
      browser: 'Safari',
      os: 'iOS',
      deviceType: 'mobile',
      isBot: false,
    })
    expect(parseUserAgent('Mozilla/5.0 AppleWebKit Googlebot/2.1')).toMatchObject({
      isBot: true,
      botName: 'Googlebot',
    })
  })

  it('extracts referrer hosts without www prefix', () => {
    expect(getReferrerHost('https://www.google.com/search?q=basaltemperatur')).toBe('google.com')
    expect(getReferrerHost('not a url')).toBeNull()
  })
})
