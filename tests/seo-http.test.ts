import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const auth = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: auth.create }))
const data = vi.hoisted(() => ({ getPost: vi.fn(), listPosts: vi.fn() }))
vi.mock('@/app/[locale]/blog/posts', () => ({ getCachedPost: data.getPost, getCachedPosts: data.listPosts }))
import { proxy } from '@/proxy'
import { GET } from '@/app/api/seo-autopilot/blog-response/route'
import { signBlogRender, isBlogRender } from '@/lib/seo-autopilot/blog-response'
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SEO_AUTOPILOT_SECRET', 'local-render-only')
  data.getPost.mockResolvedValue({ slug: 'example', author: { name: 'Testautor' } })
  data.listPosts.mockResolvedValue([{ slug: 'example', author: { name: 'Testautor' } }])
  vi.stubGlobal('fetch', vi.fn(async () => new Response('<html><meta name="seo-content-ready" content="true"></html>')))
})
function request(path: string) { return new NextRequest(`https://www.basaltemperatur.online${path}`) }
function route(path: string) {
  return GET(new NextRequest(`http://localhost/api/seo-autopilot/blog-response`, { headers: { 'x-seo-public-path': path } }))
}
it.each(['/de/blog', '/de/blog/example', '/de/blog/themen/temperaturkurven', '/de/blog/autor/testautor', '/blog', '/blog/example'])('returns retryable 503 for %s before streaming on a storage outage', async (path) => {
  data.listPosts.mockRejectedValue(new Error('offline'))
  const response = await route(path)
  expect(response.status).toBe(503)
  expect(response.headers.get('retry-after')).toBe('60')
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(fetch).not.toHaveBeenCalled()
})
it.each(['Mozilla/5.0', 'Googlebot', 'OAI-SearchBot'])('returns a real 404 for a missing article for %s', async (ua) => {
  data.getPost.mockResolvedValue(null)
  const response = await GET(new NextRequest('http://localhost/api/seo-autopilot/blog-response', { headers: { 'x-seo-public-path': '/de/blog/missing', 'user-agent': ua } }))
  expect(response.status).toBe(404)
})
it('handles failed author detail reads', async () => {
  data.getPost.mockRejectedValue(new Error('biography offline'))
  expect((await route('/de/blog/autor/testautor')).status).toBe(503)
})
it.each(['/', '/ueber-uns', '/sitemap.xml', '/llms.txt', '/de/blog', '/de/blog/example', '/de/blog/autor/testautor', '/de/blog/themen/temperaturkurven'])('does no database or auth lookup in the public proxy for %s', async (path) => {
  const response = await proxy(request(path))
  expect(response.status).toBe(200)
  expect(data.listPosts).not.toHaveBeenCalled()
  expect(data.getPost).not.toHaveBeenCalled()
  expect(auth.create).not.toHaveBeenCalled()
})
it('rewrites blog requests to the response boundary and signs only the internal render', async () => {
  expect((await proxy(request('/de/blog'))).headers.get('x-middleware-rewrite')).toContain('/api/seo-autopilot/blog-response')
  const headers = new Headers({ 'x-seo-render': signBlogRender('/de/blog') })
  expect(isBlogRender('/de/blog', headers)).toBe(true)
  expect(isBlogRender('/de/blog/changed', headers)).toBe(false)
  const response = await proxy(new NextRequest('https://www.basaltemperatur.online/de/blog', { headers }))
  expect(response.headers.get('x-middleware-next')).toBe('1')
})
it.each(['0', '-1', '01', 'garbage', '999'])('returns 404 for invalid page %s', async (page) => {
  expect((await route(`/de/blog?page=${page}`)).status).toBe(404)
})
it('canonicalizes page 1 and author spelling', async () => {
  expect((await route('/de/blog?page=1')).headers.get('location')).toBe('https://www.basaltemperatur.online/de/blog')
  expect((await route('/de/blog/autor/Testautor')).headers.get('location')).toBe('https://www.basaltemperatur.online/de/blog/autor/testautor')
})
it('serves the hyphenated author URL directly and redirects the old space URL to it', async () => {
  const post = { slug: 'example', author: { name: 'Kristian Hoffmann' } }
  data.listPosts.mockResolvedValue([post])
  data.getPost.mockResolvedValue(post)
  const canonical = '/de/blog/autor/kristian-hoffmann'
  const response = await route(canonical)
  expect(response.status).toBe(200)
  expect(response.headers.get('location')).toBeNull()
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(`http://127.0.0.1:3000${canonical}`)
  const legacy = await route('/de/blog/autor/kristian%20hoffmann')
  expect(legacy.status).toBe(308)
  expect(legacy.headers.get('location')).toBe(`https://www.basaltemperatur.online${canonical}`)
})
it.each(['/de/blog/themen/invented', '/de/blog/autor/invented'])('returns 404 for unknown %s', async (path) => {
  expect((await route(path)).status).toBe(404)
})
it('buffers the rendered response and catches late streaming/storage failures', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('<html>error shell</html>'))
  expect((await route('/de/blog/example')).status).toBe(503)
  vi.mocked(fetch).mockResolvedValueOnce(new Response('error', { status: 500 }))
  expect((await route('/de/blog/example')).status).toBe(503)
})
it('returns successful HTML and full RSC payloads from the fixed loopback renderer', async () => {
  expect((await route('/de/blog/example')).status).toBe(200)
  const [url, init] = vi.mocked(fetch).mock.calls[0]
  expect(String(url)).toBe('http://127.0.0.1:3000/de/blog/example')
  expect(isBlogRender('/de/blog/example', new Headers(init?.headers))).toBe(true)
  vi.mocked(fetch).mockResolvedValueOnce(new Response('0:["meta",null,{"name":"seo-content-ready"}]', { headers: { 'content-type': 'text/x-component' } }))
  const response = await GET(new NextRequest('http://localhost/api/seo-autopilot/blog-response', { headers: { 'x-seo-public-path': '/de/blog', rsc: '1', 'next-router-state-tree': 'partial-tree' } }))
  expect(response.headers.get('content-type')).toBe('text/x-component')
  expect(new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).get('next-router-state-tree')).toBeNull()
  expect(String(vi.mocked(fetch).mock.calls[1][0])).toBe('http://127.0.0.1:3000/de/blog?_rsc=')
  expect(isBlogRender('/de/blog?_rsc=', new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers))).toBe(true)
  expect(isBlogRender('/de/blog', new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers))).toBe(true)
})
it.each(['//evil.test', '/\\evil.test', '/login', 'https://evil.test'])('does not use arbitrary gateway target %s', async (path) => {
  expect((await route(path)).status).toBe(404)
  expect(fetch).not.toHaveBeenCalled()
})
it('returns 503 for unavailable auth configuration', async () => {
  auth.create.mockImplementationOnce(() => { throw new Error('missing auth configuration') })
  expect((await proxy(request('/registrieren?from=messen'))).status).toBe(503)
})
it('keeps profile reads and metadata writes out of the authenticated proxy and overwrites a spoofed gate path', async () => {
  const from = vi.fn(() => { throw new Error('No database queries in the proxy') })
  const updateUser = vi.fn(() => { throw new Error('No metadata writes in the proxy') })
  auth.create.mockReturnValue({ from, auth: { getUser: async () => ({ data: { user: { id: 'local', user_metadata: {} } } }), updateUser } })
  const protectedResponse = await proxy(new NextRequest('https://www.basaltemperatur.online/dashboard', { headers: { 'x-app-path': '/onboarding' } }))
  expect(protectedResponse.headers.get('x-middleware-request-x-app-path')).toBe('/dashboard')
  const sourceResponse = await proxy(request('/login?from=messen'))
  expect(sourceResponse.headers.get('x-middleware-rewrite')).toContain('/auth/source?from=messen')
  expect(from).not.toHaveBeenCalled()
  expect(updateUser).not.toHaveBeenCalled()
})
