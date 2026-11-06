import { signPayload } from './hmac'
import { isConfiguredAdminEmail } from '@/lib/adminAccess'

const CONVERSION_ENDPOINT = 'https://www.seoautopilot.cloud/api/conversions/track'

export interface AttributionData {
  postId?: string
  slug?: string
  locale?: string
  keyword?: string
}

export interface ConversionEvent {
  eventName: 'signup' | 'activation' | 'checkout_started' | 'purchase'
  conversions?: number
  revenue?: number
  currency?: string
  occurredOn?: string
  idempotencyKey: string
}

export function buildConversionPayload(
  siteId: string,
  event: ConversionEvent,
  attribution: AttributionData,
  occurredAt = new Date(),
) {
  return {
    siteId,
    postId: attribution.postId,
    slug: attribution.slug,
    locale: attribution.locale,
    keyword: attribution.keyword,
    eventName: event.eventName,
    conversions: event.conversions ?? 1,
    revenue: event.revenue ?? 0,
    currency: event.currency ?? 'EUR',
    occurredOn: event.occurredOn ?? occurredAt.toISOString(),
    ...(event.idempotencyKey ? { idempotencyKey: event.idempotencyKey } : {}),
  }
}

export async function trackConversion(
  event: ConversionEvent,
  attribution: AttributionData
): Promise<void> {
  const siteId = process.env.SEO_AUTOPILOT_SITE_ID?.trim()
  if (!siteId || !(process.env.SEO_AUTOPILOT_SECRET?.trim() || process.env.SEO_AUTOPILOT_WEBHOOK_SECRET?.trim())) return

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const body = JSON.stringify(buildConversionPayload(siteId, event, attribution))

  // Never let analytics block or slow the signup path.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)
  try {
    const signature = signPayload(timestamp, body)
    const response = await fetch(CONVERSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopilot-signature': signature,
        'x-autopilot-timestamp': timestamp,
      },
      body,
      signal: controller.signal,
    })
    if (!response.ok) console.error('[seo-autopilot] Conversion rejected:', response.status)
  } catch {
    console.error('[seo-autopilot] Conversion delivery failed')
  } finally {
    clearTimeout(timeout)
  }
}

export interface ConversionAccount {
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

export function shouldTrackAccount(account: ConversionAccount): boolean {
  const email = account.email?.trim().toLowerCase()
  const excluded = (process.env.SEO_AUTOPILOT_EXCLUDED_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase())
  return Boolean(email) && !isConfiguredAdminEmail(email) && !excluded.includes(email!) &&
    !/@(?:example\.(?:com|org|net)|[^@]+\.(?:test|invalid|localhost))$/.test(email!) &&
    !/^(?:test|qa|e2e)(?:[+._-]|@)/.test(email!) &&
    account.app_metadata?.role !== 'admin' && account.app_metadata?.is_admin !== true &&
    account.app_metadata?.is_test !== true && account.user_metadata?.is_test !== true
}
