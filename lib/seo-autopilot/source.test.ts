import { describe, expect, it } from 'vitest'
import { internalRedirect, normalizeFrom, withFrom, getArticleCta } from './source'

describe('URL-only source attribution', () => {
  it('restricts both login and callback destinations to internal paths', () => {
    for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/\t/evil.test', '/\n/evil.test', '/foo/..//evil.test', null, ['a']]) {
      expect(internalRedirect(value)).toBe('/dashboard')
    }
    expect(internalRedirect('/kalender?month=11#eintrag')).toBe('/kalender?month=11#eintrag')
  })
  it('accepts only one bounded article slug, never arbitrary query data', () => {
    expect(normalizeFrom('temperatur-messen')).toBe('temperatur-messen')
    for (const value of [undefined, ['a', 'b'], 'a/b', 'mail@example.com', '../x', 'x'.repeat(201), '']) expect(normalizeFrom(value)).toBeUndefined()
  })
  it('preserves existing query and hash and replaces from exactly once', () => {
    expect(withFrom('/registrieren?next=kurve&from=alt#start', 'messen')).toBe('/registrieren?next=kurve&from=messen#start')
    expect(withFrom('/registrieren', 'a/b')).toBe('/registrieren')
  })
  it.each([
    ['Temperatur messen', [], '/werkzeuge/temperatur-hilfslinie'],
    ['Perioden-App ohne Anmeldung', [], '/werkzeuge/temperatur-hilfslinie'],
    ['Zyklus dokumentieren', ['Periodenkalender'], '/registrieren'],
    ['PDF exportieren', [], '/werkzeuge/temperatur-hilfslinie#analyse'],
  ])('maps %s to an existing function', (title, tags, href) => {
    expect(getArticleCta({ title, tags, slug: 'artikel' }).href).toBe(href)
  })
})
