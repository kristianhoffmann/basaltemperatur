import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifySignature } from '@/lib/seo-autopilot/hmac'

export const runtime = 'nodejs'

const ALLOWED_TAG_PATTERNS = [
  /^post:[a-z]{2}:[a-z0-9-]+$/,
  /^blog-index:[a-z]{2}$/,
  /^sitemap:[a-z]{2}$/,
]

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-autopilot-signature')
  const timestamp = req.headers.get('x-autopilot-timestamp')

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await req.text()

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

  if (
    typeof json !== 'object' ||
    json === null ||
    !Array.isArray((json as Record<string, unknown>).tags)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const tags = (json as { tags: unknown[] }).tags
  const invalidated: string[] = []

  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    if (!ALLOWED_TAG_PATTERNS.some((p) => p.test(tag))) continue
    revalidateTag(tag, { expire: 0 })
    invalidated.push(tag)
  }

  return NextResponse.json({ ok: true, invalidated })
}
