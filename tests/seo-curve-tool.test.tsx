import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { BlogPost } from '@/app/[locale]/blog/posts'

const fixturePosts: BlogPost[] = []
vi.mock('@/app/[locale]/blog/posts', async (original) => ({
  ...await original<typeof import('@/app/[locale]/blog/posts')>(),
  getCachedPosts: async () => fixturePosts,
  getOptionalPosts: async () => fixturePosts,
}))

import CurveTool, { metadata } from '@/app/werkzeuge/basaltemperaturkurve/page'
import { parseReadings, sheetRange, summarizeReadings } from '@/lib/curve-sheet'
import { getPostTopics } from '@/lib/seo-autopilot/discovery'
import sitemap from '@/lib/seo-autopilot/sitemap'
import { renderLlms } from '@/lib/seo-autopilot/llms'

const post = (slug: string, title: string): BlogPost => ({ id: slug, slug, title, locale: 'de', meta_description: '', hero_image_url: null,
  hero_image_alt: null, tags: [], author: { name: 'Testautor' }, published_at: '2026-11-01T12:00:00Z', updated_at: null,
  mdx_body: '', schema_jsonld: {}, internal_links: [] })

describe('public pages render their content without a loading shell', () => {
  it('keeps the spinner boundary out of the root segment', () => {
    // app/loading.tsx wrapped every public page in Suspense: the HTML started with
    // "Wird geladen..." and hid the real content (H1 included) in <div hidden>.
    expect(existsSync(join(process.cwd(), 'app/loading.tsx'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'app/(dashboard)/loading.tsx'))).toBe(true)
  })
})

describe('curve tool page', () => {
  it('targets the curve search intent with its own canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/werkzeuge/basaltemperaturkurve')
    expect(String((metadata.title as { absolute: string }).absolute)).toMatch(/^Basaltemperaturkurve/)
    expect(String((metadata.title as { absolute: string }).absolute).length).toBeLessThanOrEqual(60)
  })

  it('server-renders heading, explanation, printable empty template and schema', async () => {
    fixturePosts.push(post('basaltemperatur-kurve-lesen', 'Basaltemperatur-Kurve lesen'))
    try {
      const html = renderToStaticMarkup(await CurveTool())
      expect(html).toMatch(/<h1[^>]*>Basaltemperaturkurve erstellen/)
      expect(html).toContain('id="vorlage"')
      expect(html).toContain('Leere Vorlage für eine Basaltemperaturkurve')
      expect(html).toContain('"@type":"WebApplication"')
      expect(html).toContain('"price":"0"')
      expect(html).toContain('href="/de/blog/basaltemperatur-kurve-lesen"')
      // Unpublished guide articles are named, not linked.
      expect(html).not.toContain('href="/de/blog/basaltemperatur-messen-anleitung"')
      expect(html).toContain('frauenaerzte-im-netz.de')
    } finally { fixturePosts.length = 0 }
  })

  it('never sends readings anywhere and makes no contraception or fertility promise', async () => {
    const html = renderToStaticMarkup(await CurveTool())
    expect(html).not.toMatch(/<textarea[^>]*name=/)
    expect(html).not.toMatch(/<form/)
    expect(html).not.toMatch(/sicher verhüt|pearl/i)
    expect(html).toContain('kein Verhütungsmittel')
    expect(html).toContain('bestimmt keine fruchtbaren Tage')
  })

  it('is listed in sitemap and llms.txt', async () => {
    expect((await sitemap()).some((entry) => entry.url.endsWith('/werkzeuge/basaltemperaturkurve'))).toBe(true)
    expect(renderLlms([])).toContain('/werkzeuge/basaltemperaturkurve')
  })
})

describe('curve sheet input', () => {
  it('reads German decimals, keeps gaps and rejects implausible values', () => {
    const parsed = parseReadings('36,45\n36.50\n-\n36,4 x 41,0 abc')
    expect(parsed.values).toEqual([36.45, 36.5, null, 36.4, null])
    expect(parsed.invalid).toEqual(['41,0', 'abc'])
    expect(summarizeReadings(parsed.values)).toEqual({ count: 3, missing: 2, min: 36.4, max: 36.5 })
  })
  it('uses the paper range and widens it only when readings leave it', () => {
    expect(sheetRange([])).toEqual({ low: 36.0, high: 37.2 })
    expect(sheetRange([36.3, 36.9])).toEqual({ low: 36.0, high: 37.2 })
    expect(sheetRange([35.82, 37.31])).toEqual({ low: 35.7, high: 37.4 })
  })
  it('caps the sheet length', () => {
    const parsed = parseReadings(Array(50).fill('36,5').join('\n'))
    expect(parsed.values).toHaveLength(45)
    expect(parsed.truncated).toBe(true)
  })
})

describe('curve hub stays about curves', () => {
  it('keeps app comparisons and registration guides out of the temperature curve topic', () => {
    expect(getPostTopics(post('basaltemperatur-app-anmelden-registrierung', 'Basaltemperatur App anmelden: Registrierung in 5 Schritten'))).not.toContain('temperaturkurven')
    expect(getPostTopics(post('basaltemperatur-app-kostenlos', 'Basaltemperatur app kostenlos: Funktionen und Vergleich'))).toEqual(['zyklus-apps'])
    expect(getPostTopics(post('clue-alternative-15-punkte-wechselcheck', 'Clue Alternative: 15-Punkte-Wechselcheck'))).toEqual(['zyklus-apps'])
    expect(getPostTopics(post('basaltemperatur-kurve-lesen', 'Basaltemperatur-Kurve lesen: Muster, Hilfslinie, Störwerte'))).toEqual(['temperaturkurven'])
    expect(getPostTopics(post('nfp-regeln-temperatur-messung-stoerfaktoren', 'NFP Regeln Temperatur: Messung, Störfaktoren, Grenzen'))).toEqual(['temperaturkurven'])
  })
})
