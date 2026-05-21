import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isConfiguredAdminEmail } from '@/lib/adminAccess'
import {
  getReferrerHost,
  normalizePath,
  parseUserAgent,
  sanitizeQueryString,
  sanitizeUrl,
  toNumber,
  truncate,
} from '@/lib/traffic'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 16_384
const EVENT_TYPES = new Set(['pageview', 'conversion', 'custom'])

function getTrafficHashSalt() {
  const salt = process.env.TRAFFIC_HASH_SALT?.trim()

  if (salt) return salt

  if (process.env.NODE_ENV === 'production') {
    throw new Error('TRAFFIC_HASH_SALT must be configured in production before traffic analytics can store IP hashes.')
  }

  return 'development-traffic-hash-salt'
}

function hashIp(ip: string | null) {
  if (!ip) return null
  return createHmac('sha256', getTrafficHashSalt()).update(ip).digest('hex')
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || null
}

function firstSearchParam(url: URL, key: string) {
  return truncate(url.searchParams.get(key), 200)
}

function parseTrackingUrl(fullUrl: string | null, path: string, requestUrl: string) {
  try {
    return fullUrl ? new URL(fullUrl) : new URL(path, requestUrl)
  } catch {
    return new URL(path, requestUrl)
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 204 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new NextResponse(null, { status: 204 })
    }

    const eventType = EVENT_TYPES.has(body.eventType) ? body.eventType : 'pageview'
    const visitorId = truncate(body.visitorId, 80)
    const sessionId = truncate(body.sessionId, 80)
    const path = normalizePath(truncate(body.path, 500) || '/')
    const rawFullUrl = truncate(body.url, 1200)
    const parsedUrl = parseTrackingUrl(rawFullUrl, path, request.url)
    const fullUrl = sanitizeUrl(parsedUrl.toString())
    const referrer = sanitizeUrl(body.referrer)
    const userAgent = request.headers.get('user-agent')
    const parsedUa = parseUserAgent(userAgent)
    const isIosApp = body.connectionType === 'ios-app'

    if (!visitorId || !sessionId) {
      return new NextResponse(null, { status: 204 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin = user ? isConfiguredAdminEmail(user.email) : false

    const admin = createAdminClient()
    const { error } = await admin.from('traffic_events').insert({
      event_type: eventType,
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: user?.id || null,
      is_admin: isAdmin,
      path,
      full_url: fullUrl,
      query_string: sanitizeQueryString(body.search) || sanitizeQueryString(parsedUrl.search),
      title: truncate(body.title, 300),
      referrer,
      referrer_host: getReferrerHost(referrer),
      utm_source: firstSearchParam(parsedUrl, 'utm_source'),
      utm_medium: firstSearchParam(parsedUrl, 'utm_medium'),
      utm_campaign: firstSearchParam(parsedUrl, 'utm_campaign'),
      utm_content: firstSearchParam(parsedUrl, 'utm_content'),
      utm_term: firstSearchParam(parsedUrl, 'utm_term'),
      language: truncate(body.language, 40),
      timezone: truncate(body.timezone, 80),
      viewport_width: toNumber(body.viewportWidth),
      viewport_height: toNumber(body.viewportHeight),
      screen_width: toNumber(body.screenWidth),
      screen_height: toNumber(body.screenHeight),
      color_scheme: body.colorScheme === 'dark' ? 'dark' : 'light',
      connection_type: truncate(body.connectionType, 40),
      user_agent: truncate(userAgent, 1200),
      browser: isIosApp ? 'iOS App' : parsedUa.browser,
      os: isIosApp ? 'iOS' : parsedUa.os,
      device_type: isIosApp ? 'mobile' : parsedUa.deviceType,
      is_bot: parsedUa.isBot,
      bot_name: parsedUa.botName,
      ip_hash: hashIp(getClientIp(request)),
      country: truncate(request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry'), 2),
      region: truncate(request.headers.get('x-vercel-ip-country-region'), 120),
      city: truncate(request.headers.get('x-vercel-ip-city'), 120),
      metadata: {
        languages: Array.isArray(body.languages) ? body.languages.slice(0, 6) : [],
      },
    })

    if (error) {
      console.error('traffic insert failed', error.message)
    }
  } catch (error) {
    console.error('traffic route failed', error)
  }

  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
