import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifySignature } from '@/lib/seo-autopilot/hmac'
import { publishPayloadSchema } from '@/lib/seo-autopilot/schema'
import { upsertPost } from '@/lib/seo-autopilot/storage'

export const runtime = 'nodejs'

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

  const parsed = publishPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await upsertPost(parsed.data)
  } catch (err) {
    console.error('[seo-autopilot] Storage error:', err)
    return NextResponse.json({ error: 'Storage error' }, { status: 500 })
  }

  const { locale, slug } = parsed.data
  revalidateTag(`post:${locale}:${slug}`, { expire: 0 })
  revalidateTag(`blog-index:${locale}`, { expire: 0 })
  revalidateTag(`sitemap:${locale}`, { expire: 0 })

  return NextResponse.json({ ok: true }, { status: 200 })
}
