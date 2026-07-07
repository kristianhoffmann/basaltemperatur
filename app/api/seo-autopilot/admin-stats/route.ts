// app/api/seo-autopilot/admin-stats/route.ts
// Signed read-only stats endpoint for the central SEO-Autopilot fleet dashboard.
// Same HMAC scheme as the publish endpoint (x-autopilot-signature / x-autopilot-timestamp).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySignature } from '@/lib/seo-autopilot/hmac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const PROJECT = 'basaltemperatur'
const MAX_USERS = 1000

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const cutoff7d = now - 7 * DAY
  const cutoff30d = now - 30 * DAY

  // ---- Users (service-role admin API) ----
  const authUsers: Array<{
    id: string
    email?: string
    created_at?: string
    last_sign_in_at?: string | null
    email_confirmed_at?: string | null
    confirmed_at?: string | null
  }> = []

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: MAX_USERS,
    })
    if (!error && data?.users) {
      authUsers.push(...(data.users as typeof authUsers))
    }
  } catch (err) {
    console.error('[admin-stats] listUsers error:', err)
  }

  // ---- Profile plan/role map (has_lifetime_access -> premium) ----
  const planByUserId = new Map<string, { plan: string; source: string | null }>()
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, has_lifetime_access, entitlement_source')
    if (!error && profiles) {
      for (const p of profiles as Array<{
        id: string
        has_lifetime_access: boolean | null
        entitlement_source: string | null
      }>) {
        planByUserId.set(p.id, {
          plan: p.has_lifetime_access ? 'premium' : 'free',
          source: p.entitlement_source ?? null,
        })
      }
    }
  } catch (err) {
    console.error('[admin-stats] profiles error:', err)
  }

  const isConfirmed = (u: (typeof authUsers)[number]) =>
    Boolean(u.email_confirmed_at || u.confirmed_at)

  let confirmed = 0
  let newLast7d = 0
  let newLast30d = 0
  let activeLast30d = 0

  for (const u of authUsers) {
    if (isConfirmed(u)) confirmed++
    const created = u.created_at ? Date.parse(u.created_at) : NaN
    if (!Number.isNaN(created)) {
      if (created >= cutoff7d) newLast7d++
      if (created >= cutoff30d) newLast30d++
    }
    const lastSignIn = u.last_sign_in_at ? Date.parse(u.last_sign_in_at) : NaN
    if (!Number.isNaN(lastSignIn) && lastSignIn >= cutoff30d) activeLast30d++
  }

  const list = authUsers
    .map((u) => {
      const p = planByUserId.get(u.id)
      return {
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: isConfirmed(u),
        plan: p?.plan ?? 'free',
        role: null as string | null,
      }
    })
    .sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0
      return tb - ta
    })
    .slice(0, MAX_USERS)

  // ---- Revenue (lifetime access via Stripe; no recurring MRR) ----
  let revenue:
    | { provider: 'stripe'; activeSubscriptions: number; mrrEur: number | null }
    | null = null
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('has_lifetime_access', true)
      .eq('entitlement_source', 'stripe')
    if (!error) {
      revenue = {
        provider: 'stripe',
        activeSubscriptions: count ?? 0,
        mrrEur: null, // lifetime access, not a recurring subscription
      }
    }
  } catch (err) {
    console.error('[admin-stats] revenue error:', err)
  }

  // ---- Domain KPIs (per-table try/catch) ----
  const domainStats: Array<{ key: string; label: string; value: number }> = []

  const countRows = async (table: string) => {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  }

  try {
    domainStats.push({
      key: 'profiles',
      label: 'Profile',
      value: await countRows('profiles'),
    })
  } catch (err) {
    console.error('[admin-stats] profiles count error:', err)
  }

  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('has_lifetime_access', true)
    if (error) throw error
    domainStats.push({ key: 'premium_users', label: 'Premium-Nutzer', value: count ?? 0 })
  } catch (err) {
    console.error('[admin-stats] premium count error:', err)
  }

  try {
    domainStats.push({
      key: 'cycles',
      label: 'Zyklen',
      value: await countRows('cycles'),
    })
  } catch (err) {
    console.error('[admin-stats] cycles count error:', err)
  }

  try {
    domainStats.push({
      key: 'temperature_entries',
      label: 'Temperatur-Einträge',
      value: await countRows('temperature_entries'),
    })
  } catch (err) {
    console.error('[admin-stats] temperature_entries count error:', err)
  }

  try {
    domainStats.push({
      key: 'period_entries',
      label: 'Perioden-Einträge',
      value: await countRows('period_entries'),
    })
  } catch (err) {
    console.error('[admin-stats] period_entries count error:', err)
  }

  const responseBody = {
    version: 1,
    project: PROJECT,
    generatedAt: new Date().toISOString(),
    users: {
      total: authUsers.length,
      confirmed,
      newLast7d,
      newLast30d,
      activeLast30d,
      list,
    },
    revenue,
    domainStats,
  }

  return NextResponse.json(responseBody, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
