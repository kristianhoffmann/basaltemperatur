import { signPayload } from './hmac'

const CONVERSION_ENDPOINT =
  'https://seoautopilot-mocha.vercel.app/api/conversions/track'

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
    occurredOn: new Date().toISOString(),
  })

  const signature = signPayload(timestamp, body)

  try {
    await fetch(CONVERSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autopilot-signature': signature,
        'x-autopilot-timestamp': timestamp,
      },
      body,
    })
  } catch (err) {
    console.error('[seo-autopilot] Conversion tracking failed:', err)
  }
}
