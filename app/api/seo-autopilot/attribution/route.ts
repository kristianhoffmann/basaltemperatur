import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const COOKIE_NAME = 'seo_autopilot_attribution'
const MAX_AGE = 30 * 24 * 60 * 60

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { postId, slug, locale, keyword } = body as Record<string, unknown>

  const data = JSON.stringify({
    postId: typeof postId === 'string' ? postId : undefined,
    slug: typeof slug === 'string' ? slug : undefined,
    locale: typeof locale === 'string' ? locale : undefined,
    keyword: typeof keyword === 'string' ? keyword : undefined,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, data, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return res
}
