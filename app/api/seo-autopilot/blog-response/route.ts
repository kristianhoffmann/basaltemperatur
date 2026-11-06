import { NextRequest, NextResponse } from 'next/server'
import { getCachedPost, getCachedPosts } from '@/app/[locale]/blog/posts'
import { BLOG_PAGE_SIZE, blogPage } from '@/lib/blog-pagination'
import { authorPath, blogUrl } from '@/lib/blog-urls'
import { BLOG_TOPICS } from '@/lib/seo-autopilot/discovery'
import { internalRedirect } from '@/lib/seo-autopilot/source'
import { signBlogRender } from '@/lib/seo-autopilot/blog-response'
import { contentUnavailable } from '@/lib/seo-autopilot/unavailable'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

export const dynamic = 'force-dynamic'
function missing() {
  return new Response('<!doctype html><html lang="de"><head><meta name="robots" content="noindex,follow"><title>Seite nicht gefunden | Basaltemperatur</title></head><body><h1>Seite nicht gefunden</h1><a href="/de/blog">Zum Blog</a></body></html>', {
    status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: NextRequest) {
  const path = request.headers.get('x-seo-public-path')
  if (!path || internalRedirect(path, '') !== path) return missing()
  const url = new URL(path, getSeoSiteUrl())
  const pathname = url.pathname
  if (!/^\/(?:de\/)?blog(?:\/|$)/.test(pathname)) return missing()
  try {
    // Full content/existence checks belong here, never in the middleware/proxy.
    const posts = await getCachedPosts('de')
    if (pathname === '/blog' || /^\/blog\/[^/]+$/.test(pathname)) {
      const slug = pathname.split('/')[2]
      if (slug && !(await getCachedPost('de', decodeURIComponent(slug)))) return missing()
      return NextResponse.redirect(`${blogUrl('de', slug)}${url.search}`, 308)
    }
    const topic = pathname.match(/^\/de\/blog\/themen\/([^/]+)$/)
    const author = pathname.match(/^\/de\/blog\/autor\/([^/]+)$/)
    const article = pathname.match(/^\/de\/blog\/([^/]+)$/)
    if (topic) {
      if (!BLOG_TOPICS.some((entry) => entry.slug === topic[1])) return missing()
    } else if (author) {
      const name = decodeURIComponent(author[1]).trim().toLocaleLowerCase('de-DE')
      const authored = posts.find((post) => post.author?.name?.trim().toLocaleLowerCase('de-DE') === name)
      if (!authored?.author?.name) return missing()
      if (!(await getCachedPost('de', authored.slug))) return missing()
      const canonical = authorPath(authored.author.name)
      if (pathname !== canonical) return NextResponse.redirect(new URL(canonical, getSeoSiteUrl()), 308)
    } else if (pathname === '/de/blog') {
      const values = url.searchParams.getAll('page')
      const page = blogPage(values.length > 1 ? values : values[0])
      if (!page || page > Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE))) return missing()
      if (values[0] === '1') {
        url.searchParams.delete('page')
        return NextResponse.redirect(url, 308)
      }
    } else if (article) {
      if (!(await getCachedPost('de', decodeURIComponent(article[1])))) return missing()
    } else return missing()

    // Next binds _rsc to router-state headers. We request a complete tree below,
    // so the internal request needs the matching empty-state cache key.
    const renderUrl = new URL(path, 'http://render.invalid')
    if (request.headers.get('rsc') === '1') renderUrl.searchParams.set('_rsc', '')
    else renderUrl.searchParams.delete('_rsc')
    const renderPath = `${renderUrl.pathname}${renderUrl.search}`
    const headers = new Headers({ 'x-seo-render': signBlogRender(renderPath) })
    // Request a complete RSC tree, including on client navigations/prefetches.
    // Never forward cookies, authorization, host, or partial router state.
    for (const name of ['rsc', 'user-agent', 'accept']) {
      const value = request.headers.get(name)
      if (value) headers.set(name, value)
    }
    const port = process.env.PORT || '3000'
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid render port')
    const rendered = await fetch(`http://127.0.0.1:${port}${renderPath}`, {
      headers, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(30_000),
    })
    // Buffer before committing the public status. A database failure in a page
    // may otherwise leave an HTTP 200 streaming shell. The marker is emitted by
    // BlogHeader only after all of that page's required storage reads succeeded.
    const body = await rendered.text()
    if (rendered.status >= 500 || (rendered.status === 200 && !body.includes('seo-content-ready'))) return contentUnavailable()
    const responseHeaders = new Headers(rendered.headers)
    for (const name of ['content-length', 'content-encoding', 'transfer-encoding', 'connection', 'set-cookie']) responseHeaders.delete(name)
    responseHeaders.set('Cache-Control', 'no-store')
    return new Response(body, { status: rendered.status, headers: responseHeaders })
  } catch (error) {
    console.error('[seo] Blog response unavailable:', error instanceof Error ? error.message : 'Unknown storage error')
    return contentUnavailable()
  }
}
