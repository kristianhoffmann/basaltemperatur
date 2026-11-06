import { NextResponse } from 'next/server'

// Legacy endpoint: URL-only attribution no longer writes browser identifiers.
export async function POST() {
  return NextResponse.json({ error: 'Use the from URL parameter.' }, { status: 410 })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('seo_autopilot_attribution')
  return response
}
