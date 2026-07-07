import { signPayload } from './hmac'

const CONVERSION_ENDPOINT = process.env.SEO_AUTOPILOT_APP_URL
  ? `${process.env.SEO_AUTOPILOT_APP_URL.replace(/\/+$/, '')}/api/conversions/track`
  : 'https://www.seoautopilot.cloud/api/conversions/track'

export interface AttributionData {
  postId?: string
  slug?: string
  locale?: string
  keyword?: string
}

export interface ConversionEvent {
  eventName: string
  conversions?: number
  revenue?: number
  currency?: string
}

export async function trackConversion(
  event: ConversionEvent,
  attribution: AttributionData
): Promise<void> {
  const siteId = process.env.SEO_AUTOPILOT_SITE_ID
  if (!siteId) return

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const body = JSON.stringify({
    siteId,
    postId: attribution.postId,
    slug: attribution.slug,
    locale: attribution.locale,
    keyword: attribution.keyword,
    eventName: event.eventName,
    conversions: event.conversions ?? 1,
    revenue: event.revenue ?? 0,
    currency: event.currency ?? 'EUR',
    occurredOn: new Date().toISOString().slice(0, 10),
  })

  const signature = signPayload(timestamp, body)

  // Never let analytics block or slow the signup path.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)
  try {
    await fetch(CONVERSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopilot-signature': signature,
        'x-autopilot-timestamp': timestamp,
      },
      body,
      signal: controller.signal,
    })
  } catch (err) {
    console.error('[seo-autopilot] Conversion tracking failed:', err)
  } finally {
    clearTimeout(timeout)
  }
}
