import { describe, expect, it } from 'vitest'
import { publishPayloadSchema, type PublishPayload } from './schema'
import { reviewSubmission } from './editorial'

export const payload: PublishPayload = {
  siteId: '11111111-1111-4111-8111-111111111111', postId: '22222222-2222-4222-8222-222222222222',
  locale: 'de', slug: 'basaltemperatur-messen', title: 'Basaltemperatur messen', metaDescription: 'Temperatur dokumentieren',
  mdxBody: 'Das Tagebuch dokumentiert die Temperatur. Die Messwerte werden als Kurve dargestellt.', heroImageUrl: null, heroImageAlt: null,
  schemaJsonLd: {}, internalLinks: [], tags: [], author: { name: 'Kristian Hoffmann', jobTitle: null, bio: null },
  publishedAt: '2026-11-01T12:00:00Z', updatedAt: '2026-11-01T12:00:00Z', isRefresh: false,
}

describe('editorial warnings', () => {
  it('rejects blank content, non-German locales and path-like slugs', () => {
    for (const change of [{ mdxBody: '  ' }, { locale: 'en' }, { slug: '../foo' }, { author: { ...payload.author, name: '' } }]) {
      expect(publishPayloadSchema.safeParse({ ...payload, ...change }).success).toBe(false)
    }
  })
  it('reports topics and existing competing intentions', () => {
    const existing = { slug: 'andere-kurve', title: payload.title, tags: [] }
    const review = reviewSubmission(payload, [existing])
    expect(review.topics).toContain('temperaturkurven')
    expect(review.overlappingSlugs).toContain('andere-kurve')
    expect(review.contentIssues).toEqual([])
  })
  it('reports no known topics for off-topic submissions', () => {
    expect(reviewSubmission({ ...payload, title: 'E-Mail erstellen', slug: 'email', mdxBody: 'E-Mail' }, []).topics).toEqual([])
  })
  it('does not report general reading suggestions as competing article intentions', () => {
    const review = reviewSubmission(payload, [{ slug: 'email', title: 'E-Mail erstellen', tags: [] }])
    expect(review.overlappingSlugs).toEqual([])
  })
  it('reports missing short answers and unsourced numeric claims', () => {
    for (const mdxBody of ['Nur ein Satz.', 'Die Temperatur steigt um 0,2 °C. Diese Aussage braucht einen Beleg.']) {
      expect(reviewSubmission({ ...payload, mdxBody }, []).contentIssues.length).toBeGreaterThan(0)
    }
  })
})
