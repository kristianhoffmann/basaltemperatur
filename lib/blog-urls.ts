import { getSeoSiteUrl } from './seo-site-url'

export const WITHDRAWN_SLUGS = new Set([
  'verhuetung-ohne-hormone-vier-gruppen',
  'fruchtbare-tage-berechnen-methoden-zyklus',
  'ovulation-tracking-app-basaltemperatur',
])

export function blogPath(locale = 'de', slug?: string) {
  return `/${encodeURIComponent(locale)}/blog${slug ? `/${encodeURIComponent(slug)}` : ''}`
}

export function blogUrl(locale = 'de', slug?: string) {
  return `${getSeoSiteUrl()}${blogPath(locale, slug)}`
}

export function topicPath(topic: string, locale = 'de') {
  return `${blogPath(locale)}/themen/${encodeURIComponent(topic)}`
}

export function authorPath(name: string, locale = 'de') {
  return `${blogPath(locale)}/autor/${encodeURIComponent(name.trim().toLocaleLowerCase('de-DE'))}`
}
