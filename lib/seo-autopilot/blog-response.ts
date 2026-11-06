import { createHmac, timingSafeEqual } from 'node:crypto'

// Internal rendering re-enters Next through loopback. A short-lived signature,
// bound to the exact path, prevents public requests bypassing the response boundary.
function renderSecret() {
  const secret = process.env.SEO_AUTOPILOT_SECRET?.trim() || process.env.SEO_AUTOPILOT_WEBHOOK_SECRET?.trim() ||
    process.env.SEO_AUTOPILOT_SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!secret) throw new Error('Blog render signing is not configured')
  return secret
}
function digest(path: string, timestamp: string) {
  // Next removes its RSC cache-buster before invoking the proxy. It does not
  // select content, so sign the same content path on both sides of that step.
  const url = new URL(path, 'http://render.invalid')
  url.searchParams.delete('_rsc')
  const contentPath = `${url.pathname}${url.search}`
  return createHmac('sha256', renderSecret()).update(`blog-render:${timestamp}:${contentPath}`).digest('hex')
}
export function signBlogRender(path: string) {
  const timestamp = String(Date.now())
  return `${timestamp}.${digest(path, timestamp)}`
}
export function isBlogRender(path: string, headers: Headers) {
  const [timestamp, signature] = (headers.get('x-seo-render') ?? '').split('.')
  if (!/^\d+$/.test(timestamp ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? '') || Math.abs(Date.now() - Number(timestamp)) > 30_000) return false
  try { return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest(path, timestamp), 'hex')) }
  catch { return false }
}
