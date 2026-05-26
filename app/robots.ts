import type { MetadataRoute } from 'next'
import { getSeoSiteUrl } from '@/lib/seo-site-url'

const siteUrl = getSeoSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
