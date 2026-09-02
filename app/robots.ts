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
          // Die JS-Bundles kosten das Crawl-Budget, das die Seiten brauchen.
          //
          // Gemessen am 02.09.2026 ueber die Crawling-Statistik der Search Console: Die
          // beiden Projekte der Flotte, die /_next/ sperren, verwenden 59-62 % ihrer
          // Abrufe auf HTML und 30 % auf das Entdecken neuer Seiten. Die acht, die es
          // nicht taten, lagen bei 9-14 % HTML und 3-7 % Auffindbarkeit — bei
          // TrainingFlow gingen 63 % aller Abrufe in JavaScript.
          //
          // Der Grund ist der Build: Next.js vergibt bei jedem Deploy neue Dateinamen
          // fuer die Chunks, also holt Googlebot sie jedes Mal komplett neu. Bei 200 bis
          // 1.000 Abrufen im Quartal bleibt danach fuer Seiten kaum etwas uebrig.
          //
          // Gesperrt werden nur die Bundles. /_next/static/css/ und /_next/image
          // bleiben abrufbar, damit Google Layout und Bilder weiterhin bewerten kann —
          // die Inhalte stehen ohnehin serverseitig im HTML.
          '/_next/static/chunks/',
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
