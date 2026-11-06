import { blogUrl } from '@/lib/blog-urls'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

export async function notifyIndexNow(locale: string, slug: string) {
  const key = process.env.SEO_AUTOPILOT_INDEXNOW_KEY?.trim()
  if (!key) return
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: new URL(getSeoSiteUrl()).host, key,
        keyLocation: `${getSeoSiteUrl()}/${key}.txt`, urlList: [blogUrl(locale, slug)] }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) console.error('[seo] IndexNow rejected submission:', response.status)
  } catch (error) {
    console.error('[seo] IndexNow unavailable:', error instanceof Error ? error.message : 'Unknown error')
  }
}
