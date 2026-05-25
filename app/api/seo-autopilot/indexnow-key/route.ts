import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export function GET() {
  const key = process.env.SEO_AUTOPILOT_INDEXNOW_KEY
  if (!key) {
    return new NextResponse('Not configured', { status: 404 })
  }
  return new NextResponse(key, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
