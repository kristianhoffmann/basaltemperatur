// Offline build fixture. NODE_OPTIONS must explicitly load this test-only file.
// Reject all other requests so verification cannot accidentally contact production.
const common = { locale: 'de', meta_description: 'Lokaler Testdatensatz', hero_image_url: null, hero_image_alt: null,
  tags: [], author: { name: 'Testautor', jobTitle: 'Lokale Testrolle', bio: 'Nur lokale Testbiografie.' },
  published_at: '2026-10-31T12:00:00Z', updated_at: '2026-11-01T12:00:00Z', schema_jsonld: {},
  mdx_body: '## Temperatur dokumentieren\n\nLokaler Testinhalt. [Weitere Kurve](./temperaturkurve-test-zwei)' }
const posts = [
  { ...common, id: 'test-one', slug: 'temperaturkurve-test-eins', title: 'Basaltemperatur dokumentieren', internal_links: [{ targetSlug: 'temperaturkurve-test-zwei', anchorText: 'Weitere Temperaturkurve' }] },
  { ...common, id: 'test-two', slug: 'temperaturkurve-test-zwei', title: 'Temperaturkurve lesen', internal_links: [] },
]
globalThis.fetch = async (input) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.origin !== 'http://seo-fixture.invalid' || url.pathname !== '/rest/v1/seo_autopilot_posts') {
    throw new Error(`Offline verification blocked request to ${url.origin}`)
  }
  if (process.env.SEO_FIXTURE_OUTAGE === '1') throw new Error('Simulated offline blog database')
  const slug = url.searchParams.get('slug')?.replace(/^eq\./, '')
  return new Response(JSON.stringify(slug ? posts.filter((post) => post.slug === slug) : posts), {
    headers: { 'Content-Type': 'application/json' },
  })
}
