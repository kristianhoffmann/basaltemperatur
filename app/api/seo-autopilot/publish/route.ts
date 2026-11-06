import { after, NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifySignature } from '@/lib/seo-autopilot/hmac'
import { publishPayloadSchema } from '@/lib/seo-autopilot/schema'
import { upsertPost, listPosts } from '@/lib/seo-autopilot/storage'

import { reviewSubmission } from '@/lib/seo-autopilot/editorial'
import { blogUrl } from '@/lib/blog-urls'
import { notifyIndexNow } from '@/lib/seo-autopilot/indexnow'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-autopilot-signature')
  const timestamp = req.headers.get('x-autopilot-timestamp')

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'missing_headers' }, { status: 401 })
  }

  const rawBody = await req.text()

  if (!(process.env.SEO_AUTOPILOT_SECRET?.trim() || process.env.SEO_AUTOPILOT_WEBHOOK_SECRET?.trim())) {
    return NextResponse.json({ error: 'Signing not configured' }, { status: 503, headers: { 'Retry-After': '60' } })
  }

  const verification = verifySignature(signature, timestamp, rawBody)
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = publishPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const payload = parsed.data
  if (!process.env.SEO_AUTOPILOT_SITE_ID?.trim()) {
    return NextResponse.json({ error: 'Site not configured' }, { status: 503, headers: { 'Retry-After': '60' } })
  }
  if (payload.siteId !== process.env.SEO_AUTOPILOT_SITE_ID.trim()) {
    return NextResponse.json({ error: 'Site mismatch' }, { status: 403 })
  }
  try {
    await upsertPost(payload)
  } catch (err) {
    console.error('[seo-autopilot] Storage error:', err)
    return NextResponse.json({ error: 'Storage error' }, { status: 503, headers: { 'Retry-After': '60' } })
  }

  const { locale, slug } = parsed.data
  revalidateTag(`post:${locale}:${slug}`, { expire: 0 })
  revalidateTag(`blog-index:${locale}`, { expire: 0 })
  revalidateTag(`sitemap:${locale}`, { expire: 0 })

  let warnings: ReturnType<typeof reviewSubmission> | undefined
  try {
    warnings = reviewSubmission(payload, await listPosts(locale))
    if (warnings.overlappingSlugs.length || warnings.contentIssues.length || !warnings.topics.length) {
      console.warn('[seo-autopilot] Editorial warnings:', { locale, slug, ...warnings })
    }
  } catch (err) {
    console.warn('[seo-autopilot] Editorial review unavailable:', err)
  }

  after(() => notifyIndexNow(locale, slug))
  return NextResponse.json({ ok: true, published: true, url: blogUrl(locale, slug), warnings }, { status: 200 })
}
