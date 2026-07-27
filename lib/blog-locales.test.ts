import { describe, expect, it } from 'vitest'
import { BLOG_LOCALES, isBlogLocale } from './blog-locales'

describe('isBlogLocale', () => {
  it('accepts the configured locales', () => {
    for (const locale of BLOG_LOCALES) {
      expect(isBlogLocale(locale)).toBe(true)
    }
  })

  it('rejects everything else, so /<beliebig>/blog keine indexierbare Seite wird', () => {
    // Genau diese Werte lieferten vorher HTTP 200 mit Selbst-Canonical.
    for (const locale of ['en', 'fr', 'xx', 'zz', 'abc', '123', '', 'DE', 'de-DE']) {
      expect(isBlogLocale(locale)).toBe(false)
    }
  })
})
