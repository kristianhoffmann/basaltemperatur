import type { Database } from '@/types/database'

export type TrafficEvent = Database['public']['Tables']['traffic_events']['Row']

export function parseUserAgent(userAgent: string | null | undefined) {
  const ua = userAgent || ''
  const lower = ua.toLowerCase()

  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|whatsapp|telegrambot|discordbot|linkedinbot|pinterest|ahrefs|semrush|mj12|uptime|monitor/i.test(ua)
  const botName = isBot
    ? (/googlebot/i.test(ua) ? 'Googlebot'
      : /bingbot/i.test(ua) ? 'Bingbot'
        : /facebookexternalhit/i.test(ua) ? 'Facebook'
          : /linkedinbot/i.test(ua) ? 'LinkedIn'
            : /whatsapp/i.test(ua) ? 'WhatsApp'
              : /telegrambot/i.test(ua) ? 'Telegram'
                : 'Bot')
    : null

  const browser = /edg\//i.test(ua) ? 'Edge'
    : /chrome|crios/i.test(ua) && !/edg\//i.test(ua) ? 'Chrome'
      : /safari/i.test(ua) && !/chrome|crios/i.test(ua) ? 'Safari'
        : /firefox|fxios/i.test(ua) ? 'Firefox'
          : /opr\//i.test(ua) ? 'Opera'
            : 'Unbekannt'

  const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS'
    : /android/i.test(ua) ? 'Android'
      : /mac os x|macintosh/i.test(ua) ? 'macOS'
        : /windows/i.test(ua) ? 'Windows'
          : /linux/i.test(ua) ? 'Linux'
            : 'Unbekannt'

  const deviceType = /ipad|tablet/i.test(ua) ? 'tablet'
    : /mobile|iphone|ipod|android/i.test(lower) ? 'mobile'
      : 'desktop'

  return { browser, os, deviceType, isBot, botName }
}

export function getReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function normalizePath(path: string | null | undefined): string {
  if (!path) return '/'
  try {
    const url = path.startsWith('http') ? new URL(path) : new URL(path, 'https://local.invalid')
    return url.pathname || '/'
  } catch {
    return path.startsWith('/') ? path.split('?')[0] || '/' : '/'
  }
}

function isSensitiveQueryKey(key: string) {
  const normalized = key.toLowerCase()
  return normalized === 'code'
    || normalized === 'otp'
    || normalized === 'state'
    || normalized === 'email'
    || normalized === 'phone'
    || normalized.includes('token')
    || normalized.includes('secret')
    || normalized.includes('password')
}

export function redactSearchParams(searchParams: URLSearchParams) {
  const redacted = new URLSearchParams(searchParams)
  for (const key of [...redacted.keys()]) {
    if (isSensitiveQueryKey(key)) {
      redacted.set(key, '[redacted]')
    }
  }
  return redacted
}

export function sanitizeQueryString(value: unknown, maxLength = 1000): string | null {
  const raw = truncate(value, maxLength)
  if (!raw) return null

  try {
    const query = raw.startsWith('?') ? raw.slice(1) : raw
    const params = redactSearchParams(new URLSearchParams(query))
    return truncate(params.toString(), maxLength)
  } catch {
    return null
  }
}

export function sanitizeUrl(value: unknown, maxLength = 1200): string | null {
  const raw = truncate(value, maxLength)
  if (!raw) return null

  try {
    const url = new URL(raw, 'https://local.invalid')
    url.search = redactSearchParams(url.searchParams).toString()
    url.hash = ''

    if (url.hostname === 'local.invalid') {
      return truncate(`${url.pathname}${url.search}`, maxLength)
    }

    return truncate(url.toString(), maxLength)
  } catch {
    return null
  }
}

export function sourceLabel(event: Pick<TrafficEvent, 'utm_source' | 'referrer_host'>): string {
  if (event.utm_source) return event.utm_source
  if (event.referrer_host) return event.referrer_host
  return 'Direkt'
}

export function truncate(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

export function toNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round(value)
}
