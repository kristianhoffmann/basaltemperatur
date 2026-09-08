// app/api/seo-autopilot/admin-users/route.ts
// Ein einzelnes Konto entfernen, angestossen aus dem Fleet-Dashboard.
// Gleiche HMAC-Pruefung wie publish und admin-stats — hier deckt sie einen
// Rumpf ab, der wirklich ausgewertet wird, und das Fuenf-Minuten-Fenster
// verhindert, dass ein mitgeschnittener Aufruf spaeter erneut loescht.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySignature } from '@/lib/seo-autopilot/hmac'
import { deleteAccount, planAccountDeletion } from '@/lib/seo-autopilot/account-deletion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 })
}

export async function POST(req: NextRequest) {
  if (!process.env.SEO_AUTOPILOT_SECRET) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const signature = req.headers.get('x-autopilot-signature')
  const timestamp = req.headers.get('x-autopilot-timestamp')
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'missing_headers' }, { status: 401 })
  }

  const rawBody = await req.text()
  const verification = verifySignature(signature, timestamp, rawBody)
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 401 })
  }

  let payload: { scope?: string; userId?: unknown; email?: unknown; dryRun?: unknown }
  try {
    payload = JSON.parse(rawBody || '{}')
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (payload.scope !== 'admin-user-delete') {
    return NextResponse.json({ error: 'unsupported_scope' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const input = { userId: payload.userId, email: payload.email }
  const result = payload.dryRun
    ? await planAccountDeletion(supabase, input)
    : await deleteAccount(supabase, input)

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status })
  }
  if (!payload.dryRun) {
    // Loeschungen gehoeren ins Log: Die Zeile ist der einzige Nachweis, dass es
    // dieses Konto gab.
    console.warn('[admin-users] deleted', JSON.stringify({ id: result.user.id, email: result.user.email }))
  }
  return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
