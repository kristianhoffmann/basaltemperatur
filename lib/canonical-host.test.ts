import { describe, expect, it } from 'vitest'
import { withCanonicalHost } from './canonical-host'

describe('withCanonicalHost', () => {
  it('rewrites the apex host to the canonical www host', () => {
    expect(withCanonicalHost('https://basaltemperatur.online/de/blog/x')).toBe(
      'https://www.basaltemperatur.online/de/blog/x'
    )
  })

  it('leaves URLs that already use the canonical host untouched', () => {
    const url = 'https://www.basaltemperatur.online/de/blog/x'
    expect(withCanonicalHost(url)).toBe(url)
  })

  it('normalises @id, author and publisher references in stored JSON-LD', () => {
    // Form entspricht dem, was in seo_autopilot_posts.schema_jsonld liegt.
    const stored = {
      '@type': 'BlogPosting',
      '@id': 'https://basaltemperatur.online/de/blog/x#blogposting',
      mainEntityOfPage: 'https://basaltemperatur.online/de/blog/x',
      author: { '@id': 'https://basaltemperatur.online#person:kristian-hoffmann' },
      publisher: { '@id': 'https://basaltemperatur.online#organization' },
      breadcrumb: [
        { item: 'https://basaltemperatur.online/' },
        { item: 'https://basaltemperatur.online/de/blog' },
      ],
    }

    const result = withCanonicalHost(stored)

    expect(JSON.stringify(result)).not.toMatch(/https:\/\/basaltemperatur\.online/)
    expect(result['@id']).toBe('https://www.basaltemperatur.online/de/blog/x#blogposting')
    expect(result.author['@id']).toBe(
      'https://www.basaltemperatur.online#person:kristian-hoffmann'
    )
    expect(result.publisher['@id']).toBe('https://www.basaltemperatur.online#organization')
    expect(result.breadcrumb[1].item).toBe('https://www.basaltemperatur.online/de/blog')
  })

  it('keeps foreign hosts and non-string values intact', () => {
    const input = {
      image: { url: 'https://supabase.seoautopilot.cloud/storage/hero.webp', width: 1792 },
      sameAs: ['https://www.linkedin.com/in/kristian-hoffmann-b69888213/'],
      wordCount: 2698,
      isAccessibleForFree: true,
      nothing: null,
    }
    expect(withCanonicalHost(input)).toEqual(input)
  })
})
