import type { MetadataRoute } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.basaltemperatur.online').replace(/\/$/, '')

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
