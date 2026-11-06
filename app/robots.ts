import type { MetadataRoute } from 'next'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

const siteUrl = getSeoSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
        disallow: [
          // Rendering assets remain crawlable for search and AI crawlers.
          '/dashboard',
          '/eintrag',
          '/kalender',
          '/statistiken',
          '/zyklen',
          '/export',
          '/einstellungen',
          '/onboarding',
          '/erfolg',
          '/login',
          '/registrieren',
          '/passwort-vergessen',
          '/passwort-aendern',
          '/auth/',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
